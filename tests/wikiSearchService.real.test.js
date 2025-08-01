/**
 * WikiSearchService Real Network Tests
 * 在真实网络环境下测试搜索服务的完整功能
 */

const WikiSearchService = require('../src/services/wikiSearchService');

// 跳过网络测试的条件
const skipNetworkTests = process.env.CI === 'true' || process.env.SKIP_NETWORK_TESTS === 'true';

describe('WikiSearchService Real Network Tests', () => {
    let searchService;

    beforeAll(() => {
        searchService = new WikiSearchService({
            enableCache: true,
            cacheTtl: 5000 // 5秒缓存用于测试
        });
    });

    beforeEach(() => {
        jest.setTimeout(30000); // 30秒超时
    });

    afterEach(() => {
        jest.setTimeout(5000);
    });

    describe('Real Search Functionality', () => {
        (skipNetworkTests ? test.skip : test)('should search for "钻石" successfully', async () => {
            const result = await searchService.search('钻石');

            expect(result.success).toBe(true);
            expect(result.data.results.length).toBeGreaterThan(0);
            expect(result.data.totalCount).toBeGreaterThan(0);
            expect(result.data.keyword).toBe('钻石');
            expect(result.meta.cached).toBe(false);
            expect(result.meta.searchUrl).toContain('zh.minecraft.wiki');
            expect(result.meta.duration).toBeDefined();

            // 验证第一个结果的结构
            const firstResult = result.data.results[0];
            expect(firstResult.title).toBeTruthy();
            expect(firstResult.url).toMatch(/^https:\/\//);
            expect(firstResult.snippet).toBeTruthy();
            expect(firstResult.namespace).toBeTruthy();

            console.log(`✓ 搜索 "钻石" 成功: 找到 ${result.data.results.length} 个结果，总计 ${result.data.totalCount} 个`);
        });

        (skipNetworkTests ? test.skip : test)('should handle multiple search terms', async () => {
            const searchTerms = ['钻石', '红石', '铁', '金'];
            const results = [];

            for (const term of searchTerms) {
                const result = await searchService.search(term, { limit: 5 });
                results.push({ term, result });
                
                expect(result.success).toBe(true);
                expect(result.data.results.length).toBeGreaterThan(0);
                
                // 验证搜索词在结果中
                const hasKeywordMatch = result.data.results.some(r => 
                    r.title.includes(term) || r.snippet.includes(term)
                );
                expect(hasKeywordMatch).toBe(true);

                console.log(`✓ 搜索 "${term}": ${result.data.results.length} 个结果`);
            }

            // 验证不同搜索词的结果不同
            const uniqueFirstTitles = results.map(r => r.result.data.results[0].title);
            const uniqueTitles = [...new Set(uniqueFirstTitles)];
            expect(uniqueTitles.length).toBeGreaterThan(1);
        });

        (skipNetworkTests ? test.skip : test)('should search with different options', async () => {
            const testCases = [
                { limit: 5, description: '限制5个结果' },
                { limit: 20, description: '限制20个结果' },
                { namespaces: ['0'], description: '只搜索主命名空间' },
                { namespaces: ['0', '10'], description: '搜索主命名空间和模板' }
            ];

            for (const testCase of testCases) {
                const result = await searchService.search('钻石', testCase);
                
                expect(result.success).toBe(true);
                if (testCase.limit) {
                    expect(result.data.results.length).toBeLessThanOrEqual(testCase.limit);
                }
                
                console.log(`✓ ${testCase.description}: ${result.data.results.length} 个结果`);
            }
        });

        (skipNetworkTests ? test.skip : test)('should handle special characters in search', async () => {
            const specialTerms = [
                '下界合金',
                'TNT',
                '红石+中继器',
                '末影龙'
            ];

            for (const term of specialTerms) {
                const result = await searchService.search(term);
                
                expect(result.success).toBe(true);
                expect(result.data.keyword).toBe(term);
                expect(result.meta.searchUrl).toContain(encodeURIComponent(term));
                
                console.log(`✓ 特殊字符搜索 "${term}": ${result.data.results.length} 个结果`);
            }
        });

        (skipNetworkTests ? test.skip : test)('should handle no results scenario', async () => {
            const obscureKeyword = '这个词绝对不会在wiki中找到12345abcdef';
            
            const result = await searchService.search(obscureKeyword);
            
            expect(result.success).toBe(true);
            expect(result.data.keyword).toBe(obscureKeyword);
            expect(result.data.results.length).toBeLessThanOrEqual(1);
            
            console.log(`✓ 无结果搜索测试: "${obscureKeyword}" 返回 ${result.data.results.length} 个结果`);
        }, 20000); // 增加超时时间到20秒
    });

    describe('Cache Functionality', () => {
        (skipNetworkTests ? test.skip : test)('should cache search results', async () => {
            const keyword = '钻石工具';
            
            // 清除可能存在的缓存
            searchService.clearCache(keyword);
            
            // 第一次搜索
            const startTime1 = Date.now();
            const result1 = await searchService.search(keyword);
            const duration1 = Date.now() - startTime1;
            
            expect(result1.success).toBe(true);
            expect(result1.meta.cached).toBe(false);
            
            // 第二次搜索应该使用缓存
            const startTime2 = Date.now();
            const result2 = await searchService.search(keyword);
            const duration2 = Date.now() - startTime2;
            
            expect(result2.success).toBe(true);
            expect(result2.meta.cached).toBe(true);
            expect(duration2).toBeLessThan(duration1); // 缓存应该更快
            
            // 结果应该相同
            expect(result2.data.results).toEqual(result1.data.results);
            
            console.log(`✓ 缓存测试: 第一次 ${duration1}ms, 第二次 ${duration2}ms (缓存)`);
        });

        (skipNetworkTests ? test.skip : test)('should bypass cache when requested', async () => {
            const keyword = '红石电路';
            
            // 第一次搜索建立缓存
            await searchService.search(keyword);
            
            // 第二次搜索跳过缓存
            const result = await searchService.search(keyword, { useCache: false });
            
            expect(result.success).toBe(true);
            expect(result.meta.cached).toBe(false);
            
            console.log(`✓ 跳过缓存测试: 成功获取新结果`);
        });
    });

    describe('Error Handling', () => {
        (skipNetworkTests ? test.skip : test)('should handle invalid keywords', async () => {
            const invalidInputs = ['', '   ', null, undefined];
            
            for (const input of invalidInputs) {
                const result = await searchService.search(input);
                
                expect(result.success).toBe(false);
                expect(result.error.code).toBe('INVALID_PARAMETER');
                
                console.log(`✓ 无效输入处理: "${input}" -> ${result.error.message}`);
            }
        });

        (skipNetworkTests ? test.skip : test)('should handle network issues gracefully', async () => {
            // 创建一个使用错误URL的服务
            const faultyService = new WikiSearchService({
                baseUrl: 'https://nonexistent.domain.xyz'
            });
            
            const result = await faultyService.search('测试');
            
            expect(result.success).toBe(false);
            expect(result.error.code).toBe('NETWORK_ERROR');
            
            console.log(`✓ 网络错误处理: ${result.error.message}`);
        });
    });

    describe('Utility Functions', () => {
        (skipNetworkTests ? test.skip : test)('should check if results exist', async () => {
            const commonTerm = '钻石';
            const rareTerm = '这个词应该不存在98765';
            
            const hasCommon = await searchService.hasResults(commonTerm);
            const hasRare = await searchService.hasResults(rareTerm);
            
            expect(hasCommon).toBe(true);
            expect(hasRare).toBe(false);
            
            console.log(`✓ 结果存在检查: "${commonTerm}" = ${hasCommon}, "${rareTerm}" = ${hasRare}`);
        });

        (skipNetworkTests ? test.skip : test)('should get search suggestions', async () => {
            const misspelledTerm = '砖石'; // 应该是"钻石"
            
            const suggestions = await searchService.getSuggestions(misspelledTerm);
            
            expect(Array.isArray(suggestions)).toBe(true);
            
            console.log(`✓ 搜索建议: "${misspelledTerm}" -> [${suggestions.join(', ')}]`);
        });
    });

    describe('Performance Tests', () => {
        (skipNetworkTests ? test.skip : test)('should handle concurrent searches', async () => {
            const keywords = ['钻石', '红石', '铁矿', '金矿', '煤炭'];
            const startTime = Date.now();
            
            // 并发搜索
            const promises = keywords.map(keyword => 
                searchService.search(keyword, { limit: 5 })
            );
            
            const results = await Promise.all(promises);
            const totalTime = Date.now() - startTime;
            
            // 验证所有搜索都成功
            results.forEach(result => {
                expect(result.success).toBe(true);
            });
            
            console.log(`✓ 并发搜索测试: ${keywords.length} 个搜索在 ${totalTime}ms 内完成`);
        });

        (skipNetworkTests ? test.skip : test)('should maintain reasonable response times', async () => {
            const keyword = '附魔';
            const iterations = 3;
            const times = [];
            
            for (let i = 0; i < iterations; i++) {
                const startTime = Date.now();
                const result = await searchService.search(keyword, { useCache: false });
                const duration = Date.now() - startTime;
                
                expect(result.success).toBe(true);
                times.push(duration);
                
                // 等待一下避免过于频繁的请求
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const maxTime = Math.max(...times);
            
            expect(maxTime).toBeLessThan(15000); // 最长不超过15秒
            
            console.log(`✓ 响应时间测试: 平均 ${avgTime.toFixed(0)}ms, 最大 ${maxTime}ms`);
        });
    });

    describe('Cache Management', () => {
        (skipNetworkTests ? test.skip : test)('should manage cache effectively', async () => {
            // 清空缓存
            searchService.clearCache();
            
            const initialStats = searchService.getCacheStats();
            expect(initialStats.size).toBe(0);
            
            // 进行几次搜索
            await searchService.search('测试1');
            await searchService.search('测试2');
            await searchService.search('测试3');
            
            const afterSearchStats = searchService.getCacheStats();
            expect(afterSearchStats.size).toBe(3);
            
            // 清除特定关键词的缓存
            searchService.clearCache('测试1');
            
            const afterClearStats = searchService.getCacheStats();
            expect(afterClearStats.size).toBe(2);
            
            console.log(`✓ 缓存管理测试: 初始${initialStats.size} -> 搜索后${afterSearchStats.size} -> 清除后${afterClearStats.size}`);
        });
    });
});