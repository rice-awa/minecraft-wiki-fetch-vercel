/**
 * 自定义错误类定义
 * 提供结构化的错误处理和统一的错误响应格式
 */

/**
 * 基础API错误类
 */
class APIError extends Error {
    constructor(message, code, statusCode = 500, details = null) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date().toISOString();
        
        // 确保错误堆栈正确
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * 转换为JSON格式的错误响应
     */
    toJSON() {
        return {
            success: false,
            error: {
                code: this.code,
                message: this.message,
                details: this.details,
                timestamp: this.timestamp
            }
        };
    }
}

/**
 * 验证错误 - 400
 */
class ValidationError extends APIError {
    constructor(message, details = null) {
        super(message, 'VALIDATION_ERROR', 400, details);
    }
}

/**
 * 参数错误 - 400
 */
class InvalidParametersError extends APIError {
    constructor(message, details = null) {
        super(message, 'INVALID_PARAMETERS', 400, details);
    }
}

/**
 * 认证错误 - 401
 */
class AuthenticationError extends APIError {
    constructor(message = '认证失败') {
        super(message, 'AUTHENTICATION_ERROR', 401);
    }
}

/**
 * 授权错误 - 403
 */
class AuthorizationError extends APIError {
    constructor(message = '访问被拒绝') {
        super(message, 'AUTHORIZATION_ERROR', 403);
    }
}

/**
 * 资源未找到错误 - 404
 */
class NotFoundError extends APIError {
    constructor(resource = '资源', details = null) {
        super(`${resource}未找到`, 'NOT_FOUND', 404, details);
    }
}

/**
 * 页面未找到错误 - 404
 */
class PageNotFoundError extends NotFoundError {
    constructor(pageName, suggestions = null) {
        super(`页面 "${pageName}"`, suggestions ? { suggestions } : null);
        this.code = 'PAGE_NOT_FOUND';
        this.pageName = pageName;
    }
}

/**
 * 方法不允许错误 - 405
 */
class MethodNotAllowedError extends APIError {
    constructor(method, allowedMethods = []) {
        super(`方法 ${method} 不被允许`, 'METHOD_NOT_ALLOWED', 405, { allowedMethods });
    }
}

/**
 * 冲突错误 - 409
 */
class ConflictError extends APIError {
    constructor(message, details = null) {
        super(message, 'CONFLICT', 409, details);
    }
}

/**
 * 速率限制错误 - 429
 */
class RateLimitError extends APIError {
    constructor(message = '请求过于频繁，请稍后再试', retryAfter = null) {
        super(message, 'RATE_LIMIT_EXCEEDED', 429, retryAfter ? { retryAfter } : null);
    }
}

/**
 * 服务不可用错误 - 503
 */
class ServiceUnavailableError extends APIError {
    constructor(service = '服务', retryAfter = null) {
        super(`${service}暂时不可用`, 'SERVICE_UNAVAILABLE', 503, retryAfter ? { retryAfter } : null);
    }
}

/**
 * 网络错误 - 502
 */
class NetworkError extends APIError {
    constructor(message = '网络请求失败', details = null) {
        super(message, 'NETWORK_ERROR', 502, details);
    }
}

/**
 * 超时错误 - 408
 */
class TimeoutError extends APIError {
    constructor(operation = '操作', timeout = null) {
        super(`${operation}超时`, 'TIMEOUT_ERROR', 408, timeout ? { timeout } : null);
    }
}

/**
 * 解析错误 - 500
 */
class ParseError extends APIError {
    constructor(message = '数据解析失败', details = null) {
        super(message, 'PARSE_ERROR', 500, details);
    }
}

/**
 * 转换错误 - 500
 */
class ConversionError extends APIError {
    constructor(message = '数据转换失败', details = null) {
        super(message, 'CONVERSION_ERROR', 500, details);
    }
}

/**
 * 内部服务器错误 - 500
 */
class InternalServerError extends APIError {
    constructor(message = '内部服务器错误', details = null) {
        super(message, 'INTERNAL_SERVER_ERROR', 500, details);
    }
}

/**
 * Wiki相关错误
 */
class WikiError extends APIError {
    constructor(message, code, statusCode = 500, details = null) {
        super(message, code, statusCode, details);
    }
}

/**
 * Wiki搜索错误
 */
class WikiSearchError extends WikiError {
    constructor(message = '搜索失败', details = null) {
        super(message, 'WIKI_SEARCH_ERROR', 500, details);
    }
}

