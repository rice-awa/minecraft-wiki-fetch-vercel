/**
 * WikiSearchService Demo
 * 演示搜索服务的基本使用方法
 */

const WikiSearchService = require('../src/services/wikiSearchService');

async function demonstrateSearchService() {
    console.log('🚀 WikiSearchService 演示开始\n');
    
    // 创建搜索服务实例
    const searchService = new WikiSearchService({
        enableCache: true,
        cacheTtl: 60000, // 1分钟缓存
        searchDefaults: {
            limit: 5 // 默认返回5个结果
        }
    });

    try {
        // 1. 基本搜索
        console.log('1️⃣ 基本搜索演示：');
        console.log('搜索关键词：钻石');
        const result1 = await searchService.search('钻石');
        
        if (result1.success) {
            console.log(`✅ 搜索成功：找到 ${result1.data.results.length} 个结果，总计 ${result1.data.totalCount} 个`);
            console.log(`🔗 第一个结果：${result1.data.results[0].title} - ${result1.data.results[0].url}`);
            console.log(`⏱️ 耗时：${result1.meta.duration}`);
        } else {
            console.log(`❌ 搜索失败：${result1.error.message}`);
        }
        console.log();

        // 2. 带选项的搜索
        console.log('2️⃣ 自定义选项搜索：');
        console.log('搜索关键词：红石，限制3个结果');
        const result2 = await searchService.search('红石', { limit: 3 });
        
        if (result2.success) {
            console.log(`✅ 搜索成功：返回 ${result2.data.results.length} 个结果`);
            result2.data.results.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.title} (${item.namespace})`);
            });
        }
        console.log();

        // 3. 缓存测试
        console.log('3️⃣ 缓存功能演示：');
        console.log('重复搜索"钻石"（应该使用缓存）');
        const start = Date.now();
        const result3 = await searchService.search('钻石');
        const duration = Date.now() - start;
        
        if (result3.success) {
            console.log(`✅ 搜索完成：${result3.meta.cached ? '来自缓存' : '新请求'}`);
            console.log(`⏱️ 响应时间：${duration}ms`);
        }
        console.log();

        // 4. 工具方法演示
        console.log('4️⃣ 工具方法演示：');
        
        // 检查是否有结果
        const hasResults = await searchService.hasResults('末影龙');
        console.log(`🔍 "末影龙" 是否有搜索结果：${hasResults ? '是' : '否'}`);
        
        // 获取搜索建议
        const suggestions = await searchService.getSuggestions('砖石'); // 拼写错误
        console.log(`💡 "砖石" 的搜索建议：[${suggestions.join(', ')}]`);
        
        // 缓存统计
        const stats = searchService.getCacheStats();
        console.log(`📊 缓存统计：${stats.size} 个缓存项，TTL=${stats.ttl}ms`);
        console.log();

        // 5. 多语言和特殊字符
        console.log('5️⃣ 特殊字符搜索演示：');
        const specialTerms = ['下界合金', 'TNT', '末影龙'];
        
        for (const term of specialTerms) {
            const result = await searchService.search(term, { limit: 2 });
            if (result.success && result.data.results.length > 0) {
                console.log(`🔍 "${term}"：${result.data.results[0].title}`);
            }
        }
        console.log();

        // 6. 错误处理演示
        console.log('6️⃣ 错误处理演示：');
        const errorResult = await searchService.search(''); // 空关键词
        if (!errorResult.success) {
            console.log(`❌ 错误处理：${errorResult.error.code} - ${errorResult.error.message}`);
        }
        console.log();

        console.log('🎉 演示完成！');
        console.log('\n📈 最终统计：');
        console.log('缓存状态：', searchService.getCacheStats());

    } catch (error) {
        console.error('❌ 演示过程中发生错误：', error.message);
    }
}

// 检查是否直接运行此脚本
if (require.main === module) {
    demonstrateSearchService().catch(console.error);
}

module.exports = { demonstrateSearchService };