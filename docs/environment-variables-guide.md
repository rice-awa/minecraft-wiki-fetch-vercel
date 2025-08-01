# 环境变量配置指南

本文档详细说明了 Minecraft Wiki API 项目中所有可用的环境变量配置选项。

## 快速开始

1. 复制示例配置文件：
   ```bash
   cp .env.example .env
   ```

2. 根据你的环境修改 `.env` 文件中的配置

3. 启动应用：
   ```bash
   npm start
   ```

## 配置分类

### 🖥️ 服务器基础配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `PORT` | number | `3000` | 服务器监听端口号 (1-65535) |
| `HOST` | string | `0.0.0.0` | 服务器监听的IP地址 |
| `NODE_ENV` | string | `development` | 运行环境 (`development`/`production`/`test`) |
| `AUTO_PORT` | boolean | `true` | 端口被占用时是否自动寻找可用端口 |
| `MAX_PORT_ATTEMPTS` | number | `100` | 自动端口选择的最大尝试次数 |

**示例配置：**
```env
PORT=8080
HOST=127.0.0.1
NODE_ENV=production
AUTO_PORT=false
MAX_PORT_ATTEMPTS=50
```

### 🌐 Wiki数据源配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `WIKI_BASE_URL` | string | `https://zh.minecraft.wiki` | Minecraft Wiki的基础URL |
| `REQUEST_TIMEOUT` | number | `10000` | HTTP请求超时时间（毫秒） |
| `MAX_RETRIES` | number | `3` | HTTP请求失败时的最大重试次数 |
| `USER_AGENT` | string | `MinecraftWikiAPI/1.0.0...` | HTTP请求的User-Agent标识 |

**示例配置：**
```env
WIKI_BASE_URL=https://en.minecraft.wiki
REQUEST_TIMEOUT=15000
MAX_RETRIES=5
USER_AGENT=MyApp/2.0.0 (https://example.com)
```

### 💾 缓存系统配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `REDIS_URL` | string | `redis://localhost:6379` | Redis数据库连接URL |
| `CACHE_TTL` | number | `1800` | 默认缓存过期时间（秒） |
| `MEMORY_CACHE_MAX_SIZE` | number | `1000` | 内存缓存最大条目数 |
| `SEARCH_CACHE_TTL` | number | `300` | 搜索结果缓存过期时间（秒） |
| `PAGE_CACHE_TTL` | number | `1800` | 页面内容缓存过期时间（秒） |

**示例配置：**
```env
REDIS_URL=redis://username:password@redis.example.com:6379/0
CACHE_TTL=3600
MEMORY_CACHE_MAX_SIZE=2000
SEARCH_CACHE_TTL=600
PAGE_CACHE_TTL=7200
```

### 🚦 访问限流配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `RATE_LIMIT_WINDOW` | number | `60000` | 限流时间窗口（毫秒） |
| `RATE_LIMIT_MAX` | number | `100` | 时间窗口内允许的最大请求数 |
| `RATE_LIMIT_BY_IP` | boolean | `true` | 是否基于IP地址独立计算限流 |
| `RATE_LIMIT_STORE` | string | `memory` | 限流数据存储方式 (`memory`/`redis`) |

**推荐配置：**

开发环境：
```env
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=30
RATE_LIMIT_BY_IP=true
RATE_LIMIT_STORE=memory
```

生产环境：
```env
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=1000
RATE_LIMIT_BY_IP=true
RATE_LIMIT_STORE=redis
```

### 📝 日志系统配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `LOG_LEVEL` | string | `info` | 日志记录级别 (`error`/`warn`/`info`/`debug`) |
| `LOG_DIR` | string | `logs` | 日志文件存储目录 |
| `LOG_CONSOLE` | boolean | `true` (开发) | 是否启用控制台日志输出 |
| `LOG_FILE` | boolean | `true` | 是否启用文件日志输出 |
| `LOG_MAX_SIZE` | number | `50` | 单个日志文件最大大小（MB） |
| `LOG_MAX_FILES` | number | `30` | 保留的日志文件数量 |

**示例配置：**
```env
LOG_LEVEL=warn
LOG_DIR=/var/log/minecraft-wiki-api
LOG_CONSOLE=false
LOG_FILE=true
LOG_MAX_SIZE=100
LOG_MAX_FILES=14
```

### 🔍 搜索功能配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `SEARCH_DEFAULT_LIMIT` | number | `10` | 搜索结果默认返回数量 |
| `SEARCH_MAX_LIMIT` | number | `50` | 搜索结果最大返回数量 |
| `SEARCH_MAX_KEYWORD_LENGTH` | number | `200` | 搜索关键词最大长度（字符） |

**示例配置：**
```env
SEARCH_DEFAULT_LIMIT=15
SEARCH_MAX_LIMIT=100
SEARCH_MAX_KEYWORD_LENGTH=500
```

### 🔒 安全配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ALLOWED_ORIGINS` | string | `*` | 允许的跨域来源（逗号分隔） |
| `FORCE_HTTPS` | boolean | `false` | 是否强制使用HTTPS |
| `SECURITY_HEADERS` | boolean | `true` | 是否启用安全HTTP头部 |
| `API_KEY` | string | - | API访问密钥（可选） |
| `JWT_SECRET` | string | - | JWT令牌签名密钥（可选） |

