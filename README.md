# Minecraft Wiki API - Serverless版本

基于Node.js的Minecraft中文Wiki API服务，专为Vercel Serverless平台优化。

## 🚀 快速开始

### 一键部署到Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rice-awa/minecraft-wiki-fetch-vercel)

### 带环境变量部署：
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rice-awa/minecraft-wiki-fetch-vercel&env=WIKI_BASE_URL,REQUEST_TIMEOUT,RATE_LIMIT_MAX&envDescription=API%20Configuration&envLink=https://github.com/rice-awa/minecraft-wiki-fetch-vercel/blob/main/.env.vercel)

### 本地开发

```bash
git clone <repository-url>
cd minecraft-wiki-fetch-vercel
npm install
npm run dev
```

## 📋 API端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/search?q={keyword}&limit={number}` | GET | 搜索Wiki内容 |
| `/api/page/{pageName}?format={html\|markdown\|both}` | GET | 获取页面内容 |
| `/api/pages` | POST | 批量获取页面 |
| `/api/page/{pageName}/exists` | GET | 检查页面是否存在 |

### 搜索示例

```bash
curl "https://your-project.vercel.app/api/search?q=钻石&limit=5&pretty=true"
```

### 获取页面示例

```bash
curl "https://your-project.vercel.app/api/page/钻石?format=markdown&pretty=true"
```

### 批量获取示例

```bash
curl -X POST "https://your-project.vercel.app/api/pages" \
  -H "Content-Type: application/json" \
  -d '{"pages":["钻石","铁锭"],"format":"markdown"}'
```

## ⚙️ 环境变量配置

在Vercel Dashboard中配置：

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `WIKI_BASE_URL` | `https://zh.minecraft.wiki` | Wiki基础URL |
| `REQUEST_TIMEOUT` | `15000` | 请求超时时间(ms) |
| `RATE_LIMIT_MAX` | `50` | 每分钟最大请求数 |

## 📊 使用示例

### JavaScript

```javascript
const API_BASE = 'https://your-project.vercel.app';

// 搜索
const search = async (keyword) => {
  const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(keyword)}`);
  return response.json();
};

// 获取页面
const getPage = async (pageName) => {
  const response = await fetch(`${API_BASE}/api/page/${encodeURIComponent(pageName)}`);
  return response.json();
};
```

### Python

```python
import requests
import urllib.parse

API_BASE = 'https://your-project.vercel.app'

def search(keyword):
    url = f"{API_BASE}/api/search?q={urllib.parse.quote(keyword)}"
    return requests.get(url).json()

def get_page(page_name):
    url = f"{API_BASE}/api/page/{urllib.parse.quote(page_name)}"
    return requests.get(url).json()
```

## 🔧 项目特性

- **Serverless架构**: 零服务器维护，自动扩缩容
- **缓存优化**: 智能缓存策略，提升响应速度  
- **错误处理**: 完善的错误处理和日志记录
- **安全保护**: CORS、速率限制、参数验证
- **格式支持**: 支持HTML、Markdown多种输出格式

## 🚨 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 📞 获取帮助

- **完整文档**: [docs/](./docs/)
- **问题反馈**: [GitHub Issues](https://github.com/rice-awa/minecraft-wiki-fetch-vercel/issues)
- **部署指南**: [docs/deploy-vercel.md](./docs/deploy-vercel.md)

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件。

### 内容归属

- **Mojang 内容**: 版权归 Mojang Studios 所有，遵循《Minecraft 使用准则》
- **特别注明内容**: 版权归原作者所有
- **其他内容**: 遵循 CC BY-NC-SA 3.0 许可协议

### 重要提醒

1. **本项目仅提供技术工具**，用于访问和解析公开的 Wiki 内容
2. **用户有责任**遵守相关版权法律和许可协议
3. **商业使用**前请确保获得适当的授权
4. **转载内容**时请注明来自中文 Minecraft Wiki

## 免责声明

1. 本项目不拥有任何 Minecraft Wiki 内容的版权
2. 本项目不对通过 API 获取的内容的准确性、完整性或时效性承担责任
3. 用户使用本项目获取的内容时，应自行承担相关法律责任
4. 如有版权争议，请联系项目维护者进行处理