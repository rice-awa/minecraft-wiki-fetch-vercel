/**
 * JSON格式化中间件
 * 根据请求参数决定是否格式化JSON响应
 */

const { logger } = require('../utils/logger');

/**
 * JSON格式化中间件
 * 支持通过查询参数 pretty 控制JSON格式化
 * 
 * 使用方式:
 * - ?pretty=true 或 ?pretty=1 - 格式化JSON输出
 * - ?pretty=false 或 ?pretty=0 或不传参数 - 压缩JSON输出
 */
function jsonFormatterMiddleware() {
    return (req, res, next) => {
        // 保存原始的 res.json 方法
        const originalJson = res.json;
        
        // 重写 res.json 方法
        res.json = function(obj) {
            // 检查是否需要格式化
            const shouldPretty = isPrettyRequested(req.query.pretty);
            
            if (shouldPretty) {
                // 格式化JSON输出
                const prettyJson = JSON.stringify(obj, null, 2);
                
                // 设置响应头
                res.set({
                    'Content-Type': 'application/json; charset=utf-8',
                    'X-JSON-Formatted': 'true'
                });
                
                // 记录格式化请求
                logger.debug('JSON响应已格式化', {
                    url: req.originalUrl,
                    method: req.method,
                    contentLength: prettyJson.length
                });
                
                return res.send(prettyJson);
            } else {
                // 使用原始方法（压缩输出）
                res.set('X-JSON-Formatted', 'false');
                return originalJson.call(this, obj);
            }
        };
        
        next();
    };
}

/**
 * 检查是否请求格式化输出
 * @param {string|boolean|Array} prettyParam - pretty参数值
 * @returns {boolean} 是否需要格式化
 */
function isPrettyRequested(prettyParam) {
    if (prettyParam === undefined || prettyParam === null) {
        return false;
    }
    
    // 如果是数组（多个相同参数），取第一个值
    if (Array.isArray(prettyParam)) {
        prettyParam = prettyParam[0];
    }
    
    // 字符串类型检查
    if (typeof prettyParam === 'string') {
        const lowerParam = prettyParam.toLowerCase();
        return lowerParam === 'true' || lowerParam === '1' || lowerParam === 'yes';
    }
    
    // 布尔类型检查
    if (typeof prettyParam === 'boolean') {
        return prettyParam;
    }
    
    // 数字类型检查
    if (typeof prettyParam === 'number') {
        return prettyParam === 1;
    }
    
    return false;
}

/**
 * 验证pretty参数的中间件
 * 确保参数值有效
 */
function validatePrettyParam(req, res, next) {
    const { pretty } = req.query;
    
    if (pretty !== undefined) {
        const validValues = ['true', 'false', '1', '0', 'yes', 'no'];
        const lowerPretty = String(pretty).toLowerCase();
        
        if (!validValues.includes(lowerPretty)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PRETTY_PARAMETER',
                    message: 'pretty参数值无效',
                    details: {
                        received: pretty,
                        validValues: ['true', 'false', '1', '0', 'yes', 'no']
                    },
                    timestamp: new Date().toISOString()
                }
            });
        }
    }
    
    next();
}

module.exports = {
    jsonFormatterMiddleware,
    validatePrettyParam,
    isPrettyRequested
};