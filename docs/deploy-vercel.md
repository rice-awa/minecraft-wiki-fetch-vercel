# Vercel Serverless 部署指南

## 概述

本项目已经适配了Vercel的serverless云函数形式，可以直接部署到Vercel平台使用。

## 部署步骤

### 1. 准备工作

确保你已经：
- 安装了 [Vercel CLI](https://vercel.com/cli)
- 拥有 Vercel 账户
- 项目代码已推送到 Git 仓库（GitHub、GitLab 或 Bitbucket）

### 2. 安装 Vercel CLI

```bash
npm i -g vercel
```

### 3. 登录 Vercel

```bash
vercel login
```

### 4. 部署项目

#### 方法一：通过 CLI 部署

在项目根目录运行：

```bash
vercel
```

首次部署时，Vercel 会询问一些配置问题：
- 项目名称
- 是否链接到现有项目
- 项目设置等

#### 方法二：通过 Git 集成部署

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择你的 Git 仓库
4. Vercel 会自动检测到 `vercel.json` 配置文件
5. 点击 "Deploy"

### 5. 环境变量配置

在 Vercel Dashboard 中设置环境变量：

1. 进入项目设置页面
2. 点击 "Environment Variables"
3. 添加以下环境变量：

```
NODE_ENV=production
WIKI_BASE_URL=https://zh.minecraft.wiki
REQUEST_TIMEOUT=15000
MAX_RETRIES=2
RATE_LIMIT_MAX=50
SEARCH_MAX_LIMIT=30
ALLOWED_ORIGINS=*
```

或者使用 `.env.vercel` 文件中的配置。

### 6. 自定义域名（可选）

1. 在项目设置中点击 "Domains"
2. 添加你的自定义域名
3. 按照提示配置 DNS 记录

## 项目结构说明

```
├── api/
│   └── index.js          # Vercel serverless 函数入口
├── src/                  # 原有的应用代码
├── vercel.json          # Vercel 配置文件
├── .env.vercel          # Vercel 环境变量示例
└── package.json         # 依赖配置
```

## API 端点

部署成功后，你的 API 将在以下端点可用：

- `GET /` - API 信息和文档
- `GET /api/search?q=钻石` - 搜索功能
- `GET /api/page/钻石` - 获取页面内容
- `POST /api/pages` - 批量获取页面
- `GET /health` - 健康检查

## 性能优化

### Serverless 环境优化

1. **冷启动优化**：
   - 减少了不必要的依赖
   - 优化了初始化代码
   - 使用内存缓存而非 Redis

2. **请求超时设置**：
   - Vercel 函数最大执行时间为 30 秒
   - 已在 `vercel.json` 中配置

3. **内存使用优化**：
   - 减少了缓存大小
   - 优化了日志配置

### 缓存策略

- 搜索结果缓存：5分钟
- 页面内容缓存：15分钟
- 使用内存缓存，重启后清空

## 监控和日志

### 查看日志

```bash
vercel logs [deployment-url]
```

### 监控指标

在 Vercel Dashboard 中可以查看：
- 函数调用次数
- 响应时间
- 错误率
- 带宽使用

## 故障排除

### 常见问题

1. **部署失败**
   - 检查 `package.json` 中的依赖
   - 确保 Node.js 版本兼容（>=18.0.0）

2. **函数超时**
   - 检查 `REQUEST_TIMEOUT` 设置
   - 优化代码性能

3. **内存不足**
   - 减少 `MEMORY_CACHE_MAX_SIZE`
   - 优化数据处理逻辑

### 调试模式

设置环境变量 `DEBUG=true` 启用详细日志。

## 成本估算

Vercel 的定价基于：
- 函数调用次数
- 执行时间
- 带宽使用

免费套餐包括：
- 100GB 带宽
- 100 小时函数执行时间

## 更新部署

### 自动部署

推送代码到 Git 仓库会自动触发部署。

### 手动部署

```bash
vercel --prod
```

## 回滚

```bash
vercel rollback [deployment-url]
```

## 安全建议

1. 设置合适的 `ALLOWED_ORIGINS`
2. 启用 `FORCE_HTTPS=true`
3. 配置适当的访问限流
4. 定期更新依赖包

## 支持

如果遇到问题，请：
1. 查看 Vercel 官方文档
2. 检查项目 Issues
3. 联系技术支持