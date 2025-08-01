# Minecraft Wiki API - Serverless版本

这是Minecraft Wiki API的Vercel Serverless版本，可以直接部署到Vercel平台使用。本地或服务器部署请查看[服务器部署版本](https://github.com/rice-awa/minecraft-wiki-fetch)
## 🚀 快速部署

### 一键部署到Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rice-awa/minecraft-wiki-fetch-vercle)

### 带环境变量部署：
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rice-awa/minecraft-wiki-fetch-vercel&env=WIKI_BASE_URL,REQUEST_TIMEOUT,RATE_LIMIT_MAX&envDescription=API%20Configuration&envLink=https://github.com/rice-awa/minecraft-wiki-fetch-vercel/blob/main/.env.vercel)

### **注意：**Vercel的域名在国内可能无法访问，因此需要使用自己的自定义域名。

### 手动部署

1. **克隆项目**
   ```bash
   git clone https://github.com/rice-awa/minecraft-wiki-fetch.git
   cd minecraft-wiki-api
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **安装Vercel CLI**
   ```bash
   npm install -g vercel
   ```

4. **登录Vercel**
   ```bash
   vercel login
   ```

5. **部署**
   ```bash
   npm run deploy
   ```

## 📋 API文档

### 基础信息
- **基础URL**: `https://your-project.vercel.app`
- **响应格式**: JSON
- **字符编码**: UTF-8

### 端点列表

#### 1. 搜索Wiki内容
```http
GET /api/search?q={keyword}&limit={number}&pretty={true|false}
```

**参数说明**:
- `q` (必需): 搜索关键词
- `limit` (可选): 结果数量，默认10，最大30
- `pretty` (可选): 是否格式化JSON输出

**示例**:
```bash
curl "https://your-project.vercel.app/api/search?q=钻石&limit=5&pretty=true"
```

#### 2. 获取页面内容
```http
GET /api/page/{pageName}?format={html|markdown|both}&pretty={true|false}
```

**参数说明**:
- `pageName` (必需): 页面名称（URL编码）
- `format` (可选): 输出格式，默认both
- `pretty` (可选): 是否格式化JSON输出

**示例**:
```bash
curl "https://your-project.vercel.app/api/page/钻石?format=markdown&pretty=true"
```

#### 3. 批量获取页面
```http
POST /api/pages
Content-Type: application/json

{
  "pages": ["钻石", "铁锭", "金锭"],
  "format": "markdown",
  "concurrency": 3
}
```

#### 4. 检查页面是否存在
```http
GET /api/page/{pageName}/exists
```

#### 5. 健康检查
```http
GET /health
```

## 🔧 配置说明

### 环境变量

在Vercel Dashboard中配置以下环境变量：

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `NODE_ENV` | `production` | 运行环境 |
| `WIKI_BASE_URL` | `https://zh.minecraft.wiki` | Wiki基础URL |
| `REQUEST_TIMEOUT` | `15000` | 请求超时时间(ms) |
| `MAX_RETRIES` | `2` | 最大重试次数 |
| `RATE_LIMIT_MAX` | `50` | 每分钟最大请求数 |
| `SEARCH_MAX_LIMIT` | `30` | 搜索结果最大数量 |
| `ALLOWED_ORIGINS` | `*` | 允许的跨域来源 |

### 性能限制

- **函数执行时间**: 最大30秒
- **内存使用**: 1024MB
- **请求体大小**: 最大5MB
- **并发请求**: 根据Vercel套餐限制

## 📊 使用示例

### JavaScript/Node.js
```javascript
const API_BASE = 'https://your-project.vercel.app';

// 搜索
async function search(keyword) {
  const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(keyword)}`);
  return response.json();
}

// 获取页面
async function getPage(pageName) {
  const response = await fetch(`${API_BASE}/api/page/${encodeURIComponent(pageName)}`);
  return response.json();
}

// 使用示例
search('钻石').then(data => console.log(data));
getPage('钻石').then(data => console.log(data));
```

### Python
```python
import requests
import urllib.parse

API_BASE = 'https://your-project.vercel.app'

def search(keyword):
    url = f"{API_BASE}/api/search?q={urllib.parse.quote(keyword)}"
    response = requests.get(url)
    return response.json()

def get_page(page_name):
    url = f"{API_BASE}/api/page/{urllib.parse.quote(page_name)}"
    response = requests.get(url)
    return response.json()

# 使用示例
result = search('钻石')
print(result)
```

### cURL
```bash
# 搜索
curl "https://your-project.vercel.app/api/search?q=钻石&pretty=true"

# 获取页面
curl "https://your-project.vercel.app/api/page/钻石?format=markdown&pretty=true"

# 批量获取
curl -X POST "https://your-project.vercel.app/api/pages" \
  -H "Content-Type: application/json" \
  -d '{"pages":["钻石","铁锭"],"format":"markdown"}'
```

## 🔍 监控和调试

### 查看日志
```bash
vercel logs https://your-project.vercel.app
```

### 性能监控
- 访问Vercel Dashboard查看函数调用统计
- 监控响应时间和错误率
- 查看带宽使用情况

### 调试模式
设置环境变量 `DEBUG=true` 启用详细日志输出。

## 🚨 错误处理

API使用统一的错误响应格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": "详细信息",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### ❓ 常见问题

**Q: 部署失败怎么办？**
A: 检查 package.json 中的依赖，确保 Node.js 版本 >= 18.0.0

**Q: 函数超时怎么办？**
A: 检查 REQUEST_TIMEOUT 设置，确保不超过 30 秒

**Q: 如何查看日志？**
A: 使用 `vercel logs https://your-project.vercel.app`

### 常见错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|------------|------|
| `INVALID_PARAMETERS` | 400 | 请求参数无效 |
| `PAGE_NOT_FOUND` | 404 | 页面不存在 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `INTERNAL_SERVER_ERROR` | 500 | 服务器内部错误 |

## 🔄 更新部署

推送代码到 Git 仓库会自动触发重新部署。

## 📈 性能优化

### 缓存策略
- 搜索结果缓存5分钟
- 页面内容缓存15分钟
- 使用内存缓存，函数重启后清空

### 最佳实践
1. 合理设置请求频率
2. 使用批量接口减少请求次数
3. 启用响应压缩
4. 缓存常用数据

## 🔒 安全说明

- 启用HTTPS强制重定向
- 配置CORS跨域策略
- 实施请求频率限制
- 输入参数验证和清理

## 📞 技术支持

- **API文档**: [完整API文档](./docs/API_DOCUMENTATION.md)
- **serverless迁移说明**: [serverless迁移说明](./SERVERLESS-MIGRATION.md)
- **问题反馈**: [GitHub Issues](https://github.com/your-username/minecraft-wiki-api/issues)
- **更新日志**: [CHANGELOG.md](./CHANGELOG.md)

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