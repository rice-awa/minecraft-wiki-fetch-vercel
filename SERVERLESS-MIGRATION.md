# Serverless 迁移说明

## 📋 改动概述

本项目已成功适配 Vercel Serverless 环境，以下是主要改动：

## 🆕 新增文件

### 核心文件
- `api/index.js` - Vercel serverless 函数入口点
- `vercel.json` - Vercel 平台配置文件

### 配置文件
- `.env.vercel` - Serverless 环境变量配置
- `deploy-vercel.md` - 详细部署指南
- `README-SERVERLESS.md` - Serverless 版本使用文档
- `QUICK-DEPLOY.md` - 快速部署指南

### 脚本文件
- `scripts/deploy-vercel.js` - 自动化部署脚本
- `scripts/test-serverless.js` - Serverless 功能测试脚本
- `scripts/dev-serverless.js` - 本地 Serverless 开发服务器

## 🔧 修改文件

### package.json
新增脚本命令：
```json
{
  "vercel-dev": "vercel dev",
  "deploy": "vercel --prod",
  "deploy:preview": "vercel",
  "test:serverless": "node scripts/test-serverless.js",
  "deploy:script": "node scripts/deploy-vercel.js",
  "dev:serverless": "node scripts/dev-serverless.js"
}
```

### src/utils/logger.js
- 添加 serverless 环境检测
- 在 serverless 环境下禁用文件日志
- 优化内存使用

## 🗑️ 删除文件
- `api/vercel_index.js` - 旧的入口文件（已替换）

## 🏗️ 架构变化

### 传统部署 vs Serverless

| 特性 | 传统部署 | Serverless |
|------|----------|------------|
| 服务器管理 | 需要 | 无需 |
| 扩展性 | 手动 | 自动 |
| 成本 | 固定 | 按使用量 |
| 冷启动 | 无 | 有 |
| 持久化存储 | 支持 | 限制 |

### 适配优化

1. **日志系统**
   - 检测 serverless 环境
   - 禁用文件日志，仅使用控制台日志
   - 优化日志格式

2. **缓存策略**
   - 使用内存缓存替代 Redis
   - 减少缓存大小和 TTL
   - 函数重启后缓存清空

3. **性能优化**
   - 减少请求超时时间
   - 优化依赖加载
   - 减少内存使用

## 🚀 部署方式

### 开发环境测试
```bash
# 本地 serverless 模式测试
npm run dev:serverless

# 运行 serverless 测试
npm run test:serverless
```

### Vercel 部署
```bash
# 预览部署
npm run deploy:preview

# 生产部署
npm run deploy

# 使用脚本部署
npm run deploy:script
```

## 🔄 兼容性

### 保持兼容
- 所有 API 端点保持不变
- 响应格式完全一致
- 功能特性无变化

### 环境差异
- 文件系统访问受限
- 函数执行时间限制（30秒）
- 内存使用限制
- 无持久化存储

## 📊 性能对比

### 优势
- ✅ 自动扩展
- ✅ 零服务器管理
- ✅ 按需付费
- ✅ 全球 CDN 分发
- ✅ 自动 HTTPS

### 限制
- ⚠️ 冷启动延迟
- ⚠️ 执行时间限制
- ⚠️ 内存限制
- ⚠️ 无持久化存储

## 🔧 配置建议

### 生产环境
```env
NODE_ENV=production
REQUEST_TIMEOUT=15000
MAX_RETRIES=2
RATE_LIMIT_MAX=50
MEMORY_CACHE_MAX_SIZE=500
```

### 开发环境
```env
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
```

## 📈 监控指标

### 关键指标
- 函数调用次数
- 平均响应时间
- 错误率
- 内存使用
- 带宽消耗

### 监控工具
- Vercel Dashboard
- 函数日志
- 性能分析

## 🔍 故障排除

### 常见问题
1. **冷启动慢** - 优化依赖，减少初始化代码
2. **内存不足** - 减少缓存大小，优化数据结构
3. **超时错误** - 调整 REQUEST_TIMEOUT，优化请求逻辑
4. **部署失败** - 检查依赖版本，验证配置文件

### 调试方法
```bash
# 查看部署日志
vercel logs

# 本地调试
npm run dev:serverless

# 运行测试
npm run test:serverless
```

## 🎯 最佳实践

### 开发建议
1. 使用 `npm run dev:serverless` 进行本地测试
2. 定期运行 `npm run test:serverless` 验证功能
3. 监控函数性能和错误率
4. 合理设置缓存策略

### 部署建议
1. 先部署到预览环境测试
2. 验证所有 API 端点正常工作
3. 检查环境变量配置
4. 监控部署后的性能指标

## 📚 相关文档

- [Vercel 部署指南](./deploy-vercel.md)
- [Serverless 使用文档](./README-SERVERLESS.md)
- [快速部署指南](./QUICK-DEPLOY.md)
- [API 文档](./docs/API_DOCUMENTATION.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进 Serverless 适配。