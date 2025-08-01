/**
 * API服务器测试脚本
 * 验证所有API端点是否正常工作
 */

async function testApiServer(baseUrl = 'http://localhost:3000') {
    console.log('🚀 开始测试API服务器...\n');
    console.log(`基础URL: ${baseUrl}\n`);

    const tests = [
        {
            name: '根端点',
            method: 'GET',
            url: '/',
            expectedStatus: 200
        },
        {
            name: '健康检查',
            method: 'GET',
            url: '/health',
            expectedStatus: 200
        },
        {
            name: '详细健康检查',
            method: 'GET',
            url: '/health/detailed',
            expectedStatus: 200
        },
        {
            name: '搜索API - 钻石',
            method: 'GET',
            url: '/api/search?q=钻石&limit=3',
            expectedStatus: 200
        },
        {
            name: '搜索API - 无效参数',
            method: 'GET',
            url: '/api/search',
            expectedStatus: 400
        },
        {
            name: '页面API - 钻石页面',
            method: 'GET',
            url: '/api/page/钻石?format=markdown',
            expectedStatus: 200
        },
        {
            name: '页面存在性检查',
            method: 'GET',
            url: '/api/page/钻石/exists',
            expectedStatus: 200
        },
        {
            name: '搜索统计',
            method: 'GET',
            url: '/api/search/stats',
            expectedStatus: 200
        },
        {
            name: '404错误测试',
            method: 'GET',
            url: '/nonexistent-endpoint',
            expectedStatus: 404
        }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
        console.log(`🧪 测试: ${test.name}`);
        console.log(`   请求: ${test.method} ${test.url}`);
        
        try {
            const url = `${baseUrl}${test.url}`;
            const response = await fetch(url, { method: test.method });
            const data = await response.json();
            
            if (response.status === test.expectedStatus) {
                console.log(`   ✅ 通过 (${response.status})`);
                
                // 显示一些响应数据
                if (data.success && data.data) {
                    if (data.data.query) {
                        console.log(`   📊 搜索结果: ${data.data.results?.length || 0} 个`);
                    } else if (data.data.page) {
                        console.log(`   📄 页面: ${data.data.page.title}`);
                    } else if (data.status) {
                        console.log(`   💚 状态: ${data.status}`);
                    }
                } else if (!data.success && data.error) {
                    console.log(`   ⚠️  预期错误: ${data.error.code}`);
                }
                
                passedTests++;
            } else {
                console.log(`   ❌ 失败 - 期望状态码 ${test.expectedStatus}, 实际 ${response.status}`);
                console.log(`   📝 响应: ${JSON.stringify(data, null, 2).slice(0, 200)}...`);
            }
            
        } catch (error) {
            console.log(`   💥 异常: ${error.message}`);
        }
        
        console.log('');
        
        // 添加延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 测试批量页面API
    console.log('🧪 测试: 批量页面API');
    console.log('   请求: POST /api/pages');
    
    try {
        const batchResponse = await fetch(`${baseUrl}/api/pages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pages: ['钻石', '金锭'],
                format: 'markdown',
                concurrency: 2
            })
        });
        
        const batchData = await batchResponse.json();
        
        if (batchResponse.status === 200) {
            console.log(`   ✅ 通过 (${batchResponse.status})`);
            console.log(`   📊 批量结果: ${batchData.data?.summary?.successCount || 0} 成功, ${batchData.data?.summary?.errorCount || 0} 失败`);
            passedTests++;
        } else {
            console.log(`   ❌ 失败 (${batchResponse.status})`);
        }
        
        totalTests++;
        
    } catch (error) {
        console.log(`   💥 异常: ${error.message}`);
        totalTests++;
    }

    // 测试结果汇总
    console.log('\n' + '='.repeat(50));
    console.log('📊 测试结果汇总');
    console.log('='.repeat(50));
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过: ${passedTests}`);
    console.log(`失败: ${totalTests - passedTests}`);
    console.log(`通过率: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 所有测试通过！API服务器工作正常。');
    } else {
        console.log('\n⚠️  部分测试失败，请检查服务器配置。');
    }
    
    console.log('\n💡 在浏览器中访问这些URL进行手动测试:');
    console.log(`   - ${baseUrl}/ (服务信息)`);
    console.log(`   - ${baseUrl}/health (健康检查)`);
    console.log(`   - ${baseUrl}/api/search?q=钻石 (搜索钻石)`);
    console.log(`   - ${baseUrl}/api/page/钻石 (钻石页面内容)`);
}

// 检查是否在Node.js环境中运行
if (typeof window === 'undefined') {
    // Node.js环境
    const fetch = require('node-fetch').default || require('node-fetch');
    global.fetch = fetch;
    
    if (require.main === module) {
        const baseUrl = process.argv[2] || 'http://localhost:3000';
        testApiServer(baseUrl).catch(console.error);
    }
} else {
    // 浏览器环境
    console.log('在浏览器中使用: testApiServer("http://localhost:3000")');
}

module.exports = testApiServer;