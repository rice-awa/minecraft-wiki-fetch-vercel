/**
 * Tests for HTTP client utility
 */

const axios = require('axios');

// Mock axios to avoid real HTTP requests in tests
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    },
    defaults: {
      headers: {}
    }
  }))
}));

const { HttpClient, createHttpClient } = require('../src/utils/httpClient');

describe('HTTP Client', () => {
  let httpClient;

  beforeEach(() => {
    jest.clearAllMocks();
    httpClient = new HttpClient({
      baseURL: 'https://test.example.com',
      timeout: 5000,
      maxRetries: 2
    });
  });

  describe('HttpClient Class', () => {
    test('should create instance with default configuration', () => {
      const client = new HttpClient();
      const config = client.getConfig();
      
      expect(config.baseURL).toBeDefined();
      expect(config.timeout).toBeDefined();
      expect(config.maxRetries).toBeDefined();
      expect(config.userAgent).toBeDefined();
    });

    test('should create instance with custom configuration', () => {
      const customConfig = {
        baseURL: 'https://custom.example.com',
        timeout: 10000,
        maxRetries: 5,
        userAgent: 'CustomAgent/1.0'
      };
      
      const client = new HttpClient(customConfig);
      const config = client.getConfig();
      
      expect(config.baseURL).toBe(customConfig.baseURL);
      expect(config.timeout).toBe(customConfig.timeout);
      expect(config.maxRetries).toBe(customConfig.maxRetries);
      expect(config.userAgent).toBe(customConfig.userAgent);
    });

    test('should update configuration', () => {
      const newConfig = {
        timeout: 15000,
        maxRetries: 3
      };
      
      httpClient.updateConfig(newConfig);
      const config = httpClient.getConfig();
      
      expect(config.timeout).toBe(newConfig.timeout);
      expect(config.maxRetries).toBe(newConfig.maxRetries);
    });
  });

  describe('Error Handling', () => {
    test('should identify retryable errors', () => {
      const networkError = { code: 'ECONNRESET' };
      const timeoutError = { code: 'ETIMEDOUT' };
      const serverError = { response: { status: 500 } };
      const clientError = { response: { status: 404 } };
      
      expect(httpClient.isRetryableError(networkError)).toBe(true);
      expect(httpClient.isRetryableError(timeoutError)).toBe(true);
      expect(httpClient.isRetryableError(serverError)).toBe(true);
      expect(httpClient.isRetryableError(clientError)).toBe(false);
    });
  });

  describe('Factory Functions', () => {
    test('should create new client instance', () => {
      const client = createHttpClient({ timeout: 8000 });
      expect(client).toBeInstanceOf(HttpClient);
      expect(client.getConfig().timeout).toBe(8000);
    });
  });
});