/**
 * WikiSearchService Integration Tests
 * 测试完整的搜索服务功能，包括URL构建、HTTP请求、结果解析和缓存
 */

const WikiSearchService = require('../src/services/wikiSearchService');
const SearchUrlBuilder = require('../src/services/searchUrlBuilder');
const SearchResultsParser = require('../src/services/searchResultsParser');
const { HttpClient } = require('../src/utils/httpClient');

// 创建mock HTTP客户端用于单元测试
const createMockHttpClient = (mockResponse) => ({
    get: jest.fn().mockResolvedValue(mockResponse)
});

// 创建模拟的搜索结果HTML
const createMockSearchResultsHtml = () => `
<html>
<body>
    <div class="results-info">第1-20条结果，共822条</div>
    
    <ul class="mw-search-results">
        <li class="mw-search-result mw-search-result-ns-0">
            <div class="mw-search-result-heading">
                <a href="/w/钻石" title="钻石">钻石</a>
            </div>
            <div class="searchresult">钻石是一种稀有的矿物，可用于合成较高级的工具和盔甲。</div>
        </li>
        <li class="mw-search-result mw-search-result-ns-0">
            <div class="mw-search-result-heading">
                <a href="/w/钻石剑" title="钻石剑">钻石剑</a>
            </div>
            <div class="searchresult">钻石剑是游戏中最强的剑之一。</div>
        </li>
    </ul>
    
    <div class="mw-search-pager-bottom">
        <a class="mw-nextlink" href="/search?page=2">下一页</a>
    </div>
</body>
</html>
`;

// 创建无结果的搜索HTML
const createNoResultsHtml = () => `
<html>
<body>
    <div class="results-info">第0条结果，共0条</div>
    <div class="mw-search-nonefound">没有找到匹配的结果</div>
</body>
</html>
`;

