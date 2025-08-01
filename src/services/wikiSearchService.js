/**
 * Wiki Search Service
 * 整合URL构建、HTTP请求和结果解析功能，提供完整的搜索服务
 */

const SearchUrlBuilder = require('./searchUrlBuilder');
const SearchResultsParser = require('./searchResultsParser');
const { HttpClient } = require('../utils/httpClient');
const { logger, logOperation, logError } = require('../utils/logger');

class WikiSearchService {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'https://zh.minecraft.wiki';
        this.httpClient = options.httpClient || new HttpClient();
        this.urlBuilder = new SearchUrlBuilder(this.baseUrl);
        this.parser = new SearchResultsParser();
        
        // 缓存配置
        this.cache = new Map();
        this.cacheEnabled = options.enableCache !== false;
        this.cacheTtl = options.cacheTtl || 300000; // 5分钟默认缓存
        this.maxCacheSize = options.maxCacheSize || 1000;
        
        // 搜索配置
        this.defaultOptions = {
            limit: 10,
            namespaces: ['0'], // 默认只搜索主命名空间
            profile: 'advanced',
            fulltext: true,
            ...options.searchDefaults
        };
    }

    /**
     * 执行Wiki搜索
     * @param {string} keyword - 搜索关键词
     * @param {Object} options - 搜索选项
     * @param {number} options.limit - 结果数量限制
     * @param {Array<string>} options.namespaces - 搜索的命名空间
     * @param {string} options.profile - 搜索配置文件
     * @param {boolean} options.fulltext - 是否全文搜索
     * @param {boolean} options.useCache - 是否使用缓存
     * @returns {Promise<Object>} 搜索结果
     */
    async search(keyword, options = {}) {
        const startTime = Date.now();
        
        try {
            // 参数验证
            if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
                throw new Error('搜索关键词不能为空');
            }

            // 合并选项
            const searchOptions = { ...this.defaultOptions, ...options };
            const normalizedKeyword = keyword.trim();

            logOperation('wiki_search_start', {
                keyword: normalizedKeyword,
                options: searchOptions
            });

            // 检查缓存
            const cacheKey = this._generateCacheKey(normalizedKeyword, searchOptions);
            if (this.cacheEnabled && searchOptions.useCache !== false) {
                const cachedResult = this._getFromCache(cacheKey);
                if (cachedResult) {
                    logOperation('wiki_search_cache_hit', {
                        keyword: normalizedKeyword,
                        cacheKey,
                        duration: `${Date.now() - startTime}ms`
                    });
                    return cachedResult;
                }
            }

            // 构建搜索URL
            const searchUrl = this.urlBuilder.buildSearchUrl(normalizedKeyword, searchOptions);
            
            logOperation('wiki_search_url_built', {
                keyword: normalizedKeyword,
                url: searchUrl
            });

            // 发送HTTP请求
            const response = await this.httpClient.get(searchUrl);
            
            if (response.status !== 200) {
                throw new Error(`HTTP请求失败: ${response.status} ${response.statusText}`);
            }

            // 解析搜索结果
            const searchResults = this.parser.parseSearchResults(response.data, normalizedKeyword);
            
            if (!searchResults.success) {
                throw new Error(`搜索结果解析失败: ${searchResults.error?.message || '未知错误'}`);
            }

            // 添加搜索元信息
            const enrichedResults = {
                ...searchResults,
                meta: {
                    searchUrl,
                    keyword: normalizedKeyword,
                    options: searchOptions,
                    duration: `${Date.now() - startTime}ms`,
                    cached: false
                }
            };

            // 缓存结果
            if (this.cacheEnabled && searchOptions.useCache !== false) {
                this._setCache(cacheKey, enrichedResults);
            }

            logOperation('wiki_search_completed', {
                keyword: normalizedKeyword,
                resultCount: searchResults.data.results.length,
                totalCount: searchResults.data.totalCount,
                duration: enrichedResults.meta.duration,
                cached: false
            });

            return enrichedResults;

        } catch (error) {
            const errorInfo = {
                keyword,
                options,
                duration: `${Date.now() - startTime}ms`,
                error: error.message
            };

            logError(error, errorInfo);

            // 返回错误格式的响应
            return {
                success: false,
                error: {
                    code: this._getErrorCode(error),
                    message: error.message,
                    details: error.details || null
                },
                meta: {
                    keyword,
                    options,
                    duration: errorInfo.duration
                },
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 搜索建议
     * @param {string} keyword - 搜索关键词
     * @param {Object} options - 搜索选项
     * @returns {Promise<Array>} 建议列表
     */
    async getSuggestions(keyword, options = {}) {
        try {
            const searchResults = await this.search(keyword, { 
                ...options, 
                limit: 5 // 建议只需要少量结果
            });

            if (!searchResults.success) {
                return [];
            }

            // 尝试从搜索页面提取建议
            const searchUrl = this.urlBuilder.buildSearchUrl(keyword, options);
            const response = await this.httpClient.get(searchUrl);
            const suggestions = this.parser.extractSuggestions(response.data);

            return suggestions;
        } catch (error) {
            logError(error, { keyword, context: 'getSuggestions' });
            return [];
        }
    }

    /**
     * 检查是否有搜索结果
     * @param {string} keyword - 搜索关键词
     * @param {Object} options - 搜索选项
     * @returns {Promise<boolean>} 是否有结果
     */
    async hasResults(keyword, options = {}) {
        try {
            const searchResults = await this.search(keyword, {
                ...options,
                limit: 1, // 只需要检查是否有结果
                useCache: false // 不使用缓存以获取最新状态
            });

            return searchResults.success && searchResults.data.results.length > 0;
        } catch (error) {
            logError(error, { keyword, context: 'hasResults' });
            return false;
        }
    }

    /**
     * 清除缓存
     * @param {string} keyword - 可选，清除特定关键词的缓存
     */
    clearCache(keyword = null) {
        if (keyword) {
            // 清除特定关键词的所有缓存
            const keysToDelete = [];
            for (const key of this.cache.keys()) {
                if (key.includes(keyword)) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach(key => this.cache.delete(key));
            
            logOperation('cache_cleared_selective', { keyword, count: keysToDelete.length });
        } else {
            // 清除所有缓存
            const count = this.cache.size;
            this.cache.clear();
            
            logOperation('cache_cleared_all', { count });
        }
    }

    /**
     * 获取缓存统计信息
     * @returns {Object} 缓存统计
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            enabled: this.cacheEnabled,
            ttl: this.cacheTtl
        };
    }

    /**
     * 更新搜索配置
     * @param {Object} options - 新的配置选项
     */
    updateConfig(options = {}) {
        if (options.baseUrl) {
            this.baseUrl = options.baseUrl;
            this.urlBuilder = new SearchUrlBuilder(this.baseUrl);
        }
        
        if (options.enableCache !== undefined) {
            this.cacheEnabled = options.enableCache;
        }
        
        if (options.cacheTtl) {
            this.cacheTtl = options.cacheTtl;
        }
        
        if (options.maxCacheSize) {
            this.maxCacheSize = options.maxCacheSize;
        }
        
        if (options.searchDefaults) {
            this.defaultOptions = { ...this.defaultOptions, ...options.searchDefaults };
        }

        logOperation('search_service_config_updated', options);
    }

    /**
     * 生成缓存键
     * @private
     */
    _generateCacheKey(keyword, options) {
        const keyParts = [
            'search',
            encodeURIComponent(keyword),
            options.limit || this.defaultOptions.limit,
            (options.namespaces || this.defaultOptions.namespaces).join(','),
            options.profile || this.defaultOptions.profile
        ];
        return keyParts.join(':');
    }

    /**
     * 从缓存获取结果
     * @private
     */
    _getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) {
            return null;
        }

        // 检查是否过期
        if (Date.now() - cached.timestamp > this.cacheTtl) {
            this.cache.delete(key);
            return null;
        }

        // 标记为缓存结果
        return {
            ...cached.data,
            meta: {
                ...cached.data.meta,
                cached: true
            }
        };
    }

    /**
     * 设置缓存
     * @private
     */
    _setCache(key, data) {
        // 如果缓存已满，删除最旧的条目
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * 获取错误代码
     * @private
     */
    _getErrorCode(error) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return 'NETWORK_ERROR';
        }
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            return 'TIMEOUT_ERROR';
        }
        if (error.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
            return 'NETWORK_ERROR';
        }
        if (error.message.includes('HTTP请求失败')) {
            return 'HTTP_ERROR';
        }
        if (error.message.includes('解析失败')) {
            return 'PARSE_ERROR';
        }
        if (error.message.includes('关键词不能为空')) {
            return 'INVALID_PARAMETER';
        }
        return 'UNKNOWN_ERROR';
    }
}

module.exports = WikiSearchService;