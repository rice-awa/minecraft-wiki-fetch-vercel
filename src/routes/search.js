/**
 * Search API Routes
 * 定义搜索相关的API路由
 */

const express = require('express');
const SearchController = require('../controllers/searchController');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateSearchParams } = require('../middleware/validation');

const router = express.Router();
const searchController = new SearchController();

/**
 * GET /api/search
 * 搜索Wiki内容
 * 
 * 查询参数:
 * - q: 搜索关键词 (必需)
 * - limit: 结果数量限制 (可选, 默认10, 最大50)
 * - namespaces: 命名空间 (可选, 默认主命名空间)
 * - format: 响应格式 (可选, 默认json)
 * - pretty: JSON格式化 (可选, true/false/1/0/yes/no, 默认false)
 * 
 * 示例:
 * GET /api/search?q=钻石&limit=5
 * GET /api/search?q=redstone&namespaces=0,14&limit=10
 * GET /api/search?q=钻石&pretty=true (格式化JSON输出)
 */
router.get('/', 
    validateSearchParams,
    asyncHandler(async (req, res) => {
        await searchController.search(req, res);
    })
);

// 处理不允许的方法 - 必须在GET路由之后
router.post('/', (req, res, next) => {
    const { MethodNotAllowedError } = require('../utils/errors');
    next(new MethodNotAllowedError(req.method, ['GET']));
});

router.put('/', (req, res, next) => {
    const { MethodNotAllowedError } = require('../utils/errors');
    next(new MethodNotAllowedError(req.method, ['GET']));
});

router.delete('/', (req, res, next) => {
    const { MethodNotAllowedError } = require('../utils/errors');
    next(new MethodNotAllowedError(req.method, ['GET']));
});

router.patch('/', (req, res, next) => {
    const { MethodNotAllowedError } = require('../utils/errors');
    next(new MethodNotAllowedError(req.method, ['GET']));
});

/**
 * GET /api/search/stats
 * 获取搜索服务统计信息
 */
router.get('/stats', 
    asyncHandler(async (req, res) => {
        await searchController.getStats(req, res);
    })
);

module.exports = router;