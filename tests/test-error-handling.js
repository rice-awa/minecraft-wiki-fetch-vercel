/**
 * 测试错误处理和中间件功能
 * 验证限流、错误响应、日志记录等功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// 测试配置
const TESTS = {
    // 基础功能测试
    basic: [
        { name: '健康检查', path: '/health' },
        { name: 'API根端点', path: '/api' },
        { name: '根端点', path: '/' }
    ],
    
    // 错误处理测试
    errors: [
        { name: '404错误', path: '/nonexistent', expectedStatus: 404 },
        { name: '方法不允许', path: '/api/search', method: 'POST', expectedStatus: 405 },
        { name: '无效页面参数', path: '/api/page/', expectedStatus: 404 }
    ],
    
    // 参数验证测试
    validation: [
        { name: '搜索参数验证', path: '/api/search', expectedStatus: 400 },
        { name: '无效limit参数', path: '/api/search?q=test&limit=abc', expectedStatus: 400 }
    ]
};

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
    validateStatus: () => true // 不要抛出错误，我们要测试所有状态码
});

/**
 * 执行单个测试
 */
async function runTest(test) {
    const { name, path, method = 'GET', expectedStatus = 200, data = null } = test;
    
    try {
        const startTime = Date.now();
        const response = await client.request({
            method,
            url: path,
            data
        });
        const responseTime = Date.now() - startTime;
        
        const success = expectedStatus ? response.status === expectedStatus : response.status < 400;
        const status = success ? '✅' : '❌';
        const statusColor = success ? 'green' : 'red';
        
        log(`${status} ${name}`, statusColor);
        log(`   状态码: ${response.status} (期望: ${expectedStatus || '2xx'})`, 'blue');
        log(`   响应时间: ${responseTime}ms`, 'blue');
        
        // 检查错误响应格式
        if (response.status >= 400 && response.data) {
            if (response.data.success === false && response.data.error) {
                log(`   错误格式: ✅ 标准化错误响应`, 'green');
                log(`   错误代码: ${response.data.error.code}`, 'blue');
                log(`   错误消息: ${response.data.error.message}`, 'blue');
            } else {
                log(`   错误格式: ❌ 非标准化错误响应`, 'red');
            }
        }
        
        // 检查请求ID头
        const requestId = response.headers['x-request-id'];
        if (requestId) {
            log(`   请求ID: ✅ ${requestId}`, 'green');
        } else {
            log(`   请求ID: ❌ 缺失`, 'red');
        }
        
        return { success, status: response.status, responseTime, requestId };
        
    } catch (error) {
        log(`❌ ${name}`, 'red');
        log(`   网络错误: ${error.message}`, 'red');
        return { success: false, error: error.message };
    }
}

/**
 * 测试限流功能
 */
async function testRateLimit() {
    log('\n🔄 测试限流功能...', 'yellow');
    
    const requests = [];
    const totalRequests = 10; // 测试数量调整为10个
    
    // 串行发送请求以避免并发导致的计数问题
    const results = [];
    for (let i = 0; i < totalRequests; i++) {
        try {
            const response = await client.get('/api/search?q=test');
            results.push(response);
            log(`请求 ${i + 1}: ${response.status}`, response.status === 429 ? 'red' : 'blue');
        } catch (error) {
            log(`请求 ${i + 1}: 错误 ${error.message}`, 'red');
        }
        // 短暂延迟以观察限流效果
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    const rateLimited = results.filter(r => r.status === 429);
    const successful = results.filter(r => r.status === 200);
    
    log(`发送请求: ${totalRequests}`, 'blue');
    log(`成功响应: ${successful.length}`, 'green');
    log(`限流响应: ${rateLimited.length}`, rateLimited.length > 0 ? 'green' : 'red');
    
    if (rateLimited.length > 0) {
        const limitResponse = rateLimited[0].data;
        if (limitResponse.error && limitResponse.error.code === 'RATE_LIMIT_EXCEEDED') {
            log(`限流格式: ✅ 标准化限流响应`, 'green');
        } else {
            log(`限流格式: ❌ 非标准化限流响应`, 'red');
        }
    }
    
    return rateLimited.length > 0;
}

/**
 * 测试请求日志
 */
async function testRequestLogging() {
    log('\n📝 测试请求日志...', 'yellow');
    
    // 发送一些测试请求
    const testRequests = [
        '/health',
        '/api/search?q=钻石',
        '/nonexistent',
        '/'
    ];
    
    for (const path of testRequests) {
        await client.get(path);
        await new Promise(resolve => setTimeout(resolve, 100)); // 稍微延迟
    }
    
    log(`✅ 发送了 ${testRequests.length} 个测试请求`, 'green');
    log(`💡 请检查服务器日志确认请求日志是否正确记录`, 'yellow');
}

/**
 * 主测试函数
 */
async function runAllTests() {
    log('🧪 开始测试错误处理和中间件功能\n', 'blue');
    
    // 检查服务器是否运行
    try {
        await client.get('/health');
        log('✅ 服务器连接成功\n', 'green');
    } catch (error) {
        log('❌ 无法连接到服务器，请确保服务器正在运行', 'red');
        log(`   URL: ${BASE_URL}`, 'blue');
        log(`   错误: ${error.message}`, 'red');
        return;
    }
    
    let totalTests = 0;
    let passedTests = 0;
    
    // 基础功能测试
    log('📋 基础功能测试:', 'yellow');
    for (const test of TESTS.basic) {
        const result = await runTest(test);
        totalTests++;
        if (result.success) passedTests++;
    }
    
    // 错误处理测试
    log('\n❌ 错误处理测试:', 'yellow');
    for (const test of TESTS.errors) {
        const result = await runTest(test);
        totalTests++;
        if (result.success) passedTests++;
    }
    
    // 参数验证测试
    log('\n✅ 参数验证测试:', 'yellow');
    for (const test of TESTS.validation) {
        const result = await runTest(test);
        totalTests++;
        if (result.success) passedTests++;
    }
    
    // 限流测试
    const rateLimitWorking = await testRateLimit();
    totalTests++;
    if (rateLimitWorking) passedTests++;
    
    // 请求日志测试
    await testRequestLogging();
    
    // 总结
    log(`\n📊 测试总结:`, 'blue');
    log(`总测试数: ${totalTests}`, 'blue');
    log(`通过测试: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
    log(`失败测试: ${totalTests - passedTests}`, totalTests - passedTests === 0 ? 'green' : 'red');
    log(`成功率: ${Math.round((passedTests / totalTests) * 100)}%`, 'blue');
    
    if (passedTests === totalTests) {
        log('\n🎉 所有测试通过！中间件功能正常工作', 'green');
    } else {
        log('\n⚠️  部分测试失败，请检查日志和实现', 'yellow');
    }
}

// 运行测试
if (require.main === module) {
    runAllTests().catch(error => {
        log(`❌ 测试执行失败: ${error.message}`, 'red');
        process.exit(1);
    });
}

module.exports = { runAllTests, runTest, testRateLimit };