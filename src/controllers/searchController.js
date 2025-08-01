/**
 * Search API Controller
 * 处理搜索相关的API请求
 */

const WikiSearchService = require('../services/wikiSearchService');
const { logger } = require('../utils/logger');

class SearchController {
    constructor() {
        this.searchService = new WikiSearchService();
    }

    /**
     * 搜索Wiki内容
     * GET /api/search
     * 
     * 查询参数:
     * - q: 搜索关键词 (必需)
     * - limit: 结果数量限制 (可选, 默认10, 最大50)
     * - namespaces: 命名空间 (可选, 默认主命名空间)
     * - format: 响应格式 (可选, 默认json)
     */
    async search(req, res) {
        const startTime = Date.now();
        
        try {
            // 参数验证
            const validation = this.validateSearchParams(req.query);
            if (!validation.isValid) {
                return this.sendErrorResponse(res, 400, 'INVALID_PARAMETERS', validation.errors.join('; '));
            }

            const { q: keyword, limit, namespaces, format } = validation.params;

            // 记录请求日志
            logger.info('搜索请求', {
                keyword,
                limit,
                namespaces,
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });

            // 执行搜索
            const searchResult = await this.searchService.search(keyword, {
                limit,
                namespaces: namespaces ? namespaces.split(',') : undefined
            });

            const duration = Date.now() - startTime;

            if (searchResult.success) {
                // 成功响应
                const response = {
                    success: true,
                    data: {
                        query: keyword,
                        results: searchResult.data.results,
                        pagination: {
                            limit,
                            totalHits: searchResult.data.totalHits,
                            hasMore: searchResult.data.results.length >= limit && searchResult.data.totalHits > limit
                        },
                        metadata: {
                            searchTime: duration,
                            fromCache: searchResult.data.fromCache,
                            timestamp: new Date().toISOString()
                        }
                    }
                };

                logger.info('搜索成功', {
                    keyword,
                    resultCount: searchResult.data.results.length,
                    totalHits: searchResult.data.totalHits,
                    duration,
                    fromCache: searchResult.data.fromCache
                });

                return res.json(response);

            } else {
                // 搜索失败
                logger.warn('搜索失败', {
                    keyword,
                    error: searchResult.error.message,
                    duration
                });

                return this.sendErrorResponse(
                    res, 
                    500, 
                    searchResult.error.code || 'SEARCH_ERROR',
                    searchResult.error.message
                );
            }

        } catch (error) {
            const duration = Date.now() - startTime;
            
            logger.error('搜索接口异常', {
                error: error.message,
                stack: error.stack,
                query: req.query,
                duration
            });

            return this.sendErrorResponse(res, 500, 'INTERNAL_SERVER_ERROR', '搜索服务暂时不可用');
        }
    }

    /**
     * 验证搜索参数
     * @private
     */
    validateSearchParams(query) {
        const errors = [];
        const params = {};

        // 验证关键词
        if (!query.q || typeof query.q !== 'string') {
            errors.push('缺少搜索关键词参数 q');
        } else if (query.q.trim().length === 0) {
            errors.push('搜索关键词不能为空');
        } else if (query.q.length > 200) {
            errors.push('搜索关键词长度不能超过200个字符');
        } else {
            params.q = query.q.trim();
        }

        // 验证限制数量
        if (query.limit !== undefined) {
            const limit = parseInt(query.limit);
            if (isNaN(limit) || limit < 1) {
                errors.push('limit参数必须是大于0的整数');
            } else if (limit > 50) {
                errors.push('limit参数不能超过50');
            } else {
                params.limit = limit;
            }
        } else {
            params.limit = 10; // 默认值
        }

        // 验证命名空间
        if (query.namespaces !== undefined) {
            if (typeof query.namespaces !== 'string') {
                errors.push('namespaces参数必须是字符串');
            } else {
                params.namespaces = query.namespaces;
            }
        }

        // 验证格式
        if (query.format !== undefined) {
            if (!['json'].includes(query.format)) {
                errors.push('format参数只支持json格式');
            } else {
                params.format = query.format;
            }
        } else {
            params.format = 'json';
        }

        return {
            isValid: errors.length === 0,
            errors,
            params
        };
    }

    /**
     * 发送错误响应
     * @private
     */
    sendErrorResponse(res, statusCode, errorCode, message, details = null) {
        const response = {
            success: false,
            error: {
                code: errorCode,
                message,
                details,
                timestamp: new Date().toISOString()
            }
        };

        return res.status(statusCode).json(response);
    }

    /**
     * 获取搜索统计信息
     * GET /api/search/stats
     */
    async getStats(req, res) {
        try {
            const cacheStats = this.searchService.getCacheStats();
            
            const response = {
                success: true,
                data: {
                    cache: cacheStats,
                    service: {
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        timestamp: new Date().toISOString()
                    }
                }
            };

            return res.json(response);

        } catch (error) {
            logger.error('获取搜索统计失败', { error: error.message });
            return this.sendErrorResponse(res, 500, 'STATS_ERROR', '获取统计信息失败');
        }
    }
}

module.exports = SearchController;