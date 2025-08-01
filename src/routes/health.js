/**
 * Health Check Routes
 * 定义健康检查相关的API路由
 */

const express = require('express');
const HealthController = require('../controllers/healthController');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();
const healthController = new HealthController();

/**
 * GET /health
 * 基础健康检查
 * 返回服务的基本状态信息
 */
router.get('/', 
    asyncHandler(async (req, res) => {
        await healthController.basicHealth(req, res);
    })
);

/**
 * GET /health/detailed
 * 详细健康检查
 * 包含依赖服务检查和详细状态信息
 */
router.get('/detailed', 
    asyncHandler(async (req, res) => {
        await healthController.detailedHealth(req, res);
    })
);

/**
 * GET /health/ready
 * 就绪状态检查
 * 检查服务是否就绪处理请求
 */
router.get('/ready', 
    asyncHandler(async (req, res) => {
        await healthController.readinessCheck(req, res);
    })
);

/**
 * GET /health/live
 * 存活状态检查
 * 检查服务是否存活
 */
router.get('/live', 
    asyncHandler(async (req, res) => {
        await healthController.livenessCheck(req, res);
    })
);

module.exports = router;