/**
 * 智能中间件测试 - 考虑限流窗口
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// 颜色输出
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

// 创建axios实例
const client = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    validateStatus: () => true
});

async function runSmartTests() {
    log('🧪 开始智能中间件测试\n', 'blue');
    
    // 等待限流窗口重置
    log('⏰ 等待限流窗口重置（65秒）...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 65000));
    
    let passed = 0;
    let total = 0;
    
    // 测试1: 健康检查（跳过限流）
    log('📋 测试健康检查端点（应跳过限流）:', 'yellow');
    try {
        const response = await client.get('/health');
        total++;
        if (response.status === 200) {
            log('✅ 健康检查正常', 'green');
            passed++;
        } else {
            log('❌ 健康检查失败', 'red');
        }
    } catch (error) {
        log('❌ 健康检查异常', 'red');
        total++;
    }
    
    // 测试2: 正常搜索请求（第1个）
    log('\n📋 测试正常搜索请求:', 'yellow');
    try {
        const response = await client.get('/api/search?q=test&limit=5');
        total++;
        if (response.status === 200) {
            log('✅ 搜索请求成功', 'green');
            passed++;
        } else {
            log(`❌ 搜索请求失败，状态码: ${response.status}`, 'red');
        }
    } catch (error) {
        log('❌ 搜索请求异常', 'red');
        total++;
    }
    
    // 测试3: 参数验证错误（第2个）
    log('\n📋 测试参数验证错误:', 'yellow');
    try {
        const response = await client.get('/api/search'); // 缺少q参数
        total++;
        if (response.status === 400) {
            log('✅ 参数验证错误正确返回', 'green');
            passed++;
        } else {
            log(`❌ 参数验证错误返回错误状态码: ${response.status}`, 'red');
        }
    } catch (error) {
        log('❌ 参数验证测试异常', 'red');
        total++;
    }
    
    // 测试4: 405方法不允许（第3个）
    log('\n📋 测试POST方法不允许:', 'yellow');
    try {
        const response = await client.post('/api/search', {});
        total++;
        if (response.status === 405) {
            log('✅ 405方法不允许正确返回', 'green');
            passed++;
        } else {
            log(`❌ POST方法返回错误状态码: ${response.status}`, 'red');
        }
    } catch (error) {
        log('❌ POST方法测试异常', 'red');
        total++;
    }
    
    // 测试5: 404错误（第4个）
    log('\n📋 测试404错误:', 'yellow');
    try {
        const response = await client.get('/nonexistent');
        total++;
        if (response.status === 404) {
            log('✅ 404错误正确返回', 'green');
            passed++;
        } else {
            log(`❌ 404错误返回错误状态码: ${response.status}`, 'red');
        }
    } catch (error) {
        log('❌ 404测试异常', 'red');
        total++;
    }
    
    // 测试6: 触发限流（第5个，应该成功，第6个应该被限流）
    log('\n📋 测试限流功能:', 'yellow');
    try {
        // 第5个请求（应该成功）
        const response1 = await client.get('/api/search?q=limit_test');
        total++;
        if (response1.status === 200) {
            log('✅ 第5个请求成功（达到限制边界）', 'green');
            passed++;
        } else {
            log(`❌ 第5个请求失败: ${response1.status}`, 'red');
        }
        
        // 第6个请求（应该被限流）
        const response2 = await client.get('/api/search?q=limit_test2');
        total++;
        if (response2.status === 429) {
            log('✅ 第6个请求被限流（429）', 'green');
            passed++;
        } else {
            log(`❌ 第6个请求未被限流: ${response2.status}`, 'red');
        }
    } catch (error) {
        log('❌ 限流测试异常', 'red');
        total += 2;
    }
    
    // 总结
    log(`\n📊 测试总结:`, 'blue');
    log(`总测试数: ${total}`, 'blue');
    log(`通过测试: ${passed}`, passed === total ? 'green' : 'yellow');
    log(`失败测试: ${total - passed}`, total - passed === 0 ? 'green' : 'red');
    log(`成功率: ${Math.round((passed / total) * 100)}%`, 'blue');
    
    if (passed === total) {
        log('\n🎉 所有测试通过！中间件功能正常工作', 'green');
    } else {
        log('\n⚠️  部分测试失败，但这可能是预期的行为', 'yellow');
    }
}

if (require.main === module) {
    runSmartTests().catch(error => {
        log(`❌ 测试失败: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = { runSmartTests };