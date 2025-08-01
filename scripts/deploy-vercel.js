#!/usr/bin/env node

/**
 * Vercel 部署脚本
 * 自动化部署到 Vercel 平台
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始部署到 Vercel...\n');

// 检查是否安装了 Vercel CLI
try {
  execSync('vercel --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ 未找到 Vercel CLI，请先安装：');
  console.error('   npm install -g vercel');
  process.exit(1);
}

// 检查必要文件
const requiredFiles = [
  'vercel.json',
  'api/index.js',
  'package.json'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    console.error(`❌ 缺少必要文件: ${file}`);
    process.exit(1);
  }
}

console.log('✅ 文件检查通过');

// 检查环境变量配置
if (fs.existsSync('.env.vercel')) {
  console.log('✅ 找到 Vercel 环境变量配置文件');
} else {
  console.log('⚠️  未找到 .env.vercel 文件，请确保在 Vercel Dashboard 中配置了环境变量');
}

// 获取部署类型
const deployType = process.argv[2] || 'preview';
const isProduction = deployType === 'prod' || deployType === 'production';

console.log(`📦 部署类型: ${isProduction ? '生产环境' : '预览环境'}`);

try {
  // 执行部署
  const deployCommand = isProduction ? 'vercel --prod' : 'vercel';
  console.log(`\n🔄 执行命令: ${deployCommand}\n`);
  
  execSync(deployCommand, { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('\n✅ 部署成功！');
  
  if (isProduction) {
    console.log('\n🎉 生产环境部署完成！');
    console.log('📋 后续步骤：');
    console.log('   1. 测试 API 端点');
    console.log('   2. 检查监控指标');
    console.log('   3. 配置自定义域名（如需要）');
  } else {
    console.log('\n🎉 预览环境部署完成！');
    console.log('📋 测试完成后，使用以下命令部署到生产环境：');
    console.log('   npm run deploy');
  }
  
} catch (error) {
  console.error('\n❌ 部署失败：', error.message);
  console.error('\n🔧 故障排除：');
  console.error('   1. 检查网络连接');
  console.error('   2. 确认 Vercel 账户权限');
  console.error('   3. 检查项目配置');
  console.error('   4. 查看详细错误信息');
  process.exit(1);
}