**生产环境安全配置：**
```env
ALLOWED_ORIGINS=https://myapp.com,https://api.myapp.com
FORCE_HTTPS=true
SECURITY_HEADERS=true
API_KEY=your-secure-api-key-here
JWT_SECRET=your-very-secure-jwt-secret-key
```

### 🗄️ 数据库配置（可选）

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `DATABASE_URL` | string | - | 数据库连接URL |
| `DATABASE_POOL_MAX` | number | `20` | 数据库连接池最大连接数 |
| `DATABASE_POOL_MIN` | number | `2` | 数据库连接池最小连接数 |

**示例配置：**
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/minecraft_wiki_api
DATABASE_POOL_MAX=30
DATABASE_POOL_MIN=5
```

### 📊 监控和健康检查

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `HEALTH_CHECK_PATH` | string | `/health` | 健康检查路径 |
| `HEALTH_CHECK_DETAILED` | boolean | `true` | 是否启用详细健康检查 |
| `METRICS_PATH` | string | - | Prometheus监控指标端点 |

**示例配置：**
```env
HEALTH_CHECK_PATH=/status
HEALTH_CHECK_DETAILED=false
METRICS_PATH=/metrics
```

### ⚡ 性能优化配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `ENABLE_COMPRESSION` | boolean | `true` | 是否启用响应压缩 |
| `STATIC_CACHE_TIME` | number | `86400` | 静态资源缓存时间（秒） |
| `MAX_REQUEST_SIZE` | string | `10mb` | HTTP请求体最大大小 |
| `NODE_MEMORY_LIMIT` | number | `0` | Node.js内存限制（MB，0=不限制） |

**高性能配置：**
```env
ENABLE_COMPRESSION=true
STATIC_CACHE_TIME=604800
MAX_REQUEST_SIZE=5mb
NODE_MEMORY_LIMIT=1024
```

### 🔌 第三方服务配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `IMAGE_STORAGE_URL` | string | - | 外部图片存储服务URL |
| `ANALYTICS_API_KEY` | string | - | 分析服务API密钥 |
| `SMTP_HOST` | string | - | 邮件服务器主机 |
| `SMTP_PORT` | number | `587` | 邮件服务器端口 |
| `SMTP_USER` | string | - | 邮件服务器用户名 |
| `SMTP_PASS` | string | - | 邮件服务器密码 |

**邮件服务配置示例：**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 🛠️ 开发和调试配置

| 变量名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `DEBUG` | boolean | `false` | 是否启用调试模式 |
| `ENABLE_API_DOCS` | boolean | `true` | 是否启用API文档 |
| `ENABLE_PROFILING` | boolean | `false` | 是否启用性能分析 |

**开发环境配置：**
```env
DEBUG=true
ENABLE_API_DOCS=true
ENABLE_PROFILING=true
```

## 环境配置模板

### 开发环境
```env
NODE_ENV=development
PORT=3000
DEBUG=true
LOG_LEVEL=debug
RATE_LIMIT_MAX=30
```

### 生产环境
```env
NODE_ENV=production
PORT=80
DEBUG=false
LOG_LEVEL=warn
RATE_LIMIT_MAX=1000
ALLOWED_ORIGINS=https://yourdomain.com
FORCE_HTTPS=true
REDIS_URL=redis://your-redis-host:6379
```

### 测试环境
```env
NODE_ENV=test
PORT=0
LOG_LEVEL=error
RATE_LIMIT_MAX=999999
```

## 配置验证

系统会在启动时自动验证所有配置：

- ✅ 必需配置项检查
- ✅ 数值范围验证
- ✅ 枚举值验证
- ✅ 逻辑一致性检查

如果配置无效，应用会显示详细的错误信息并退出。

## 最佳实践

### 安全
- 不要将敏感信息提交到版本控制
- 生产环境使用强密码和密钥
- 定期轮换API密钥

### 性能
- 根据服务器规格设置内存限制
- 启用响应压缩
- 合理设置缓存时间

### 环境管理
- 使用不同的配置文件管理多环境
- 使用环境变量管理工具
- 定期检查配置的有效性

## 故障排除

**常见配置错误：**

1. **端口已被占用**：
   - 设置 `AUTO_PORT=true` 自动选择端口
   - 或者修改 `PORT` 为其他值

2. **限流过于严格**：
   - 增加 `RATE_LIMIT_MAX` 值
   - 调整 `RATE_LIMIT_WINDOW` time窗口

3. **日志文件过多**：
   - 减少 `LOG_MAX_FILES` 数量
   - 增加 `LOG_MAX_SIZE` 大小

4. **内存不足**：
   - 设置 `NODE_MEMORY_LIMIT` 限制内存使用
   - 减少 `MEMORY_CACHE_MAX_SIZE` 缓存大小

有任何配置问题，请参考错误信息或查看 `src/config/index.js` 文件了解详细的验证逻辑。