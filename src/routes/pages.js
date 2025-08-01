/**
 * Page API Routes
 * 定义页面内容相关的API路由
 */

const express = require('express');
const PageController = require('../controllers/pageController');
const { asyncHandler } = require('../middleware/errorHandler');
const { validatePageParams, validateBatchPageParams, validateContentType } = require('../middleware/validation');

const router = express.Router();
const pageController = new PageController();

/**
 * GET /api/page/:pageName
 * 获取Wiki页面内容
 * 
 * 路径参数:
 * - pageName: 页面名称 (必需, URL编码)
 * 
 * 查询参数:
 * - format: 输出格式 (可选: html, markdown, both, 默认both)
 * - useCache: 是否使用缓存 (可选: true/false, 默认true)
 * - includeMetadata: 是否包含元数据 (可选: true/false, 默认true)
 * - pretty: JSON格式化 (可选: true/false/1/0/yes/no, 默认false)
 * 
 * 示例:
 * GET /api/page/钻石
 * GET /api/page/%E9%92%BB%E7%9F%B3?format=markdown
 * GET /api/page/Diamond?format=html&useCache=false
 * GET /api/page/钻石?pretty=true (格式化JSON输出)
 */
router.get('/:pageName', 
    validatePageParams,
    asyncHandler(async (req, res) => {
        await pageController.getPage(req, res);
    })
);

/**
 * POST /api/pages
 * 批量获取Wiki页面内容
 * 
 * 请求体:
 * {
 *   "pages": ["页面1", "页面2", "页面3"],
 *   "format": "markdown",
 *   "concurrency": 3,
 *   "useCache": true
 * }
 */
router.post('/', 
    validateContentType(['application/json']),
    validateBatchPageParams,
    asyncHandler(async (req, res) => {
        await pageController.getPages(req, res);
    })
);

/**
 * GET /api/page/:pageName/exists
 * 检查页面是否存在
 * 
 * 路径参数:
 * - pageName: 页面名称 (必需, URL编码)
 * 
 * 示例:
 * GET /api/page/钻石/exists
 * GET /api/page/%E9%92%BB%E7%9F%B3/exists
 */
router.get('/:pageName/exists', 
    asyncHandler(async (req, res) => {
        await pageController.checkPageExists(req, res);
    })
);

/**
 * DELETE /api/page/:pageName/cache
 * 清除页面缓存
 * 
 * 路径参数:
 * - pageName: 页面名称 (必需, URL编码) 或 'all' 清除所有缓存
 * 
 * 示例:
 * DELETE /api/page/钻石/cache
 * DELETE /api/page/all/cache
 */
router.delete('/:pageName/cache', 
    asyncHandler(async (req, res) => {
        await pageController.clearPageCache(req, res);
    })
);

/**
 * GET /api/pages/stats
 * 获取页面服务统计信息
 */
router.get('/stats', 
    asyncHandler(async (req, res) => {
        await pageController.getStats(req, res);
    })
);

module.exports = router;