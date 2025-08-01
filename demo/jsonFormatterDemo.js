/**
 * JSON格式化功能演示
 * 展示如何使用pretty参数控制JSON响应格式
 */

const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000';
const DEMO_SEARCH_KEYWORD = '钻石';
const DEMO_PAGE_NAME = '钻石';

/**
 * 演示搜索API的JSON格式化功能
 */
async function demonstrateSearchFormatting() {
    console.log('\n=== 搜索API JSON格式化演示 ===\n');

    try {
        // 1. 默认格式（压缩）
        console.log('1. 默认格式（压缩JSON）:');
        console.log(`GET ${BASE_URL}/api/search?q=${DEMO_SEARCH_KEYWORD}&limit=2`);
        
        const compactResponse = await axios.get(`${BASE_URL}/api/search`, {
            params: { q: DEMO_SEARCH_KEYWORD, limit: 2 }
        });
        
        console.log('响应头 X-JSON-Formatted:', compactResponse.headers['x-json-formatted']);
        console.log('响应内容（前200字符）:');
        console.log(JSON.stringify(compactResponse.data).substring(0, 200) + '...\n');

        // 2. 格式化输出
        console.log('2. 格式化输出（pretty=true）:');
        console.log(`GET ${BASE_URL}/api/search?q=${DEMO_SEARCH_KEYWORD}&limit=2&pretty=true`);
        
        const prettyResponse = await axios.get(`${BASE_URL}/api/search`, {
            params: { q: DEMO_SEARCH_KEYWORD, limit: 2, pretty: 'true' }
        });
        
        console.log('响应头 X-JSON-Formatted:', prettyResponse.headers['x-json-formatted']);
        console.log('响应内容:');
        console.log(JSON.stringify(prettyResponse.data, null, 2));

        // 3. 使用数字参数
        console.log('\n3. 使用数字参数（pretty=1）:');
        console.log(`GET ${BASE_URL}/api/search?q=${DEMO_SEARCH_KEYWORD}&limit=1&pretty=1`);
        
        const numericResponse = await axios.get(`${BASE_URL}/api/search`, {
            params: { q: DEMO_SEARCH_KEYWORD, limit: 1, pretty: '1' }
        });
        
        console.log('响应头 X-JSON-Formatted:', numericResponse.headers['x-json-formatted']);
        console.log('格式化状态: 已格式化\n');

    } catch (error) {
        console.error('搜索API演示失败:', error.message);
        if (error.response) {
            console.error('错误响应:', error.response.data);
        }
    }
}

/**
 * 演示页面API的JSON格式化功能
 */
async function demonstratePageFormatting() {
    console.log('\n=== 页面API JSON格式化演示 ===\n');

    try {
        // 1. 默认格式
        console.log('1. 默认格式（压缩JSON）:');
        console.log(`GET ${BASE_URL}/api/page/${DEMO_PAGE_NAME}?format=markdown`);
        
        const compactResponse = await axios.get(`${BASE_URL}/api/page/${encodeURIComponent(DEMO_PAGE_NAME)}`, {
            params: { format: 'markdown' }
        });
        
        console.log('响应头 X-JSON-Formatted:', compactResponse.headers['x-json-formatted']);
        console.log('响应大小:', JSON.stringify(compactResponse.data).length, '字符');

        // 2. 格式化输出
        console.log('\n2. 格式化输出（pretty=true）:');
        console.log(`GET ${BASE_URL}/api/page/${DEMO_PAGE_NAME}?format=markdown&pretty=true`);
        
        const prettyResponse = await axios.get(`${BASE_URL}/api/page/${encodeURIComponent(DEMO_PAGE_NAME)}`, {
            params: { format: 'markdown', pretty: 'true' }
        });
        
        console.log('响应头 X-JSON-Formatted:', prettyResponse.headers['x-json-formatted']);
        console.log('响应大小:', JSON.stringify(prettyResponse.data, null, 2).length, '字符');
        console.log('格式化后大小增加了约', 
            Math.round((JSON.stringify(prettyResponse.data, null, 2).length - JSON.stringify(compactResponse.data).length) / JSON.stringify(compactResponse.data).length * 100), 
            '%');

        // 显示部分格式化内容
        console.log('\n格式化内容示例（metadata部分）:');
        if (prettyResponse.data.data && prettyResponse.data.data.metadata) {
            console.log(JSON.stringify({ metadata: prettyResponse.data.data.metadata }, null, 2));
        }

    } catch (error) {
        console.error('页面API演示失败:', error.message);
        if (error.response) {
            console.error('错误响应:', error.response.data);
        }
    }
}

/**
 * 演示不同的pretty参数值
 */
