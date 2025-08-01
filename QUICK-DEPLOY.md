# 🚀 快速部署指南

## 一分钟部署到 Vercel

### 方法一：一键部署（推荐）

点击下面的按钮直接部署：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/minecraft-wiki-api&env=WIKI_BASE_URL,REQUEST_TIMEOUT,RATE_LIMIT_MAX&envDescription=API%20Configuration&envLink=https://github.com/your-username/minecraft-wiki-api/blob/main/.env.vercel)

### 方法二：命令行部署

```bash
# 1. 克隆项目
git clone https://github.com/your-username/minecraft-wiki-api.git
cd minecraft-wiki-api

# 2. 安装依赖
npm install

# 3. 安装 Vercel CLI
npm install -g vercel

# 4. 登录 Vercel
vercel login

# 5. 部署
npm run deploy
```

## 🔧 环境变量配置

在 Vercel Dashboard 中添加以下环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `NODE_ENV` | `production` | 运行环境 |
| `WIKI_BASE_URL` | `https://zh.minecraft.wiki` | Wiki 基础 URL |
| `REQUEST_TIMEOUT` | `15000` | 请求超时时间 |
| `RATE_LIMIT_MAX` | `50` | 每分钟最大请求数 |

## 🧪 测试部署

部署完成后，访问以下端点测试：

```bash
# 基础信息
curl https://your-project.vercel.app/

# 搜索测试
curl "https://your-project.vercel.app/api/search?q=钻石&pretty=true"

# 页面获取测试
curl "https://your-project.vercel.app/api/page/钻石?format=markdown&pretty=true"

# 健康检查
curl https://your-project.vercel.app/health
```

## 📊 监控

- 访问 [Vercel Dashboard](https://vercel.com/dashboard) 查看部署状态
- 查看函数调用统计和性能指标
- 监控错误日志和响应时间

## 🔄 更新部署

推送代码到 Git 仓库会自动触发重新部署。

## ❓ 常见问题

**Q: 部署失败怎么办？**
A: 检查 package.json 中的依赖，确保 Node.js 版本 >= 18.0.0

**Q: 函数超时怎么办？**
A: 检查 REQUEST_TIMEOUT 设置，确保不超过 30 秒

**Q: 如何查看日志？**
A: 使用 `vercel logs https://your-project.vercel.app`

## 📞 获取帮助

- [完整部署文档](./deploy-vercel.md)
- [API 使用文档](./README-SERVERLESS.md)
- [GitHub Issues](https://github.com/your-username/minecraft-wiki-api/issues)