describe('WikiSearchService', () => {
    let searchService;
    let mockHttpClient;

    beforeEach(() => {
        mockHttpClient = createMockHttpClient({
            status: 200,
            data: createMockSearchResultsHtml()
        });

        searchService = new WikiSearchService({
            httpClient: mockHttpClient,
            enableCache: true,
            cacheTtl: 1000 // 1秒用于测试
        });
    });

    describe('constructor', () => {
        test('should initialize with default options', () => {
            const service = new WikiSearchService();
            
            expect(service.baseUrl).toBe('https://zh.minecraft.wiki');
            expect(service.cacheEnabled).toBe(true);
            expect(service.cacheTtl).toBe(300000);
            expect(service.maxCacheSize).toBe(1000);
        });

        test('should accept custom options', () => {
            const customOptions = {
                baseUrl: 'https://custom.wiki.com',
                enableCache: false,
                cacheTtl: 60000,
                maxCacheSize: 500,
                searchDefaults: {
                    limit: 20,
                    namespaces: ['0', '6']
                }
            };

            const service = new WikiSearchService(customOptions);
            
            expect(service.baseUrl).toBe(customOptions.baseUrl);
            expect(service.cacheEnabled).toBe(false);
            expect(service.cacheTtl).toBe(60000);
            expect(service.maxCacheSize).toBe(500);
            expect(service.defaultOptions.limit).toBe(20);
            expect(service.defaultOptions.namespaces).toEqual(['0', '6']);
        });
    });

    describe('search', () => {
        test('should perform successful search', async () => {
            const result = await searchService.search('钻石');

            expect(result.success).toBe(true);
            expect(result.data.results).toHaveLength(2);
            expect(result.data.results[0].title).toBe('钻石');
            expect(result.data.results[0].url).toBe('https://zh.minecraft.wiki/w/钻石');
            expect(result.data.totalCount).toBe(822);
            expect(result.data.hasMore).toBe(true);
            expect(result.meta.keyword).toBe('钻石');
            expect(result.meta.cached).toBe(false);
            expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
        });

        test('should handle search with custom options', async () => {
            const options = {
                limit: 5,
                namespaces: ['0', '6'],
                profile: 'default'
            };

            const result = await searchService.search('红石', options);

            expect(result.success).toBe(true);
            expect(result.meta.options.limit).toBe(5);
            expect(result.meta.options.namespaces).toEqual(['0', '6']);
            expect(result.meta.options.profile).toBe('default');
        });

        test('should validate search keyword', async () => {
            const emptyResult = await searchService.search('');
            const nullResult = await searchService.search(null);
            const undefinedResult = await searchService.search(undefined);

            expect(emptyResult.success).toBe(false);
            expect(emptyResult.error.code).toBe('INVALID_PARAMETER');
            expect(nullResult.success).toBe(false);
            expect(undefinedResult.success).toBe(false);
        });

        test('should handle HTTP errors', async () => {
            mockHttpClient.get.mockRejectedValue(new Error('Network error'));

            const result = await searchService.search('钻石');

            expect(result.success).toBe(false);
            expect(result.error.code).toBe('NETWORK_ERROR');
            expect(result.error.message).toBe('Network error');
        });

        test('should handle parsing errors', async () => {
            mockHttpClient.get.mockResolvedValue({
                status: 200,
                data: 'invalid html'
            });

            const result = await searchService.search('钻石');

            expect(result.success).toBe(true); // Parser handles invalid HTML gracefully
            expect(result.data.results).toEqual([]);
        });

        test('should handle HTTP status errors', async () => {
            mockHttpClient.get.mockResolvedValue({
                status: 404,
                statusText: 'Not Found'
            });

            const result = await searchService.search('钻石');

            expect(result.success).toBe(false);
            expect(result.error.code).toBe('HTTP_ERROR');
            expect(result.error.message).toContain('HTTP请求失败: 404');
        });
    });

    describe('caching', () => {
        test('should cache search results', async () => {
            // 第一次搜索
            const result1 = await searchService.search('钻石');
            expect(result1.meta.cached).toBe(false);
            expect(mockHttpClient.get).toHaveBeenCalledTimes(1);

            // 第二次搜索应该使用缓存
            const result2 = await searchService.search('钻石');
            expect(result2.meta.cached).toBe(true);
            expect(mockHttpClient.get).toHaveBeenCalledTimes(1); // 没有新的请求
            
            // 结果应该相同
            expect(result2.data.results).toEqual(result1.data.results);
        });

        test('should generate different cache keys for different options', async () => {
            await searchService.search('钻石', { limit: 10 });
            await searchService.search('钻石', { limit: 20 });

            // 应该有两次HTTP请求，因为选项不同
            expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
        });

        test('should expire cache after TTL', async () => {
            // 搜索并缓存
            await searchService.search('钻石');
            expect(mockHttpClient.get).toHaveBeenCalledTimes(1);

            // 等待缓存过期
            await new Promise(resolve => setTimeout(resolve, 1100));

            // 再次搜索应该重新请求
            await searchService.search('钻石');
            expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
        });

        test('should respect useCache option', async () => {
            // 第一次搜索并缓存
            await searchService.search('钻石');
            expect(mockHttpClient.get).toHaveBeenCalledTimes(1);

            // 第二次搜索禁用缓存
            const result = await searchService.search('钻石', { useCache: false });
            expect(result.meta.cached).toBe(false);
            expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
        });

        test('should limit cache size', () => {
            searchService.maxCacheSize = 2;

            // 添加3个不同的缓存项
            searchService._setCache('key1', { data: 'data1' });
            searchService._setCache('key2', { data: 'data2' });
            searchService._setCache('key3', { data: 'data3' });

            expect(searchService.cache.size).toBe(2);
            expect(searchService.cache.has('key1')).toBe(false); // 最旧的被删除
            expect(searchService.cache.has('key2')).toBe(true);
            expect(searchService.cache.has('key3')).toBe(true);
        });
    });

    describe('getSuggestions', () => {
        test('should return suggestions', async () => {
            const htmlWithSuggestions = `
                <html>
                <body>
                    ${createMockSearchResultsHtml()}
                    <div class="mw-search-did-you-mean">
                        您是否要找：<a href="/search?q=钻石矿">钻石矿</a>
                    </div>
                </body>
                </html>
            `;

            mockHttpClient.get.mockResolvedValue({
                status: 200,
                data: htmlWithSuggestions
            });

            const suggestions = await searchService.getSuggestions('砖石');
            expect(Array.isArray(suggestions)).toBe(true);
        });

        test('should return empty array on error', async () => {
            mockHttpClient.get.mockRejectedValue(new Error('Network error'));

            const suggestions = await searchService.getSuggestions('钻石');
            expect(suggestions).toEqual([]);
        });
    });

    describe('hasResults', () => {
        test('should return true when results exist', async () => {
            const hasResults = await searchService.hasResults('钻石');
            expect(hasResults).toBe(true);
        });

        test('should return false when no results', async () => {
            mockHttpClient.get.mockResolvedValue({
                status: 200,
                data: createNoResultsHtml()
            });

            const hasResults = await searchService.hasResults('不存在的词');
            expect(hasResults).toBe(false);
        });

        test('should return false on error', async () => {
            mockHttpClient.get.mockRejectedValue(new Error('Network error'));

            const hasResults = await searchService.hasResults('钻石');
            expect(hasResults).toBe(false);
        });
    });

    describe('cache management', () => {
        test('should clear all cache', () => {
            searchService._setCache('key1', { data: 'data1' });
            searchService._setCache('key2', { data: 'data2' });
            expect(searchService.cache.size).toBe(2);

            searchService.clearCache();
            expect(searchService.cache.size).toBe(0);
        });

        test('should clear selective cache by keyword', () => {
            searchService._setCache('search:钻石:10:0:advanced', { data: 'data1' });
            searchService._setCache('search:红石:10:0:advanced', { data: 'data2' });
            expect(searchService.cache.size).toBe(2);

            searchService.clearCache('钻石');
            expect(searchService.cache.size).toBe(1);
            expect(searchService.cache.has('search:红石:10:0:advanced')).toBe(true);
        });

        test('should get cache stats', () => {
            searchService._setCache('key1', { data: 'data1' });
            
            const stats = searchService.getCacheStats();
            expect(stats.size).toBe(1);
            expect(stats.maxSize).toBe(1000);
            expect(stats.enabled).toBe(true);
            expect(stats.ttl).toBe(1000);
        });
    });

    describe('config management', () => {
        test('should update configuration', () => {
            const newConfig = {
                enableCache: false,
                cacheTtl: 5000,
                searchDefaults: {
                    limit: 15
                }
            };

            searchService.updateConfig(newConfig);

            expect(searchService.cacheEnabled).toBe(false);
            expect(searchService.cacheTtl).toBe(5000);
            expect(searchService.defaultOptions.limit).toBe(15);
        });

        test('should update base URL', () => {
            searchService.updateConfig({ baseUrl: 'https://new.wiki.com' });
            
            expect(searchService.baseUrl).toBe('https://new.wiki.com');
            expect(searchService.urlBuilder.baseUrl).toBe('https://new.wiki.com');
        });
    });

    describe('error code mapping', () => {
        const testCases = [
            { error: { code: 'ENOTFOUND' }, expected: 'NETWORK_ERROR' },
            { error: { code: 'ETIMEDOUT' }, expected: 'TIMEOUT_ERROR' },
            { error: { message: 'HTTP请求失败' }, expected: 'HTTP_ERROR' },
            { error: { message: '解析失败' }, expected: 'PARSE_ERROR' },
            { error: { message: '关键词不能为空' }, expected: 'INVALID_PARAMETER' },
            { error: { message: 'unknown error' }, expected: 'UNKNOWN_ERROR' }
        ];

        testCases.forEach(({ error, expected }) => {
            test(`should map ${error.code || error.message} to ${expected}`, () => {
                const code = searchService._getErrorCode(error);
                expect(code).toBe(expected);
            });
        });
    });

    describe('integration with real components', () => {
        test('should work with real URLBuilder and Parser', async () => {
            const realService = new WikiSearchService({
                httpClient: mockHttpClient
            });

            const result = await realService.search('钻石');

            expect(result.success).toBe(true);
            expect(result.data.results).toHaveLength(2);
            expect(result.meta.searchUrl).toContain('zh.minecraft.wiki');
            expect(result.meta.searchUrl).toContain('search=%E9%92%BB%E7%9F%B3');
        });
    });
});