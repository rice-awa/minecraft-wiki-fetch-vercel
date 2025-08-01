/**
 * Main API Routes
 * 整合所有API路由
 */

const express = require('express');
const searchRoutes = require('./search');
const pageRoutes = require('./pages');
const healthRoutes = require('./health');

const router = express.Router();

// API版本信息
router.get('/', (req, res) => {
    res.json({
        name: 'Minecraft Wiki API',
        version: '1.0.0',
        description: 'API service for scraping Minecraft Chinese Wiki content',
        endpoints: {
            search: '/api/search',
            pages: '/api/page',
            batchPages: '/api/pages',
            health: '/health'
        },
        documentation: '/api/docs',
        timestamp: new Date().toISOString()
    });
});

// 挂载路由
router.use('/search', searchRoutes);
router.use('/page', pageRoutes);
router.use('/pages', pageRoutes); // 批量操作路由

module.exports = {
    apiRoutes: router,
    healthRoutes
};