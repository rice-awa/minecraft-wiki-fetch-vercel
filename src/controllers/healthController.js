/**
 * Health Check Controller
 * 处理服务健康检查相关的API请求
 */

const WikiSearchService = require('../services/wikiSearchService');
const WikiPageService = require('../services/wikiPageService');
const { logger } = require('../utils/logger');
const config = require('../config');

class HealthController {
    constructor() {
        this.searchService = new WikiSearchService();
        this.pageService = new WikiPageService();
        this.startTime = Date.now();
    }

    /**
     * 基础健康检查
     * GET /health
     */
    async basicHealth(req, res) {
        try {
            const uptime = process.uptime();
            const memory = process.memoryUsage();
            
            const response = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: {
                    seconds: Math.floor(uptime),
                    human: this.formatUptime(uptime)
                },
                memory: {
                    used: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
                    total: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
                    system: `${Math.round(memory.rss / 1024 / 1024)}MB`
                },
                node: {
                    version: process.version,
                    platform: process.platform,
                    arch: process.arch
                },
                service: {
                    name: 'minecraft-wiki-api',
                    version: '1.0.0',
                    environment: process.env.NODE_ENV || 'development'
                }
            };

            // 设置适当的缓存头
            res.set({
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json'
            });

            return res.json(response);

        } catch (error) {
            logger.error('基础健康检查失败', { error: error.message });
            
            return res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: '服务检查失败'
            });
        }
    }

    /**
     * 详细健康检查（包含依赖服务检查）
     * GET /health/detailed
     */
    async detailedHealth(req, res) {
        const startTime = Date.now();
        
        try {
            // 基础信息
            const basicInfo = await this.getBasicInfo();
            
            // 依赖服务检查
            const dependencies = await this.checkDependencies();
            
            // 缓存状态检查
            const cacheStatus = this.checkCacheStatus();
            
            const checkDuration = Date.now() - startTime;
            
            // 判断整体健康状态
            const overallStatus = dependencies.every(dep => dep.status === 'healthy') ? 'healthy' : 'degraded';
            
            const response = {
                status: overallStatus,
                timestamp: new Date().toISOString(),
                checkDuration: `${checkDuration}ms`,
                ...basicInfo,
                dependencies,
                cache: cacheStatus
            };

            const statusCode = overallStatus === 'healthy' ? 200 : 503;
            
            logger.info('详细健康检查完成', {
                status: overallStatus,
                duration: checkDuration,
                dependencyCount: dependencies.length
            });

            return res.status(statusCode).json(response);

        } catch (error) {
            logger.error('详细健康检查失败', { error: error.message, stack: error.stack });
            
            return res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: '详细检查失败',
                details: error.message
            });
        }
    }

    /**
     * 就绪状态检查
     * GET /health/ready
     */
    async readinessCheck(req, res) {
        try {
            // 检查关键依赖是否就绪
            const checks = await Promise.allSettled([
                this.checkWikiConnectivity(),
                this.checkServiceInitialization()
            ]);

            const allReady = checks.every(check => check.status === 'fulfilled' && check.value.ready);
            
            const response = {
                ready: allReady,
                timestamp: new Date().toISOString(),
                checks: checks.map((check, index) => ({
                    name: ['wiki_connectivity', 'service_initialization'][index],
                    ready: check.status === 'fulfilled' ? check.value.ready : false,
                    details: check.status === 'fulfilled' ? check.value.details : check.reason?.message
                }))
            };

            const statusCode = allReady ? 200 : 503;
            return res.status(statusCode).json(response);

        } catch (error) {
            logger.error('就绪检查失败', { error: error.message });
            
            return res.status(503).json({
                ready: false,
                timestamp: new Date().toISOString(),
                error: '就绪检查失败'
            });
        }
    }

    /**
     * 存活状态检查
     * GET /health/live
     */
    async livenessCheck(req, res) {
        try {
            // 简单的存活检查
            const response = {
                alive: true,
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                pid: process.pid
            };

            return res.json(response);

        } catch (error) {
            logger.error('存活检查失败', { error: error.message });
            
            return res.status(503).json({
                alive: false,
                timestamp: new Date().toISOString(),
                error: '存活检查失败'
            });
        }
    }

    /**
     * 获取基础信息
     * @private
     */
    async getBasicInfo() {
        const uptime = process.uptime();
        const memory = process.memoryUsage();
        
        return {
            uptime: {
                seconds: Math.floor(uptime),
                human: this.formatUptime(uptime)
            },
            memory: {
                used: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
                total: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
                system: `${Math.round(memory.rss / 1024 / 1024)}MB`,
                external: `${Math.round(memory.external / 1024 / 1024)}MB`
            },
            node: {
                version: process.version,
                platform: process.platform,
                arch: process.arch
            },
            service: {
                name: 'minecraft-wiki-api',
                version: '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                startTime: new Date(this.startTime).toISOString()
            }
        };
    }

    /**
     * 检查依赖服务
     * @private
     */
    async checkDependencies() {
        const dependencies = [];

        try {
            // 检查Wiki连接性
            const wikiCheck = await this.checkWikiConnectivity();
            dependencies.push({
                name: 'minecraft_wiki',
                type: 'external_api',
                status: wikiCheck.ready ? 'healthy' : 'unhealthy',
                responseTime: wikiCheck.responseTime,
                details: wikiCheck.details
            });

        } catch (error) {
            dependencies.push({
                name: 'minecraft_wiki',
                type: 'external_api',
                status: 'unhealthy',
                error: error.message
            });
        }

        return dependencies;
    }

    /**
     * 检查缓存状态
     * @private
     */
    checkCacheStatus() {
        try {
            const searchCacheStats = this.searchService.getCacheStats();
            const pageCacheStats = this.pageService.getCacheStats();

            return {
                search: {
                    enabled: searchCacheStats.enabled,
                    size: searchCacheStats.size || 0,
                    maxSize: searchCacheStats.maxSize || 0,
                    hitRate: 'N/A' // 需要实现命中率统计
                },
                page: {
                    enabled: pageCacheStats.enabled,
                    size: pageCacheStats.size || 0,
                    maxSize: pageCacheStats.maxSize || 0,
                    hitRate: 'N/A' // 需要实现命中率统计
                }
            };

        } catch (error) {
            logger.error('缓存状态检查失败', { error: error.message });
            return {
                error: '缓存状态检查失败'
            };
        }
    }

    /**
     * 检查Wiki连接性
     * @private
     */
    async checkWikiConnectivity() {
        const startTime = Date.now();
        
        try {
            // 尝试进行一个简单的搜索请求来测试连接性
            const testResult = await this.searchService.search('minecraft', { limit: 1 });
            const responseTime = Date.now() - startTime;

            if (testResult.success) {
                return {
                    ready: true,
                    responseTime: `${responseTime}ms`,
                    details: 'Wiki API连接正常'
                };
            } else {
                return {
                    ready: false,
                    responseTime: `${responseTime}ms`,
                    details: `Wiki API错误: ${testResult.error?.message || '未知错误'}`
                };
            }

        } catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                ready: false,
                responseTime: `${responseTime}ms`,
                details: `连接失败: ${error.message}`
            };
        }
    }

    /**
     * 检查服务初始化状态
     * @private
     */
    async checkServiceInitialization() {
        try {
            // 检查关键服务是否正确初始化
            const checks = [
                this.searchService && typeof this.searchService.search === 'function',
                this.pageService && typeof this.pageService.getPage === 'function'
            ];

            const allInitialized = checks.every(check => check === true);

            return {
                ready: allInitialized,
                details: allInitialized ? '所有服务已正确初始化' : '部分服务初始化失败'
            };

        } catch (error) {
            return {
                ready: false,
                details: `初始化检查失败: ${error.message}`
            };
        }
    }

    /**
     * 格式化运行时间
     * @private
     */
    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (days > 0) {
            return `${days}天 ${hours}小时 ${minutes}分钟`;
        } else if (hours > 0) {
            return `${hours}小时 ${minutes}分钟`;
        } else if (minutes > 0) {
            return `${minutes}分钟 ${secs}秒`;
        } else {
            return `${secs}秒`;
        }
    }
}

module.exports = HealthController;