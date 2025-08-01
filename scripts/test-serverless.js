#!/usr/bin/env node

/**
 * Serverless 版本测试脚本
 * 测试 API 在 serverless 环境下的功能
 */

const axios = require('axios');

// 配置
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30秒超时

console.log('🧪 开始测试 Serverless API...\n');
console.log(`📍 测试地址: ${BASE_URL}\n`);

// 测试用例
const tests = [
  {
    name: '根路径测试',
    method: 'GET',
    path: '/',
    expectedStatus: 200,
    validate: (data) => data.name === 'Minecraft Wiki API'
  },
  {
    name: '健康检查测试',
    method: 'GET',
    path: '/health',
    expectedStatus: 200,
    validate: (data) => data.status === 'healthy'
  },
  {
    name: '搜索功能测试',
    method: 'GET',
    path: '/api/search?q=钻石&limit=5',
    expectedStatus: 200,
    validate: (data) => data.success === true && Array.isArray(data.data.results)
  },
  {
    name: '页面获取测试',
    method: 'GET',
    path: '/api/page/钻石?format=markdown',
    expectedStatus: 200,
    validate: (data) => data.success === true && data.data.page
  },
  {
    name: '页面存在性检查测试',
    method: 'GET',
    path: '/api/page/钻石/exists',
    expectedStatus: 200,
    validate: (data) => data.success === true && typeof data.data.exists === 'boolean'
  },
  {
    name: '批量页面获取测试',
    method: 'POST',
    path: '/api/pages',
    data: {
      pages: ['钻石', '铁锭'],
      format: 'markdown',
      concurrency: 2
    },
    expectedStatus: 200,
    validate: (data) => data.success === true && Array.isArray(data.data.results)
  },
  {
    name: '错误处理测试 - 无效参数',
    method: 'GET',
    path: '/api/search',
    expectedStatus: 400,
    validate: (data) => data.success === false && data.error.code === 'INVALID_PARAMETERS'
  },
  {
    name: '错误处理测试 - 页面不存在',
    method: 'GET',
    path: '/api/page/这个页面绝对不存在的页面名称12345',
    expectedStatus: 404,
    validate: (data) => data.success === false
  }
];

// 执行测试
async function runTests() {
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const test of tests) {
    try {
      console.log(`🔄 执行测试: ${test.name}`);
      
      const startTime = Date.now();
      const config = {
        method: test.method,
        url: `${BASE_URL}${test.path}`,
        timeout: TEST_TIMEOUT,
        validateStatus: () => true // 不自动抛出错误
      };

      if (test.data) {
        config.data = test.data;
        config.headers = { 'Content-Type': 'application/json' };
      }

      const response = await axios(config);
      const duration = Date.now() - startTime;

      // 检查状态码
      if (response.status !== test.expectedStatus) {
        throw new Error(`状态码不匹配: 期望 ${test.expectedStatus}, 实际 ${response.status}`);
      }

      // 验证响应数据
      if (test.validate && !test.validate(response.data)) {
        throw new Error('响应数据验证失败');
      }

      console.log(`✅ ${test.name} - 通过 (${duration}ms)`);
      passed++;
      results.push({
        name: test.name,
        status: 'PASSED',
        duration,
        statusCode: response.status
      });

    } catch (error) {
      console.log(`❌ ${test.name} - 失败: ${error.message}`);
      failed++;
      results.push({
        name: test.name,
        status: 'FAILED',
        error: error.message,
        statusCode: error.response?.status || 'N/A'
      });
    }
  }

  // 输出测试结果
  console.log('\n📊 测试结果汇总:');
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📈 成功率: ${((passed / tests.length) * 100).toFixed(1)}%`);

  // 详细结果
  console.log('\n📋 详细结果:');
  results.forEach(result => {
    const status = result.status === 'PASSED' ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    const error = result.error ? ` - ${result.error}` : '';
    console.log(`${status} ${result.name}${duration}${error}`);
  });

  // 性能统计
  const passedResults = results.filter(r => r.status === 'PASSED' && r.duration);
  if (passedResults.length > 0) {
    const avgDuration = passedResults.reduce((sum, r) => sum + r.duration, 0) / passedResults.length;
    const maxDuration = Math.max(...passedResults.map(r => r.duration));
    const minDuration = Math.min(...passedResults.map(r => r.duration));
    
    console.log('\n⚡ 性能统计:');
    console.log(`平均响应时间: ${avgDuration.toFixed(0)}ms`);
    console.log(`最快响应时间: ${minDuration}ms`);
    console.log(`最慢响应时间: ${maxDuration}ms`);
  }

  // 建议
  console.log('\n💡 建议:');
  if (failed === 0) {
    console.log('🎉 所有测试通过！API 运行正常。');
  } else {
    console.log('⚠️  部分测试失败，请检查以下问题：');
    console.log('   1. 确认服务器正在运行');
    console.log('   2. 检查网络连接');
    console.log('   3. 验证环境变量配置');
    console.log('   4. 查看服务器日志');
  }

  return failed === 0;
}

// 主函数
async function main() {
  try {
    const success = await runTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('\n❌ 测试执行失败:', error.message);
    process.exit(1);
  }
}

// 处理命令行参数
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Serverless API 测试脚本');
  console.log('');
  console.log('用法:');
  console.log('  node scripts/test-serverless.js [选项]');
  console.log('');
  console.log('选项:');
  console.log('  --help, -h     显示帮助信息');
  console.log('');
  console.log('环境变量:');
  console.log('  TEST_URL       测试的 API 基础 URL (默认: http://localhost:3000)');
  console.log('');
  console.log('示例:');
  console.log('  TEST_URL=https://your-project.vercel.app node scripts/test-serverless.js');
  process.exit(0);
}

// 运行测试
main();