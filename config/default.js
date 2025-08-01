module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  
  wiki: {
    baseUrl: process.env.WIKI_BASE_URL || 'https://zh.minecraft.wiki',
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 10000,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    userAgent: 'Minecraft-Wiki-API/1.0.0 (https://github.com/user/minecraft-wiki-api)'
  },
  
  cache: {
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: parseInt(process.env.CACHE_TTL) || 1800, // 30 minutes
    maxItems: 1000 // For memory cache
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000, // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // requests per window
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: {
      error: 'logs/error.log',
      combined: 'logs/combined.log'
    }
  }
};