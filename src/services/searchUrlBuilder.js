/**
 * Search URL Builder for Minecraft Wiki
 * Handles URL construction for wiki search with proper encoding
 */

class SearchUrlBuilder {
    constructor(baseUrl = 'https://zh.minecraft.wiki') {
        this.baseUrl = baseUrl;
        this.searchPath = '/';
    }

    /**
     * Build search URL with proper encoding for Chinese keywords (matches MC Wiki format)
     * @param {string} keyword - Search keyword
     * @param {Object} options - Search options
     * @param {number} options.limit - Maximum number of results (default: 20)
     * @param {Array<string>} options.namespaces - Array of namespace IDs (default: ['0'])
     * @param {string} options.profile - Search profile (default: 'advanced')
     * @param {boolean} options.fulltext - Enable fulltext search (default: true)
     * @param {boolean} options.includeSearchToken - Include searchToken parameter (default: false)
     * @returns {string} Complete search URL
     */
    buildSearchUrl(keyword, options = {}) {
        if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
            throw new Error('Keyword must be a non-empty string');
        }

        const {
            limit = 20,
            namespaces = ['0'],
            profile = 'advanced',
            fulltext = true,
            includeSearchToken = false
        } = options;

        // Validate parameters
        if (limit < 1 || limit > 500) {
            throw new Error('Limit must be between 1 and 500');
        }

        const searchParams = new URLSearchParams({
            search: keyword.trim(),
            title: 'Special:搜索',
            profile: profile,
            fulltext: fulltext ? '1' : '0',
            limit: limit.toString()
        });

        // Add namespace parameters in MC Wiki format (ns0=1, ns9994=1, etc.)
        namespaces.forEach(ns => {
            searchParams.set(`ns${ns}`, '1');
        });

        // Add searchToken only if requested (optional for functionality)
        if (includeSearchToken) {
            searchParams.set('searchToken', this.generateSearchToken());
        }

        return `${this.baseUrl}${this.searchPath}?${searchParams.toString()}`;
    }

    /**
     * Build search URL for specific namespaces (deprecated - use buildSearchUrl with namespaces option)
     * @param {string} keyword - Search keyword
     * @param {Array<string>} namespaces - Array of namespace IDs
     * @param {Object} options - Additional options
     * @returns {string} Complete search URL
     */
    buildNamespaceSearchUrl(keyword, namespaces = ['0'], options = {}) {
        return this.buildSearchUrl(keyword, { ...options, namespaces });
    }

    /**
     * Generate a search token (simplified version)
     * @returns {string} Random search token
     */
    generateSearchToken() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    /**
     * Build page URL for MC Wiki
     * @param {string} pageName - Page name
     * @returns {string} Complete page URL
     */
    buildPageUrl(pageName) {
        if (!pageName || typeof pageName !== 'string' || pageName.trim() === '') {
            throw new Error('Page name must be a non-empty string');
        }
        
        return `${this.baseUrl}/w/${encodeURIComponent(pageName.trim())}`;
    }

    /**
     * Get available namespace mappings for MC Wiki
     * @returns {Object} Namespace ID to name mappings
     */
    getNamespaces() {
        return {
            '0': 'Main',           // 主要
            '1': 'Talk',           // 讨论
            '2': 'User',           // 用户
            '3': 'User_talk',      // 用户讨论
            '4': 'Project',        // 项目
            '5': 'Project_talk',   // 项目讨论
            '6': 'File',           // 文件
            '7': 'File_talk',      // 文件讨论
            '8': 'MediaWiki',      // MediaWiki
            '9': 'MediaWiki_talk', // MediaWiki讨论
            '10': 'Template',      // 模板
            '11': 'Template_talk', // 模板讨论
            '12': 'Help',          // 帮助
            '13': 'Help_talk',     // 帮助讨论
            '14': 'Category',      // 分类
            '15': 'Category_talk', // 分类讨论
            '9994': 'Module',      // 模块
            '9996': 'Gadget',      // 小工具
            '9998': 'Gadget_definition', // 小工具定义
            '10000': 'Data',       // 数据
            '10002': 'Data_talk',  // 数据讨论
            '10004': 'Widget',     // 小部件
            '10006': 'Widget_talk', // 小部件讨论
            '10010': 'Config'      // 配置
        };
    }

    /**
     * Get default MC Wiki namespaces for comprehensive search
     * @returns {Array<string>} Array of namespace IDs
     */
    getDefaultNamespaces() {
        return ['0', '9994', '9996', '9998', '10000', '10002', '10004', '10006', '10010'];
    }

    /**
     * Validate and normalize search keyword
     * @param {string} keyword - Raw keyword
     * @returns {string} Normalized keyword
     */
    normalizeKeyword(keyword) {
        if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
            throw new Error('Keyword must be a non-empty string');
        }

        return keyword.trim().replace(/\s+/g, ' ');
    }
}

module.exports = SearchUrlBuilder;