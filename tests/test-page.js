/**
 * 本地页面获取功能测试脚本
 * 用于验证WikiPageService是否能正常工作
 */

const WikiPageService = require('../src/services/wikiPageService');

async function testPageService() {
    console.log('📄 开始测试Wiki页面获取功能...\n');
    
    const pageService = new WikiPageService({
        cacheOptions: {
            enabled: true,
            ttl: 60000,  // 1分钟
            maxSize: 10
        }
    });
    
    // 测试用例
    const testCases = [
        { pageName: '钻石', format: 'both', description: '获取"钻石"页面 (HTML + Markdown)' },
        { pageName: '红石', format: 'markdown', description: '获取"红石"页面 (仅Markdown)' },
        { pageName: '末影龙', format: 'html', description: '获取"末影龙"页面 (仅HTML)' },
        { pageName: '不存在的页面xyz123', format: 'both', description: '测试不存在的页面' }
    ];
    
    for (const testCase of testCases) {
        console.log(`📋 ${testCase.description}`);
        console.log('=' .repeat(60));
        
        try {
            const startTime = Date.now();
            const result = await pageService.getPage(testCase.pageName, {
                format: testCase.format,
                includeMetadata: true
            });
            const duration = Date.now() - startTime;
            
            if (result.success) {
                console.log(`✅ 页面获取成功 (${duration}ms)`);
                
                const data = result.data;
                console.log(`📄 标题: ${data.title}`);
                console.log(`🔗 URL: ${data.url}`);
                
                if (data.subtitle) {
                    console.log(`📝 副标题: ${data.subtitle}`);
                }
                
                // 显示分类信息
                if (data.categories && data.categories.length > 0) {
                    console.log(`📂 分类: ${data.categories.map(cat => cat.name).join(', ')}`);
                }
                
                // 显示内容统计
                if (data.meta) {
                    console.log(`📊 统计信息:`);
                    console.log(`   - 词数: ${data.meta.wordCount}`);
                    console.log(`   - 章节数: ${data.meta.sectionCount}`);
                    console.log(`   - 图片数: ${data.meta.imageCount}`);
                    console.log(`   - 表格数: ${data.meta.tableCount}`);
                }
                
                // 显示内容组件
                if (data.content && data.content.components) {
                    const comp = data.content.components;
                    console.log(`🔧 内容组件:`);
                    if (comp.sections.length > 0) {
                        console.log(`   - 章节: ${comp.sections.map(s => s.text).slice(0, 3).join(', ')}${comp.sections.length > 3 ? '...' : ''}`);
                    }
                    if (comp.infoboxes.length > 0) {
                        console.log(`   - 信息框: ${comp.infoboxes.length}个`);
                    }
                    if (comp.images.length > 0) {
                        console.log(`   - 图片: ${comp.images.length}个`);
                    }
                }
                
                // 显示内容预览
                if (testCase.format === 'markdown' || testCase.format === 'both') {
                    if (data.content.markdown) {
                        const preview = data.content.markdown.substring(0, 200);
                        console.log(`📖 Markdown预览:\n${preview}${data.content.markdown.length > 200 ? '...' : ''}`);
                    }
                } else if (testCase.format === 'html') {
                    if (data.content.text) {
                        const preview = data.content.text.substring(0, 200);
                        console.log(`📖 文本预览:\n${preview}${data.content.text.length > 200 ? '...' : ''}`);
                    }
                }
                
                // 显示元数据
                if (data.metadata) {
                    console.log(`🔧 元数据:`);
                    console.log(`   - 格式: ${data.metadata.format}`);
                    console.log(`   - 获取时间: ${new Date(data.metadata.fetchTime).toLocaleString()}`);
                }
                
            } else {
                console.log('❌ 页面获取失败');
                console.log(`错误代码: ${result.error.code}`);
                console.log(`错误信息: ${result.error.message}`);
                
                // 如果有建议，显示建议
                if (result.error.details && result.error.details.suggestions) {
                    console.log('💡 建议的页面:');
                    result.error.details.suggestions.forEach((suggestion, index) => {
                        console.log(`   ${index + 1}. ${suggestion.title}`);
                    });
                }
            }
            
        } catch (error) {
            console.log('💥 测试异常');
            console.log(`错误: ${error.message}`);
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
        
        // 添加延迟
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 测试批量获取
    console.log('🔄 测试批量页面获取...');
    try {
        const batchResult = await pageService.getPages(['钻石', '金锭', '铁锭'], {
            format: 'markdown',
            concurrency: 2
        });
        
        if (batchResult.success) {
            console.log(`✅ 批量获取成功`);
            console.log(`📊 总页面数: ${batchResult.data.totalPages}`);
            console.log(`✅ 成功: ${batchResult.data.successCount}`);
            console.log(`❌ 失败: ${batchResult.data.errorCount}`);
            
            Object.entries(batchResult.data.results).forEach(([pageName, result]) => {
                if (result.success) {
                    console.log(`   ✅ ${pageName}: ${result.data.title}`);
                } else {
                    console.log(`   ❌ ${pageName}: ${result.error.message}`);
                }
            });
        }
    } catch (error) {
        console.log(`❌ 批量获取失败: ${error.message}`);
    }
    
    // 显示缓存统计
    console.log('\n📊 缓存统计:');
    const cacheStats = pageService.getCacheStats();
    if (cacheStats.enabled) {
        console.log(`缓存条目数: ${cacheStats.size}`);
        console.log(`最大容量: ${cacheStats.maxSize}`);
        console.log(`TTL: ${cacheStats.ttl}ms`);
    } else {
        console.log('缓存已禁用');
    }
    
    console.log('\n✅ 页面获取功能测试完成!');
}

// 运行测试
if (require.main === module) {
    testPageService().catch(console.error);
}

module.exports = testPageService;