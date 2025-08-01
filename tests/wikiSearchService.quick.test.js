/**
 * WikiSearchService Quick Real Network Test
 * 快速验证搜索服务的基本功能
 */

const WikiSearchService = require('../src/services/wikiSearchService');

// 跳过网络测试的条件
const skipNetworkTests = process.env.CI === 'true' || process.env.SKIP_NETWORK_TESTS === 'true';

describe('WikiSearchService Quick Real Test', () => {
    let searchService;

    beforeAll(() => {
        searchService = new WikiSearchService({
            enableCache: true,
            cacheTtl: 10000 // 10秒缓存
        });
        jest.setTimeout(15000); // 15秒超时
    });

    describe('Basic Search Functionality', () => {
        (skipNetworkTests ? test.skip : test)('should perform basic search successfully', async () => {
            console.log('🔍 开始测试基本搜索功能...');
            
            const result = await searchService.search('钻石');

            expect(result.success).toBe(true);
            expect(result.data.results.length).toBeGreaterThan(0);
            expect(result.data.totalCount).toBeGreaterThan(0);
            expect(result.data.keyword).toBe('钻石');
            expect(result.meta.searchUrl).toContain('zh.minecraft.wiki');
            
            const firstResult = result.data.results[0];
            expect(firstResult.title).toBeTruthy();
            expect(firstResult.url).toMatch(/^https:\/\//);
            expect(firstResult.snippet).toBeTruthy();
            
            console.log(`✅ 搜索成功: 找到 ${result.data.results.length} 个结果，总计 ${result.data.totalCount} 个`);
            console.log(`🔗 第一个结果: ${firstResult.title} - ${firstResult.url}`);
        });

        (skipNetworkTests ? test.skip : test)('should handle search with options', async () => {
            console.log('🔍 测试带选项的搜索...');
            
            const result = await searchService.search('红石', { limit: 5 });

            expect(result.success).toBe(true);
            expect(result.data.results.length).toBeGreaterThan(0);
            expect(result.data.results.length).toBeLessThanOrEqual(10); // Wiki可能忽略limit参数
            
            console.log(`✅ 带选项搜索成功: ${result.data.results.length} 个结果`);
        });

        (skipNetworkTests ? test.skip : test)('should handle Chinese characters correctly', async () => {
            console.log('🔍 测试中文搜索...');
            
            const testTerms = ['下界合金', '末影龙', '附魔台'];
            
            for (const term of testTerms) {
                const result = await searchService.search(term);
                
                expect(result.success).toBe(true);
                expect(result.data.keyword).toBe(term);
                expect(result.meta.searchUrl).toContain(encodeURIComponent(term));
                
                console.log(`✅ "${term}": ${result.data.results.length} 个结果`);
            }
        });

        (skipNetworkTests ? test.skip : test)('should cache results correctly', async () => {
            console.log('🔍 测试缓存功能...');
            
            const keyword = '铁块';
            
            // 清除可能的缓存
            searchService.clearCache(keyword);
            
            // 第一次搜索
            const start1 = Date.now();
            const result1 = await searchService.search(keyword);
            const time1 = Date.now() - start1;
            
            expect(result1.success).toBe(true);
            expect(result1.meta.cached).toBe(false);
            
            // 第二次搜索（应该使用缓存）
            const start2 = Date.now();
            const result2 = await searchService.search(keyword);
            const time2 = Date.now() - start2;
            
            expect(result2.success).toBe(true);
            expect(result2.meta.cached).toBe(true);
            expect(time2).toBeLessThan(time1); // 缓存应该更快
            
            console.log(`✅ 缓存测试: 第一次 ${time1}ms, 第二次 ${time2}ms (来自缓存)`);
        });

        (skipNetworkTests ? test.skip : test)('should handle error cases gracefully', async () => {
            console.log('🔍 测试错误处理...');
            
            // 测试空关键词
            const emptyResult = await searchService.search('');
            expect(emptyResult.success).toBe(false);
            expect(emptyResult.error.code).toBe('INVALID_PARAMETER');
            
            console.log(`✅ 空关键词处理: ${emptyResult.error.message}`);
            
            // 测试hasResults功能
            const hasCommon = await searchService.hasResults('钻石');
            const hasRare = await searchService.hasResults('绝对不存在的词xyz123');
            
            expect(hasCommon).toBe(true);
            // hasRare可能是true或false，取决于Wiki的搜索算法
            
            console.log(`✅ 结果检查: "钻石" = ${hasCommon}, "不存在的词" = ${hasRare}`);
        });

        (skipNetworkTests ? test.skip : test)('should provide useful utility functions', async () => {
            console.log('🔍 测试工具函数...');
            
            // 测试建议功能
            const suggestions = await searchService.getSuggestions('砖石'); // 拼写错误
            expect(Array.isArray(suggestions)).toBe(true);
            
            console.log(`✅ 搜索建议: "砖石" -> [${suggestions.join(', ')}]`);
            
            // 测试缓存统计
            const stats = searchService.getCacheStats();
            expect(stats.size).toBeGreaterThanOrEqual(0);
            expect(stats.enabled).toBe(true);
            
            console.log(`✅ 缓存统计: ${stats.size} 项缓存, TTL=${stats.ttl}ms`);
        });
    });

    describe('Service Configuration', () => {
        (skipNetworkTests ? test.skip : test)('should allow configuration updates', async () => {
            console.log('🔍 测试配置更新...');
            
            const originalStats = searchService.getCacheStats();
            
            // 更新配置
            searchService.updateConfig({
                cacheTtl: 5000,
                searchDefaults: {
                    limit: 15
                }
            });
            
            const newStats = searchService.getCacheStats();
            expect(newStats.ttl).toBe(5000);
            expect(searchService.defaultOptions.limit).toBe(15);
            
            console.log(`✅ 配置更新成功: TTL ${originalStats.ttl} -> ${newStats.ttl}`);
        });
    });

    afterAll(() => {
        if (searchService) {
            console.log('\n📊 最终缓存统计:', searchService.getCacheStats());
        }
    });
});