async function demonstratePrettyValues() {
    console.log('\n=== Pretty参数值演示 ===\n');

    const testValues = [
        { value: 'true', description: '字符串 true' },
        { value: 'false', description: '字符串 false' },
        { value: '1', description: '数字字符串 1' },
        { value: '0', description: '数字字符串 0' },
        { value: 'yes', description: '字符串 yes' },
        { value: 'no', description: '字符串 no' },
        { value: 'TRUE', description: '大写 TRUE' },
        { value: 'False', description: '混合大小写 False' }
    ];

    for (const test of testValues) {
        try {
            console.log(`测试参数: pretty=${test.value} (${test.description})`);
            
            const response = await axios.get(`${BASE_URL}/api/search`, {
                params: { q: DEMO_SEARCH_KEYWORD, limit: 1, pretty: test.value }
            });
            
            const isFormatted = response.headers['x-json-formatted'] === 'true';
            console.log(`结果: ${isFormatted ? '格式化' : '压缩'}\n`);
            
        } catch (error) {
            console.error(`测试 ${test.value} 失败:`, error.message);
        }
    }
}

/**
 * 演示无效参数处理
 */
async function demonstrateInvalidParameters() {
    console.log('\n=== 无效参数处理演示 ===\n');

    const invalidValues = ['invalid', '2', 'maybe', ''];

    for (const value of invalidValues) {
        try {
            console.log(`测试无效参数: pretty=${value}`);
            
            const response = await axios.get(`${BASE_URL}/api/search`, {
                params: { q: DEMO_SEARCH_KEYWORD, pretty: value }
            });
            
            console.log('意外成功 - 应该返回错误');
            
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('正确返回400错误:', error.response.data.error.message);
            } else {
                console.error('意外错误:', error.message);
            }
        }
        console.log('');
    }
}

/**
 * 性能对比演示
 */
async function demonstratePerformanceComparison() {
    console.log('\n=== 性能对比演示 ===\n');

    const iterations = 5;
    
    try {
        // 测试压缩格式性能
        console.log(`测试压缩格式性能（${iterations}次请求）...`);
        const compactStart = Date.now();
        
        for (let i = 0; i < iterations; i++) {
            await axios.get(`${BASE_URL}/api/search`, {
                params: { q: DEMO_SEARCH_KEYWORD, limit: 5 }
            });
        }
        
        const compactTime = Date.now() - compactStart;
        console.log(`压缩格式平均响应时间: ${compactTime / iterations}ms`);

        // 测试格式化性能
        console.log(`\n测试格式化性能（${iterations}次请求）...`);
        const prettyStart = Date.now();
        
        for (let i = 0; i < iterations; i++) {
            await axios.get(`${BASE_URL}/api/search`, {
                params: { q: DEMO_SEARCH_KEYWORD, limit: 5, pretty: 'true' }
            });
        }
        
        const prettyTime = Date.now() - prettyStart;
        console.log(`格式化平均响应时间: ${prettyTime / iterations}ms`);

        // 计算性能差异
        const difference = prettyTime - compactTime;
        const percentage = Math.round((difference / compactTime) * 100);
        
        console.log(`\n性能差异: ${difference}ms (${percentage > 0 ? '+' : ''}${percentage}%)`);
        
        if (percentage > 10) {
            console.log('⚠️  格式化会增加响应时间，建议仅在开发调试时使用');
        } else {
            console.log('✅ 性能影响较小');
        }

    } catch (error) {
        console.error('性能测试失败:', error.message);
    }
}

/**
 * 主演示函数
 */
async function runDemo() {
    console.log('🚀 Minecraft Wiki API - JSON格式化功能演示');
    console.log('================================================');
    
    // 检查服务器是否运行
    try {
        await axios.get(`${BASE_URL}/health`);
        console.log('✅ 服务器运行正常\n');
    } catch (error) {
        console.error('❌ 无法连接到服务器，请确保服务器在', BASE_URL, '上运行');
        console.error('   运行命令: npm start');
        return;
    }

    // 运行各种演示
    await demonstrateSearchFormatting();
    await demonstratePageFormatting();
    await demonstratePrettyValues();
    await demonstrateInvalidParameters();
    await demonstratePerformanceComparison();

    console.log('\n=== 演示完成 ===');
    console.log('\n💡 使用建议:');
    console.log('• 开发调试时使用 pretty=true 获得可读的JSON格式');
    console.log('• 生产环境建议使用默认的压缩格式以节省带宽');
    console.log('• 支持的pretty参数值: true, false, 1, 0, yes, no（大小写不敏感）');
    console.log('• 格式化后的响应会包含 X-JSON-Formatted 头部信息');
}

// 运行演示
if (require.main === module) {
    runDemo().catch(console.error);
}

module.exports = {
    demonstrateSearchFormatting,
    demonstratePageFormatting,
    demonstratePrettyValues,
    demonstrateInvalidParameters,
    demonstratePerformanceComparison
};