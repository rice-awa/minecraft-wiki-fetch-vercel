# 项目架构文档

## 📁 目录结构

```
minecraft-wiki-api/
├── src/                           # 源代码目录
│   ├── config/                    # 配置管理
│   │   └── index.js              # 环境变量配置和验证
│   ├── controllers/               # 控制器层
│   │   ├── searchController.js   # 搜索API控制器
│   │   ├── pageController.js     # 页面API控制器
│   │   └── healthController.js   # 健康检查控制器
│   ├── middleware/                # 中间件
│   │   ├── errorHandler.js       # 错误处理中间件
│   │   └── validation.js         # 请求验证中间件
│   ├── routes/                    # 路由定义
│   │   ├── index.js              # 主路由
│   │   ├── search.js             # 搜索路由
│   │   ├── pages.js              # 页面路由
│   │   └── health.js             # 健康检查路由
│   ├── services/                  # 业务逻辑层
│   │   ├── wikiSearchService.js  # Wiki搜索服务
│   │   ├── wikiPageService.js    # Wiki页面服务
│   │   ├── searchUrlBuilder.js   # 搜索URL构建器
│   │   ├── searchResultsParser.js # 搜索结果解析器
│   │   ├── pageUrlHandler.js     # 页面URL处理器
│   │   ├── pageContentParser.js  # 页面内容解析器
│   │   └── htmlToMarkdownConverter.js # HTML转Markdown转换器
│   ├── utils/                     # 工具类
│   │   ├── httpClient.js         # HTTP客户端
│   │   ├── logger.js             # 日志工具
│   │   ├── errors.js             # 错误定义
│   │   └── portManager.js        # 端口管理工具
│   └── index.js                  # 应用入口文件
├── tests/                         # 测试文件
│   ├── setup.js                  # Jest测试配置
│   ├── app.test.js               # 应用基础测试
│   └── realNetwork.test.js       # 网络集成测试
├── docs/                          # 文档目录
│   ├── API_DOCUMENTATION.md      # API接口文档
│   ├── environment-variables-guide.md # 环境变量配置指南
│   └── PROJECT_STRUCTURE.md      # 项目架构文档（本文件）
├── config/                        # 配置文件
│   └── default.js                # 默认配置文件
├── logs/                          # 日志文件目录
├── .env.example                   # 环境变量示例
├── jest.config.js                 # Jest测试配置
├── package.json                   # 项目配置和依赖
└── README.md                      # 项目说明文档
```

## 🏗️ 架构设计

### 分层架构

```
┌─────────────────────────────────────┐
│              Routes                 │  ← HTTP路由层
├─────────────────────────────────────┤
│            Controllers             │  ← 控制器层
├─────────────────────────────────────┤
│             Services               │  ← 业务逻辑层
├─────────────────────────────────────┤
│              Utils                 │  ← 工具类层
└─────────────────────────────────────┘
```

### 核心组件

#### 1. 路由层 (Routes)
- **职责**: HTTP请求路由和基础验证
- **文件**: `src/routes/`
- **特点**: RESTful API设计，支持版本控制

#### 2. 控制器层 (Controllers)
- **职责**: 请求处理、参数验证、响应格式化
- **文件**: `src/controllers/`
- **特点**: 统一的错误处理和响应格式

#### 3. 服务层 (Services)
- **职责**: 核心业务逻辑、数据处理
- **文件**: `src/services/`
- **特点**: 模块化设计，可复用组件

#### 4. 工具层 (Utils)
- **职责**: 通用工具函数、辅助功能
- **文件**: `src/utils/`
- **特点**: 无状态函数，高度可复用

## 🔧 核心技术栈

### 后端框架
- **Express.js**: 高性能 Node.js Web 框架
- **Node.js 18+**: 现代 JavaScript 运行时

### 数据处理
- **Cheerio**: 服务端 jQuery，用于 HTML 解析
- **Turndown**: HTML 到 Markdown 的转换器
- **Axios**: Promise 基础的 HTTP 客户端

### 安全和中间件
- **Helmet**: 安全 HTTP 头部设置
- **CORS**: 跨域资源共享控制
- **express-rate-limit**: 请求频率限制

### 日志和监控
- **Winston**: 企业级日志记录库
- **结构化日志**: JSON 格式日志输出

### 开发和测试
- **Jest**: JavaScript 测试框架
- **Supertest**: HTTP 断言库
- **Nodemon**: 开发时自动重启

## 🔄 数据流

### 搜索流程
```
HTTP Request → Routes → Controller → SearchService → UrlBuilder → HttpClient → Wiki API
                                                   ↓
HTTP Response ← Controller ← SearchService ← ResultsParser ← Wiki Response
```

### 页面获取流程
```
HTTP Request → Routes → Controller → PageService → UrlHandler → HttpClient → Wiki Page
                                                 ↓
HTTP Response ← Controller ← PageService ← ContentParser ← MarkdownConverter ← HTML Content
```

## 📦 模块依赖关系

```
Controllers
    ↓
Services
    ↓
Utils (HttpClient, Logger, etc.)
```

### 依赖原则
- **单向依赖**: 上层依赖下层，下层不依赖上层
- **接口隔离**: 通过接口定义模块边界
- **依赖注入**: 支持配置和测试的灵活性

## 🧪 测试架构

### 测试分层
- **单元测试**: 测试单个函数和类
- **集成测试**: 测试模块间交互
- **端到端测试**: 测试完整的API流程

### 测试文件组织
```
tests/
├── unit/                    # 单元测试
│   ├── services/           # 服务层测试
│   ├── utils/              # 工具类测试
│   └── controllers/        # 控制器测试
├── integration/            # 集成测试
│   └── api/               # API集成测试
└── e2e/                   # 端到端测试
    └── scenarios/         # 测试场景
```

## 🔧 配置管理

### 配置层级
1. **默认配置**: `config/default.js`
2. **环境变量**: `.env` 文件
3. **运行时配置**: 环境变量覆盖

### 配置验证
- 启动时自动验证所有配置
- 类型检查和范围验证
- 缺失配置的友好错误提示

## 📝 日志架构

### 日志级别
- **error**: 错误信息
- **warn**: 警告信息
- **info**: 一般信息
- **debug**: 调试信息

### 日志输出
- **控制台**: 开发环境实时查看
- **文件**: 生产环境持久化存储
- **结构化**: JSON格式便于分析

## 🚀 部署架构

### 单机部署
```
Load Balancer (Nginx)
    ↓
Node.js Application
    ↓
File System (Logs, Cache)
```

### 分布式部署
```
Load Balancer
    ↓
Multiple Node.js Instances
    ↓
Redis (Shared Cache)
    ↓
Centralized Logging
```

## 🔄 扩展性设计

### 水平扩展
- 无状态设计，支持多实例部署
- 共享缓存（Redis）支持
- 负载均衡友好

### 垂直扩展
- 内存缓存优化
- 异步处理支持
- 资源使用监控

## 📊 性能优化

### 缓存策略
- **多层缓存**: 内存 + Redis
- **智能失效**: TTL + LRU
- **缓存预热**: 热点数据预加载

### 并发处理
- **异步I/O**: 非阻塞操作
- **连接池**: HTTP连接复用
- **限流保护**: 防止过载

## 🔒 安全设计

### 输入验证
- 参数类型检查
- 长度和格式限制
- SQL注入防护

### 访问控制
- IP限流
- CORS配置
- 安全头部设置

### 错误处理
- 统一错误格式
- 敏感信息过滤
- 详细日志记录