/**
 * Wiki页面获取错误
 */
class WikiPageError extends WikiError {
    constructor(message = '页面获取失败', details = null) {
        super(message, 'WIKI_PAGE_ERROR', 500, details);
    }
}

/**
 * HTML获取错误
 */
class HTMLFetchError extends NetworkError {
    constructor(url, originalError = null) {
        super(`HTML内容获取失败: ${url}`, originalError ? { originalError: originalError.message } : null);
        this.code = 'HTML_FETCH_ERROR';
        this.url = url;
    }
}

/**
 * 错误工厂类
 * 用于创建和管理各种错误类型
 */
class ErrorFactory {
    /**
     * 根据错误代码创建相应的错误实例
     */
    static createError(code, message, details = null) {
        const errorMap = {
            'VALIDATION_ERROR': ValidationError,
            'INVALID_PARAMETERS': InvalidParametersError,
            'AUTHENTICATION_ERROR': AuthenticationError,
            'AUTHORIZATION_ERROR': AuthorizationError,
            'NOT_FOUND': NotFoundError,
            'PAGE_NOT_FOUND': PageNotFoundError,
            'METHOD_NOT_ALLOWED': MethodNotAllowedError,
            'CONFLICT': ConflictError,
            'RATE_LIMIT_EXCEEDED': RateLimitError,
            'SERVICE_UNAVAILABLE': ServiceUnavailableError,
            'NETWORK_ERROR': NetworkError,
            'TIMEOUT_ERROR': TimeoutError,
            'PARSE_ERROR': ParseError,
            'CONVERSION_ERROR': ConversionError,
            'INTERNAL_SERVER_ERROR': InternalServerError,
            'WIKI_SEARCH_ERROR': WikiSearchError,
            'WIKI_PAGE_ERROR': WikiPageError,
            'HTML_FETCH_ERROR': HTMLFetchError
        };

        const ErrorClass = errorMap[code] || APIError;
        
        if (ErrorClass === PageNotFoundError && details && details.pageName) {
            return new PageNotFoundError(details.pageName, details.suggestions);
        }
        
        if (ErrorClass === HTMLFetchError && details && details.url) {
            return new HTMLFetchError(details.url, details.originalError);
        }
        
        return new ErrorClass(message, details);
    }

    /**
     * 从普通错误对象创建API错误
     */
    static fromError(error, defaultCode = 'INTERNAL_SERVER_ERROR') {
        if (error instanceof APIError) {
            return error;
        }

        // 检查是否是已知的错误类型
        if (error.code && error.message) {
            // 处理JSON解析错误
            if (error.code === 'INVALID_JSON') {
                return this.createError('INVALID_PARAMETERS', error.message);
            }
            
            return this.createError(error.code, error.message, error.details);
        }

        // 处理Express body parser错误
        if (error.type === 'entity.parse.failed') {
            return this.createError('INVALID_PARAMETERS', 'JSON格式错误');
        }

        if (error.type === 'entity.too.large') {
            return this.createError('INVALID_PARAMETERS', '请求体过大');
        }

        // 处理常见的Node.js错误
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return new NetworkError(`网络连接失败: ${error.message}`, { originalError: error.code });
        }

        if (error.code === 'ETIMEDOUT') {
            return new TimeoutError('请求超时', { timeout: error.timeout });
        }

        // 默认情况
        return new InternalServerError(error.message || '内部服务器错误', { originalError: error.name });
    }

    /**
     * 检查错误是否为客户端错误 (4xx)
     */
    static isClientError(error) {
        return error instanceof APIError && error.statusCode >= 400 && error.statusCode < 500;
    }

    /**
     * 检查错误是否为服务器错误 (5xx)
     */
    static isServerError(error) {
        return error instanceof APIError && error.statusCode >= 500;
    }
}

module.exports = {
    // 基础错误类
    APIError,
    
    // 客户端错误 (4xx)
    ValidationError,
    InvalidParametersError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    PageNotFoundError,
    MethodNotAllowedError,
    ConflictError,
    TimeoutError,
    RateLimitError,
    
    // 服务器错误 (5xx)
    InternalServerError,
    ServiceUnavailableError,
    NetworkError,
    ParseError,
    ConversionError,
    
    // Wiki特定错误
    WikiError,
    WikiSearchError,
    WikiPageError,
    HTMLFetchError,
    
    // 工具类
    ErrorFactory
};