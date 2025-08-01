/**
 * Search Results Parser for Minecraft Wiki
 * Parses HTML search results page and extracts structured data
 */

const cheerio = require('cheerio');

class SearchResultsParser {
    constructor() {
        this.baseUrl = 'https://zh.minecraft.wiki';
    }

    /**
     * Parse search results HTML and extract structured data
     * @param {string} html - Raw HTML from search results page
     * @param {string} keyword - Original search keyword for context
     * @returns {Object} Parsed search results with metadata
     */
    parseSearchResults(html, keyword = '') {
        if (!html || typeof html !== 'string') {
            throw new Error('HTML content must be a non-empty string');
        }

        const $ = cheerio.load(html);
        
        // Initialize result structure
        const result = {
            success: true,
            data: {
                results: [],
                totalCount: 0,
                hasMore: false,
                currentPage: 1,
                keyword: keyword.trim()
            },
            timestamp: new Date().toISOString()
        };

        try {
            // Extract search results
            result.data.results = this._extractSearchResults($);
            
            // Extract pagination and count information
            const paginationInfo = this._extractPaginationInfo($);
            result.data.totalCount = paginationInfo.totalCount;
            result.data.hasMore = paginationInfo.hasMore;
            result.data.currentPage = paginationInfo.currentPage;

            return result;
        } catch (error) {
            return {
                success: false,
                error: {
                    code: 'PARSE_ERROR',
                    message: '搜索结果解析失败',
                    details: error.message
                },
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Extract individual search results from the page
     * @param {CheerioAPI} $ - Cheerio instance
     * @returns {Array} Array of search result objects
     */
    _extractSearchResults($) {
        const results = [];
        
        // MC Wiki search results are in ul.mw-search-results > li.mw-search-result
        const searchResults = $('.mw-search-results .mw-search-result');
        
        searchResults.each((index, element) => {
            try {
                const $result = $(element);
                
                // Extract title and URL from the main link
                const titleLink = $result.find('.mw-search-result-heading a').first();
                const title = titleLink.text().trim();
                const relativeUrl = titleLink.attr('href');
                const url = relativeUrl ? this._normalizeUrl(relativeUrl) : '';

                // Extract snippet/description
                const snippetElement = $result.find('.searchresult');
                let snippet = '';
                if (snippetElement.length > 0) {
                    // Remove HTML tags and clean up text
                    snippet = snippetElement.text().trim().replace(/\s+/g, ' ');
                }

                // Extract namespace information from CSS class
                const namespace = this._extractNamespaceFromElement($result, title, url);

                // Extract additional metadata
                const metadata = this._extractResultMetadata($result);

                // Only add if we have at least a title
                if (title) {
                    results.push({
                        title,
                        url,
                        snippet,
                        namespace,
                        ...metadata
                    });
                }
            } catch (error) {
                // Log individual result parsing errors but continue
                console.warn(`Failed to parse search result at index ${index}:`, error.message);
            }
        });

        return results;
    }

    /**
     * Extract pagination and count information
     * @param {CheerioAPI} $ - Cheerio instance
     * @returns {Object} Pagination information
     */
    _extractPaginationInfo($) {
        const info = {
            totalCount: 0,
            hasMore: false,
            currentPage: 1
        };

        try {
            // Look for result count information in .results-info
            const resultInfo = $('.results-info').first().text();
            const countMatch = resultInfo.match(/共\s*(\d+)\s*条/);
            if (countMatch) {
                info.totalCount = parseInt(countMatch[1], 10);
            }

            // Check for "next" pagination link to determine if there are more results
            const nextLink = $('.mw-search-pager-bottom .mw-nextlink, .mw-search-pager .mw-nextlink');
            info.hasMore = nextLink.length > 0;

            // Try to extract current page number - for now default to 1
            info.currentPage = 1;

        } catch (error) {
            console.warn('Failed to extract pagination info:', error.message);
        }

        return info;
    }

    /**
     * Extract namespace information from search result element
     * @param {Cheerio} $result - Cheerio element for the result
     * @param {string} title - Result title
     * @param {string} url - Result URL
     * @returns {string} Namespace name
     */
    _extractNamespaceFromElement($result, title, url) {
        try {
            // Check CSS class for namespace info (e.g., mw-search-result-ns-0)
            const classes = $result.attr('class') || '';
            const namespaceMatch = classes.match(/mw-search-result-ns-(\d+)/);
            if (namespaceMatch) {
                const nsId = namespaceMatch[1];
                return this._mapNamespaceIdToName(nsId);
            }

            // Try to determine namespace from URL pattern
            if (url) {
                const urlMatch = url.match(/\/w\/([^:]+):/);
                if (urlMatch) {
                    return this._mapNamespaceFromPrefix(urlMatch[1]);
                }
            }

            // Try to determine from title prefix
            if (title.includes(':')) {
                const titlePrefix = title.split(':')[0];
                return this._mapNamespaceFromPrefix(titlePrefix);
            }

            // Default to main namespace
            return '主要';
        } catch (error) {
            return '主要';
        }
    }

    /**
     * Map namespace ID to Chinese name
     * @param {string} nsId - Namespace ID
     * @returns {string} Chinese namespace name
     */
    _mapNamespaceIdToName(nsId) {
        const namespaceMap = {
            '0': '主要',
            '1': '讨论',
            '2': '用户',
            '3': '用户讨论',
            '4': '项目',
            '5': '项目讨论',
            '6': '文件',
            '7': '文件讨论',
            '8': 'MediaWiki',
            '9': 'MediaWiki讨论',
            '10': '模板',
            '11': '模板讨论',
            '12': '帮助',
            '13': '帮助讨论',
            '14': '分类',
            '15': '分类讨论',
            '828': '模块',
            '829': '模块讨论'
        };

        return namespaceMap[nsId] || '主要';
    }

    /**
     * Extract namespace information from search result
     * @param {Cheerio} $result - Cheerio element for the result
     * @param {string} title - Result title
     * @param {string} url - Result URL
     * @returns {string} Namespace name
     */
    _extractNamespace($result, title, url) {
        try {
            // Look for namespace indicator in the result
            const namespaceElement = $result.find('.mw-search-result-ns');
            if (namespaceElement.length > 0) {
                return namespaceElement.text().trim();
            }

            // Try to determine namespace from URL pattern
            if (url) {
                const urlMatch = url.match(/\/w\/([^:]+):/);
                if (urlMatch) {
                    return this._mapNamespaceFromPrefix(urlMatch[1]);
                }
            }

            // Try to determine from title prefix
            if (title.includes(':')) {
                const titlePrefix = title.split(':')[0];
                return this._mapNamespaceFromPrefix(titlePrefix);
            }

            // Default to main namespace
            return '主要';
        } catch (error) {
            return '主要';
        }
    }

    /**
     * Extract additional metadata from search result
     * @param {Cheerio} $result - Cheerio element for the result
     * @returns {Object} Additional metadata
     */
    _extractResultMetadata($result) {
        const metadata = {};

        try {
            // Extract file size for file results
            const sizeElement = $result.find('.mw-search-result-data .filesize');
            if (sizeElement.length > 0) {
                metadata.fileSize = sizeElement.text().trim();
            }

            // Extract last modified date if available
            const dateElement = $result.find('.mw-search-result-data .mw-search-result-date');
            if (dateElement.length > 0) {
                metadata.lastModified = dateElement.text().trim();
            }

            // Extract category information if available
            const categoryElement = $result.find('.mw-search-result-data .mw-category-generated');
            if (categoryElement.length > 0) {
                metadata.category = categoryElement.text().trim();
            }

        } catch (error) {
            // Metadata extraction is optional, don't fail the whole result
        }

        return metadata;
    }

    /**
     * Normalize relative URLs to absolute URLs
     * @param {string} url - Relative or absolute URL
     * @returns {string} Absolute URL
     */
    _normalizeUrl(url) {
        if (!url) return '';
        
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url;
        }
        
        if (url.startsWith('/')) {
            return `${this.baseUrl}${url}`;
        }
        
        return `${this.baseUrl}/${url}`;
    }

    /**
     * Map namespace prefix to Chinese name
     * @param {string} prefix - Namespace prefix
     * @returns {string} Chinese namespace name
     */
    _mapNamespaceFromPrefix(prefix) {
        const namespaceMap = {
            'Template': '模板',
            'Category': '分类',
            'File': '文件',
            'Help': '帮助',
            'User': '用户',
            'Project': '项目',
            'MediaWiki': 'MediaWiki',
            'Module': '模块',
            'Gadget': '小工具',
            'Data': '数据',
            'Widget': '小部件',
            'Config': '配置',
            '模板': '模板',
            '分类': '分类',
            '文件': '文件',
            '帮助': '帮助',
            '用户': '用户',
            '项目': '项目'
        };

        return namespaceMap[prefix] || '主要';
    }

    /**
     * Check if the search returned no results
     * @param {string} html - Raw HTML from search results page
     * @returns {boolean} True if no results found
     */
    hasNoResults(html) {
        if (!html) return true;
        
        const $ = cheerio.load(html);
        
        // Check if there are any actual search results
        const searchResults = $('.mw-search-results .mw-search-result');
        if (searchResults.length > 0) {
            return false;
        }

        // Check for "no results" indicators
        const noResultsIndicators = [
            '.mw-search-nonefound',
            '.mw-search-exists'
        ];

        for (const selector of noResultsIndicators) {
            const element = $(selector);
            if (element.length > 0) {
                const text = element.text().toLowerCase();
                if (text.includes('没有找到') || text.includes('无结果') || text.includes('not found')) {
                    return true;
                }
            }
        }

        return true; // If no results found
    }

    /**
     * Extract suggested search terms if available
     * @param {string} html - Raw HTML from search results page
     * @returns {Array} Array of suggested search terms
     */
    extractSuggestions(html) {
        if (!html) return [];
        
        const $ = cheerio.load(html);
        const suggestions = [];

        try {
            // Look for "did you mean" suggestions
            $('.mw-search-did-you-mean a, .searchdidyoumean a').each((index, element) => {
                const suggestion = $(element).text().trim();
                if (suggestion) {
                    suggestions.push(suggestion);
                }
            });

            // Look for related search suggestions
            $('.mw-search-related a').each((index, element) => {
                const suggestion = $(element).text().trim();
                if (suggestion && !suggestions.includes(suggestion)) {
                    suggestions.push(suggestion);
                }
            });

        } catch (error) {
            console.warn('Failed to extract suggestions:', error.message);
        }

        return suggestions;
    }
}

module.exports = SearchResultsParser;