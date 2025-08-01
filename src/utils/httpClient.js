/**
 * HTTP Client utility with retry mechanism, timeout, and proper User-Agent
 * Handles all HTTP requests to external services with error handling
 */

const axios = require('axios');
const config = require('../config');
const { logger, logOperation, logError } = require('./logger');

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after the specified time
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (0-based)
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {number} Delay in milliseconds
 */
function calculateBackoffDelay(attempt, baseDelay = 1000) {
  return Math.min(baseDelay * Math.pow(2, attempt), 10000); // Max 10 seconds
}

/**
 * HTTP Client class with retry mechanism and proper configuration
 */
class HttpClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || config.wiki.baseUrl;
    this.timeout = options.timeout || config.wiki.requestTimeout;
    this.maxRetries = options.maxRetries || config.wiki.maxRetries;
    this.userAgent = options.userAgent || config.wiki.userAgent;
    
    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      // Follow redirects
      maxRedirects: 5,
      // Validate status codes
      validateStatus: (status) => status < 500, // Don't throw for 4xx errors
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logOperation('http_request_start', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          timeout: config.timeout
        }, 'debug');
        return config;
      },
      (error) => {
        logError(error, { phase: 'request_interceptor' });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logOperation('http_request_success', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
          responseSize: response.data?.length || 0,
          headers: response.headers
        }, 'debug');
        return response;
      },
      (error) => {
        const errorData = {
          message: error.message,
          code: error.code,
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          status: error.response?.status,
          statusText: error.response?.statusText
        };
        
        logOperation('http_request_error', errorData, 'warn');
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Axios error object
   * @returns {boolean} True if error is retryable
   */
  isRetryableError(error) {
    // Network errors (no response)
    if (!error.response) {
      return ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'].includes(error.code);
    }

    // HTTP status codes that should be retried
    const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
    return retryableStatusCodes.includes(error.response.status);
  }

  /**
   * Make HTTP request with retry mechanism
   * @param {Object} requestConfig - Axios request configuration
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {Promise<Object>} Axios response object
   */
  async makeRequestWithRetry(requestConfig, attempt = 0) {
    try {
      const startTime = Date.now();
      const response = await this.client(requestConfig);
      const duration = Date.now() - startTime;

      logOperation('http_request_completed', {
        url: requestConfig.url,
        method: requestConfig.method?.toUpperCase(),
        status: response.status,
        duration: `${duration}ms`,
        attempt: attempt + 1,
        success: true
      });

      return response;
    } catch (error) {
      const isLastAttempt = attempt >= this.maxRetries;
      const isRetryable = this.isRetryableError(error);

      logOperation('http_request_failed', {
        url: requestConfig.url,
        method: requestConfig.method?.toUpperCase(),
        error: error.message,
        status: error.response?.status,
        attempt: attempt + 1,
        maxRetries: this.maxRetries + 1,
        isRetryable,
        isLastAttempt
      }, 'warn');

      // If this is the last attempt or error is not retryable, throw the error
      if (isLastAttempt || !isRetryable) {
        logError(error, {
          url: requestConfig.url,
          method: requestConfig.method?.toUpperCase(),
          finalAttempt: attempt + 1,
          totalAttempts: this.maxRetries + 1
        });
        throw error;
      }

      // Calculate delay and retry
      const delay = calculateBackoffDelay(attempt);
      logger.info(`Retrying request after ${delay}ms`, {
        url: requestConfig.url,
        attempt: attempt + 1,
        maxRetries: this.maxRetries + 1,
        delay: `${delay}ms`
      });

      await sleep(delay);
      return this.makeRequestWithRetry(requestConfig, attempt + 1);
    }
  }

  /**
   * Make GET request
   * @param {string} url - Request URL
   * @param {Object} config - Additional axios configuration
   * @returns {Promise<Object>} Axios response object
   */
  async get(url, config = {}) {
    return this.makeRequestWithRetry({
      method: 'GET',
      url,
      ...config
    });
  }

  /**
   * Make POST request
   * @param {string} url - Request URL
   * @param {*} data - Request data
   * @param {Object} config - Additional axios configuration
   * @returns {Promise<Object>} Axios response object
   */
  async post(url, data, config = {}) {
    return this.makeRequestWithRetry({
      method: 'POST',
      url,
      data,
      ...config
    });
  }

  /**
   * Make PUT request
   * @param {string} url - Request URL
   * @param {*} data - Request data
   * @param {Object} config - Additional axios configuration
   * @returns {Promise<Object>} Axios response object
   */
  async put(url, data, config = {}) {
    return this.makeRequestWithRetry({
      method: 'PUT',
      url,
      data,
      ...config
    });
  }

  /**
   * Make DELETE request
   * @param {string} url - Request URL
   * @param {Object} config - Additional axios configuration
   * @returns {Promise<Object>} Axios response object
   */
  async delete(url, config = {}) {
    return this.makeRequestWithRetry({
      method: 'DELETE',
      url,
      ...config
    });
  }

  /**
   * Get current configuration
   * @returns {Object} Current client configuration
   */
  getConfig() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      userAgent: this.userAgent
    };
  }

  /**
   * Update client configuration
   * @param {Object} newConfig - New configuration options
   */
  updateConfig(newConfig = {}) {
    if (newConfig.baseURL) this.baseURL = newConfig.baseURL;
    if (newConfig.timeout) this.timeout = newConfig.timeout;
    if (newConfig.maxRetries) this.maxRetries = newConfig.maxRetries;
    if (newConfig.userAgent) this.userAgent = newConfig.userAgent;

    // Update axios instance defaults
    this.client.defaults.baseURL = this.baseURL;
    this.client.defaults.timeout = this.timeout;
    this.client.defaults.headers['User-Agent'] = this.userAgent;

    logger.info('HTTP client configuration updated', this.getConfig());
  }
}

// Create default instance
const defaultHttpClient = new HttpClient();

/**
 * Create a new HTTP client instance with custom configuration
 * @param {Object} options - Client configuration options
 * @returns {HttpClient} New HTTP client instance
 */
function createHttpClient(options = {}) {
  return new HttpClient(options);
}

/**
 * Quick GET request using default client
 * @param {string} url - Request URL
 * @param {Object} config - Additional axios configuration
 * @returns {Promise<Object>} Axios response object
 */
async function get(url, config = {}) {
  return defaultHttpClient.get(url, config);
}

/**
 * Quick POST request using default client
 * @param {string} url - Request URL
 * @param {*} data - Request data
 * @param {Object} config - Additional axios configuration
 * @returns {Promise<Object>} Axios response object
 */
async function post(url, data, config = {}) {
  return defaultHttpClient.post(url, data, config);
}

module.exports = {
  HttpClient,
  createHttpClient,
  get,
  post,
  defaultHttpClient
};