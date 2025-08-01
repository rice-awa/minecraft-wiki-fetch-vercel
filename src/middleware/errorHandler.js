/**
 * 错误处理中间件
 * 提供统一的错误处理、响应格式化和错误记录
 */

const { APIError, ErrorFactory } = require('../utils/errors');
const { logger } = require('../utils/logger');
const config = require('../config');

/**
 * 异步错误包装器
 * 自动捕获异步路由处理函数中的错误
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * 404错误处理中间件
 * 处理未找到的路由
 */
function notFoundHandler(req, res, next) {
    const error = ErrorFactory.createError(
        'NOT_FOUND',
        `端点 ${req.method} ${req.originalUrl} 不存在`,
        {
            method: req.method,
            url: req.originalUrl,
            availableEndpoints: [
                'GET /api/search',
                'GET /api/page/:pageName',
                'POST /api/pages',
                'GET /health'
            ]
        }
    );
    
    next(error);
}

/**
 * 全局错误处理中间件
 * 统一处理所有错误并返回标准化响应
 */
function errorHandler(err, req, res, next) {
    let error = err;

    // 转换为标准API错误格式
    if (!(error instanceof APIError)) {
        error = ErrorFactory.fromError(err);
    }

    // 构建错误日志信息
    const logData = {
        error: {
            name: error.name,
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            stack: error.stack
        },
        request: {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            body: req.body,
            params: req.params,
            query: req.query
        },
        timestamp: new Date().toISOString()
    };

    // 根据错误类型选择不同的日志级别
    if (ErrorFactory.isClientError(error)) {
        // 客户端错误 (4xx) - 使用warn级别
        logger.warn('客户端错误', logData);
    } else if (ErrorFactory.isServerError(error)) {
        // 服务器错误 (5xx) - 使用error级别
        logger.error('服务器错误', logData);
    } else {
        // 其他错误 - 使用error级别
        logger.error('未知错误', logData);
    }

    // 构建响应数据
    const response = {
        success: false,
        error: {
            code: error.code,
            message: config.isProduction() ? getProductionMessage(error) : error.message,
            ...(error.details && { details: error.details }),
            timestamp: error.timestamp || new Date().toISOString()
        }
    };

    // 在开发环境中包含错误堆栈
    if (config.isDevelopment() && error.stack) {
        response.error.stack = error.stack;
    }

    // 设置相应的HTTP头
    res.set({
        'Content-Type': 'application/json; charset=utf-8',
        'X-Request-ID': req.id || generateRequestId()
    });

    // 对于特定错误类型，设置额外的HTTP头
    if (error.code === 'RATE_LIMIT_EXCEEDED' && error.details && error.details.retryAfter) {
        res.set('Retry-After', error.details.retryAfter);
    }

    if (error.code === 'METHOD_NOT_ALLOWED' && error.details && error.details.allowedMethods) {
        res.set('Allow', error.details.allowedMethods.join(', '));
    }

    // 发送错误响应
    res.status(error.statusCode).json(response);
}

/**
 * 请求验证中间件
 * 验证请求的基本格式和内容
 */
