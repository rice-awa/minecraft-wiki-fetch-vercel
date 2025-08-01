/**
 * 本地搜索功能测试脚本
 * 用于验证WikiSearchService是否能正常工作
 */

const WikiSearchService = require('../src/services/wikiSearchService');

async function testSearch() {
    console.log('🔍 开始测试Wiki搜索功能...\n');
    
    const searchService = new WikiSearchService();
    
    // 测试用例
    const testCases = [
        { keyword: '钻石', description: '搜索"钻石"' },
        { keyword: '红石', description: '搜索"红石"' },
        { keyword: '末影龙', description: '搜索"末影龙"' },
        { keyword: 'diamond', description: '搜索英文"diamond"' },
        { keyword: '不存在的物品xyz123', description: '搜索不存在的内容' }
    ];
    
    for (const testCase of testCases) {
        console.log(`📋 ${testCase.description}`);
        console.log('=' .repeat(50));
        
        try {
            const startTime = Date.now();
            const result = await searchService.search(testCase.keyword, {
                limit: 5,
                namespaces: ['0', '14'] // 主命名空间和分类命名空间
            });
            const duration = Date.now() - startTime;
            
            if (result.success) {
                console.log(`✅ 搜索成功 (${duration}ms)`);
                console.log(`📊 找到 ${result.data.results.length} 个结果，总共 ${result.data.totalHits} 个匹配`);
                
                if (result.data.results.length > 0) {
                    console.log('\n🔍 搜索结果:');
                    result.data.results.forEach((item, index) => {
                        console.log(`${index + 1}. ${item.title}`);
                        console.log(`   📝 ${item.snippet}`);
                        console.log(`   🔗 ${item.url}`);
                        console.log(`   📂 命名空间: ${item.namespace}`);
                        console.log('');
                    });
                } else {
                    console.log('❌ 没有找到相关结果');
                }
                
                // 显示缓存信息
                if (result.data.fromCache) {
                    console.log('💾 结果来自缓存');
                }
                
            } else {
                console.log('❌ 搜索失败');
                console.log(`错误: ${result.error.message}`);
            }
            
        } catch (error) {
            console.log('💥 测试异常');
            console.log(`错误: ${error.message}`);
        }
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // 添加延迟避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 测试缓存功能
    console.log('🧪 测试缓存功能...');
    console.log('第一次搜索 "钻石" (应该发起网络请求)');
    const firstSearch = await searchService.search('钻石', { limit: 3 });
    console.log(`缓存状态: ${firstSearch.data.fromCache ? '来自缓存' : '网络请求'}`);
    
    console.log('第二次搜索 "钻石" (应该来自缓存)');
    const secondSearch = await searchService.search('钻石', { limit: 3 });
    console.log(`缓存状态: ${secondSearch.data.fromCache ? '来自缓存' : '网络请求'}`);
    
    // 显示缓存统计
    console.log('\n📊 缓存统计:');
    const cacheStats = searchService.getCacheStats();
    console.log(`缓存条目数: ${cacheStats.size}`);
    console.log(`缓存命中率: 计算中...`);
    
    console.log('\n✅ 搜索功能测试完成!');
}

// 运行测试
if (require.main === module) {
    testSearch().catch(console.error);
}

module.exports = testSearch;