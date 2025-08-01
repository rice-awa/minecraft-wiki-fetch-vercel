# JSON格式化功能说明

## 📋 功能概述

为Minecraft Wiki API添加了JSON响应格式化功能，允许开发者通过查询参数控制JSON输出格式，提升开发调试体验。

## ✨ 新增功能

### 1. JSON格式化中间件
- **文件**: `src/middleware/jsonFormatter.js`
- **功能**: 根据请求参数自动格式化JSON响应
- **特性**: 
  - 支持多种参数值格式
  - 自动添加响应头标识
  - 性能优化的实现

### 2. 参数验证增强
- **文件**: `src/middleware/validation.js`
- **功能**: 在现有验证中间件中添加pretty参数验证
- **支持**: 搜索API和页面API的参数验证

### 3. 路由文档更新
- **文件**: `src/routes/search.js`, `src/routes/pages.js`
- **功能**: 更新API路由注释，包含pretty参数说明

## 🔧 使用方法

### 基本语法
```
GET /api/search?q=钻石&pretty=true
GET /api/page/钻石?format=markdown&pretty=1
```

### 支持的参数值
| 参数值 | 结果 | 说明 |
|--------|------|------|
| `true`, `TRUE`, `True` | 格式化 | 字符串true（大小写不敏感） |
| `false`, `FALSE`, `False` | 压缩 | 字符串false（大小写不敏感） |
| `1` | 格式化 | 数字字符串1 |
| `0` | 压缩 | 数字字符串0 |
| `yes`, `YES`, `Yes` | 格式化 | 字符串yes（大小写不敏感） |
| `no`, `NO`, `No` | 压缩 | 字符串no（大小写不敏感） |
| 未提供 | 压缩 | 默认行为 |

## 📊 响应格式对比

### 压缩格式（默认）
```json
{"success":true,"data":{"query":"钻石","results":[{"title":"钻石","url":"https://zh.minecraft.wiki/w/钻石"}]}}
```

### 格式化输出
```json
{
  "success": true,
  "data": {
    "query": "钻石",
    "results": [
      {
        "title": "钻石",
        "url": "https://zh.minecraft.wiki/w/钻石"
      }
    ]
  }
}
```

## 🏷️ 响应头信息

格式化的响应包含以下HTTP头：
```
X-JSON-Formatted: true
Content-Type: application/json; charset=utf-8
```

压缩的响应包含：
```
X-JSON-Formatted: false
Content-Type: application/json
```

## 🚀 性能影响

### 响应大小
- **格式化输出**: 增加约20-30%的响应大小
- **压缩输出**: 最小响应大小

### 处理时间
- **格式化输出**: 轻微增加处理时间（通常<5ms）
- **压缩输出**: 最快处理速度

### 建议
- **开发环境**: 使用`pretty=true`便于调试
- **生产环境**: 使用默认压缩格式节省带宽

## 🧪 测试覆盖

### 测试文件
- `tests/jsonFormatter.test.js`: 完整的单元测试套件

### 测试覆盖范围
- ✅ 参数值解析测试
- ✅ JSON格式化功能测试
- ✅ 参数验证测试
- ✅ 边界情况测试
- ✅ 错误处理测试

### 运行测试
```bash
npm test -- jsonFormatter.test.js
```

## 📚 演示和示例

### 演示文件
1. **`demo/jsonFormatterDemo.js`**: 完整功能演示
2. **`example/prettyJsonExample.js`**: 简单使用示例

### 运行演示
```bash
# 运行完整演示
npm run demo:formatter

# 运行简单示例
npm run demo:json
```

## 🔧 技术实现

### 中间件架构
```javascript
// 中间件注册
app.use(jsonFormatterMiddleware());

// 自动处理所有JSON响应
res.json(data); // 根据pretty参数自动格式化
```

### 核心逻辑
1. **参数检测**: 检查请求中的pretty参数
2. **格式判断**: 根据参数值决定是否格式化
3. **响应重写**: 重写res.json方法实现格式化
4. **头部设置**: 添加X-JSON-Formatted响应头

## ⚠️ 错误处理

### 无效参数处理
当提供无效的pretty参数值时，API返回400错误：

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PRETTY_PARAMETER",
    "message": "pretty参数值无效",
    "details": {
      "received": "invalid_value",
      "validValues": ["true", "false", "1", "0", "yes", "no"]
    },
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## 📖 文档更新

### 更新的文档
1. **`docs/API_DOCUMENTATION.md`**: 添加JSON格式化章节
2. **`README.md`**: 更新使用示例
3. **路由注释**: 更新所有相关API端点的注释

### 新增文档
1. **`docs/JSON_FORMATTING_FEATURE.md`**: 本功能说明文档

## 🔄 向后兼容性

- ✅ **完全向后兼容**: 不影响现有API调用
- ✅ **默认行为不变**: 未指定pretty参数时保持原有压缩格式
- ✅ **无破坏性更改**: 所有现有功能正常工作

## 🎯 使用场景

### 开发调试
```bash
# 调试搜索API
curl "http://localhost:3000/api/search?q=钻石&pretty=true"

# 调试页面API
curl "http://localhost:3000/api/page/钻石?pretty=true"
```

### API测试
```javascript
// 测试时使用格式化输出
const response = await fetch('/api/search?q=test&pretty=true');
const data = await response.json();
console.log(JSON.stringify(data, null, 2));
```

### 生产环境
```javascript
// 生产环境使用压缩格式
const response = await fetch('/api/search?q=test');
const data = await response.json();
```

## 📈 未来扩展

### 可能的增强功能
1. **自定义缩进**: 支持指定缩进空格数
2. **格式化选项**: 支持更多JSON格式化选项
3. **内容类型检测**: 根据Accept头自动选择格式
4. **压缩算法**: 支持gzip等压缩算法

### 配置选项
未来可能添加的环境变量：
- `JSON_PRETTY_DEFAULT`: 设置默认格式化行为
- `JSON_PRETTY_INDENT`: 设置默认缩进空格数
- `JSON_PRETTY_ENABLED`: 全局启用/禁用格式化功能

## 🏁 总结

JSON格式化功能为Minecraft Wiki API提供了更好的开发体验，同时保持了生产环境的性能优势。该功能：

- ✅ 易于使用：简单的查询参数控制
- ✅ 灵活配置：支持多种参数值格式
- ✅ 性能友好：可选择性使用，不影响默认性能
- ✅ 完全兼容：不破坏现有API调用
- ✅ 测试完整：全面的测试覆盖
- ✅ 文档齐全：详细的使用说明和示例

这个功能特别适合API开发、调试和测试场景，提升了开发者的使用体验。