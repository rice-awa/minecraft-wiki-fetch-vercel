/**
 * 综合测试脚本
 * 测试搜索和页面获取的完整工作流程
 */

const testSearch = require('./test-search');
const testPageService = require('./test-page');

async function runAllTests() {
    console.log('🚀 开始运行完整的功能测试...\n');
    console.log('=' .repeat(80));
    
    try {
        // 运行搜索测试
        console.log('第一部分: 搜索功能测试');
        console.log('=' .repeat(80));
        await testSearch();
        
        console.log('\n\n');
        
        // 运行页面获取测试
        console.log('第二部分: 页面获取功能测试');
        console.log('=' .repeat(80));
        await testPageService();
        
        console.log('\n\n');
        console.log('🎉 所有测试完成!');
        console.log('=' .repeat(80));
        
    } catch (error) {
        console.error('💥 测试过程中发生错误:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// 运行所有测试
if (require.main === module) {
    runAllTests();
}

module.exports = runAllTests;