function validateRequest(options = {}) {
    const {
        maxBodySize = '10mb',
        allowedContentTypes = ['application/json', 'application/x-www-form-urlencoded'],
        requireContentType = false
    } = options;

    return (req, res, next) => {
        try {
            // 检查Content-Type (仅对有body的请求)
            if (requireContentType && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
                const contentType = req.get('Content-Type');
                if (!contentType) {
                    throw ErrorFactory.createError(
                        'INVALID_PARAMETERS',
                        '缺少Content-Type头',
                        { required: 'Content-Type header is required' }
                    );
                }

                const baseContentType = contentType.split(';')[0].trim();
                if (!allowedContentTypes.includes(baseContentType)) {
                    throw ErrorFactory.createError(
                        'INVALID_PARAMETERS',
                        `不支持的Content-Type: ${baseContentType}`,
                        { allowedTypes: allowedContentTypes }
                    );
                }
            }

            // 检查请求体大小 (如果有的话)
            const contentLength = req.get('Content-Length');
            if (contentLength) {
                const sizeLimit = parseSize(maxBodySize);
                if (parseInt(contentLength) > sizeLimit) {
                    throw ErrorFactory.createError(
                        'INVALID_PARAMETERS',
                        `请求体过大，最大允许 ${maxBodySize}`,
                        { maxSize: maxBodySize, currentSize: contentLength }
                    );
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}

/**
 * 参数清理中间件
 * 清理和规范化请求参数
 */
function sanitizeParams(req, res, next) {
    try {
        // 清理查询参数
        if (req.query) {
            req.query = sanitizeObject(req.query);
        }

        // 清理路径参数
        if (req.params) {
            req.params = sanitizeObject(req.params);
        }

        // 清理请求体
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }

        next();
    } catch (error) {
        next(ErrorFactory.createError(
            'INVALID_PARAMETERS',
            '参数清理失败',
            { originalError: error.message }
        ));
    }
}

/**
 * 请求ID生成中间件
 * 为每个请求生成唯一ID用于追踪
 */
function requestIdHandler(req, res, next) {
    req.id = req.get('X-Request-ID') || generateRequestId();
    res.set('X-Request-ID', req.id);
    next();
}

/**
 * CORS错误处理中间件
 * 处理CORS相关的错误
 */
function corsErrorHandler(req, res, next) {
    // 检查是否是预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 检查Origin头
    const origin = req.get('Origin');
    if (origin && !isAllowedOrigin(origin)) {
        return next(ErrorFactory.createError(
            'AUTHORIZATION_ERROR',
            '不允许的来源域名',
            { origin, allowedOrigins: getAllowedOrigins() }
        ));
    }

    next();
}

/**
 * 生产环境错误消息处理
 * 在生产环境中隐藏敏感错误信息
 */
function getProductionMessage(error) {
    const safeMessages = {
        'VALIDATION_ERROR': '请求参数验证失败',
        'INVALID_PARAMETERS': '请求参数无效',
        'AUTHENTICATION_ERROR': '认证失败',
        'AUTHORIZATION_ERROR': '访问被拒绝',
        'NOT_FOUND': '请求的资源不存在',
        'PAGE_NOT_FOUND': '页面不存在',
        'METHOD_NOT_ALLOWED': '请求方法不被允许',
        'CONFLICT': '请求冲突',
        'RATE_LIMIT_EXCEEDED': '请求过于频繁，请稍后再试',
        'TIMEOUT_ERROR': '请求超时',
        'SERVICE_UNAVAILABLE': '服务暂时不可用',
        'NETWORK_ERROR': '网络请求失败',
        'PARSE_ERROR': '数据解析失败',
        'CONVERSION_ERROR': '数据转换失败',
        'WIKI_SEARCH_ERROR': '搜索服务暂时不可用',
        'WIKI_PAGE_ERROR': '页面服务暂时不可用',
        'HTML_FETCH_ERROR': '内容获取失败'
    };

    return safeMessages[error.code] || '服务器内部错误';
}

/**
 * 辅助函数：生成请求ID
 */
function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 辅助函数：解析大小字符串
 */
function parseSize(sizeStr) {
    const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
    const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
    
    if (!match) {
        throw new Error(`Invalid size format: ${sizeStr}`);
    }
    
    const [, size, unit = 'b'] = match;
    return parseFloat(size) * units[unit];
}

/**
 * 辅助函数：清理对象中的危险字符
 */
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            // 移除潜在的XSS字符
            sanitized[key] = value
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/javascript:/gi, '')
                .replace(/on\w+\s*=/gi, '')
                .trim();
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item => 
                typeof item === 'string' ? sanitizeObject({ temp: item }).temp : item
            );
        } else if (typeof value === 'object') {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * 辅助函数：检查是否是允许的来源域名
 */
function isAllowedOrigin(origin) {
    const allowedOrigins = getAllowedOrigins();
    return allowedOrigins.includes('*') || allowedOrigins.includes(origin);
}

/**
 * 辅助函数：获取允许的来源域名列表
 */
function getAllowedOrigins() {
    return process.env.ALLOWED_ORIGINS ? 
        process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : 
        ['*'];
}

module.exports = {
    asyncHandler,
    notFoundHandler,
    errorHandler,
    validateRequest,
    sanitizeParams,
    requestIdHandler,
    corsErrorHandler
};