/**
 * Logger configuration and utilities
 * Provides structured logging with different levels and transports
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Ensure log directory exists (skip in serverless environments)
const logDir = config.logging.dir;
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTIONS_WORKER_RUNTIME;

if (!isServerless && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Custom log format for better readability
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]`;
    
    if (service) {
      log += ` [${service}]`;
    }
    
    log += `: ${message}`;
    
    // Add metadata if present
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return log + metaStr;
  })
);

/**
 * JSON format for structured logging in production
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create logger instance with configured transports
 */
const transports = [];
const exceptionHandlers = [];
const rejectionHandlers = [];

// Add file transports only in non-serverless environments
if (!isServerless && config.logging.file) {
  transports.push(
    // Error log file - only errors
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: jsonFormat
    }),
    
    // Combined log file - all levels
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: jsonFormat
    })
  );

  exceptionHandlers.push(
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: jsonFormat
    })
  );

  rejectionHandlers.push(
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: jsonFormat
    })
  );
}

const logger = winston.createLogger({
  level: config.logging.level,
  format: config.isProduction() ? jsonFormat : logFormat,
  defaultMeta: { 
    service: 'minecraft-wiki-api',
    version: process.env.npm_package_version || '1.0.0',
    environment: isServerless ? 'serverless' : 'traditional'
  },
  transports,
  exceptionHandlers,
  rejectionHandlers
});

// Add console transport in development and test environments
if (config.logging.console) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    )
  }));
}

/**
 * Create a child logger with additional context
 * @param {Object} meta - Additional metadata to include in all logs
 * @returns {winston.Logger} Child logger instance
 */
function createChildLogger(meta = {}) {
  return logger.child(meta);
}

/**
 * Log HTTP request information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} duration - Request duration in milliseconds
 */
function logRequest(req, res, duration) {
  const logData = {
    method: req.method,
    url: req.originalUrl || req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    contentLength: res.get('Content-Length') || 0
  };

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request Error', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
}

/**
 * Log API operation with structured data
 * @param {string} operation - Operation name (e.g., 'wiki_search', 'page_fetch')
 * @param {Object} data - Operation data
 * @param {string} level - Log level (default: 'info')
 */
function logOperation(operation, data = {}, level = 'info') {
  logger[level](`Operation: ${operation}`, {
    operation,
    ...data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log performance metrics
 * @param {string} metric - Metric name
 * @param {number} value - Metric value
 * @param {string} unit - Unit of measurement (e.g., 'ms', 'bytes')
 * @param {Object} tags - Additional tags for the metric
 */
function logMetric(metric, value, unit = '', tags = {}) {
  logger.info(`Metric: ${metric}`, {
    metric,
    value,
    unit,
    tags,
    timestamp: new Date().toISOString()
  });
}

/**
 * Log error with additional context
 * @param {Error} error - Error object
 * @param {Object} context - Additional context information
 */
function logError(error, context = {}) {
  logger.error('Error occurred', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    context,
    timestamp: new Date().toISOString()
  });
}

/**
 * Express middleware for request logging
 * @returns {Function} Express middleware function
 */
function requestLoggingMiddleware() {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Log request start
    logger.debug('Request started', {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    // Override res.end to capture response time
    const originalEnd = res.end;
    res.end = function(...args) {
      const duration = Date.now() - startTime;
      logRequest(req, res, duration);
      originalEnd.apply(this, args);
    };

    next();
  };
}

module.exports = {
  logger,
  createChildLogger,
  logRequest,
  logOperation,
  logMetric,
  logError,
  requestLoggingMiddleware
};