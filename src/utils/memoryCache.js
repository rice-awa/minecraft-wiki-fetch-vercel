/**
 * 内存缓存实现
 * 基于Map的内存缓存，支持TTL（生存时间）和LRU（最近最少使用）淘汰策略
 */

class MemoryCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000; // 最大缓存条目数
    this.defaultTTL = options.defaultTTL || 30 * 60 * 1000; // 默认TTL: 30分钟
    
    // 使用Map存储缓存数据，保持插入顺序用于LRU
    this.cache = new Map();
    
    // 存储每个键的过期时间
    this.expirationTimes = new Map();
    
    // 定期清理过期条目的定时器
    this.cleanupInterval = setInterval(() => {
      this._cleanupExpired();
    }, options.cleanupInterval || 5 * 60 * 1000); // 每5分钟清理一次
  }

  /**
   * 设置缓存项
   * @param {string} key - 缓存键
   * @param {*} value - 缓存值
   * @param {number} ttl - 生存时间（毫秒），可选
   */
  set(key, value, ttl = this.defaultTTL) {
    // 如果键已存在，先删除以更新LRU顺序
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.expirationTimes.delete(key);
    }
    
    // 如果缓存已满，删除最久未使用的项（Map中的第一个项）
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.expirationTimes.delete(firstKey);
    }
    
    // 添加新的缓存项
    this.cache.set(key, value);
    this.expirationTimes.set(key, Date.now() + ttl);
  }

  /**
   * 获取缓存项
   * @param {string} key - 缓存键
   * @returns {*} 缓存值，如果不存在或已过期则返回undefined
   */
  get(key) {
    // 检查键是否存在
    if (!this.cache.has(key)) {
      return undefined;
    }
    
    // 检查是否过期
    const expirationTime = this.expirationTimes.get(key);
    if (Date.now() > expirationTime) {
      // 已过期，删除并返回undefined
      this.cache.delete(key);
      this.expirationTimes.delete(key);
      return undefined;
    }
    
    // 更新LRU顺序：删除后重新插入到末尾
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }

  /**
   * 检查缓存项是否存在且未过期
   * @param {string} key - 缓存键
   * @returns {boolean}
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }
    
    const expirationTime = this.expirationTimes.get(key);
    if (Date.now() > expirationTime) {
      this.cache.delete(key);
      this.expirationTimes.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * 删除缓存项
   * @param {string} key - 缓存键
   * @returns {boolean} 是否成功删除
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    this.expirationTimes.delete(key);
    return deleted;
  }

  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear();
    this.expirationTimes.clear();
  }

  /**
   * 获取缓存大小
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }

  /**
   * 获取所有缓存键
   * @returns {string[]}
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * 获取缓存统计信息
   * @returns {object}
   */
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let validCount = 0;
    
    for (const [key, expirationTime] of this.expirationTimes) {
      if (now > expirationTime) {
        expiredCount++;
      } else {
        validCount++;
      }
    }
    
    return {
      totalItems: this.cache.size,
      validItems: validCount,
      expiredItems: expiredCount,
      maxSize: this.maxSize,
      utilizationRate: (validCount / this.maxSize * 100).toFixed(2) + '%'
    };
  }

  /**
   * 清理过期的缓存项
   * @private
   */
  _cleanupExpired() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, expirationTime] of this.expirationTimes) {
      if (now > expirationTime) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.expirationTimes.delete(key);
    }
    
    if (expiredKeys.length > 0) {
      console.log(`Cleaned up ${expiredKeys.length} expired cache items`);
    }
  }

  /**
   * 销毁缓存实例，清理定时器
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

module.exports = MemoryCache;