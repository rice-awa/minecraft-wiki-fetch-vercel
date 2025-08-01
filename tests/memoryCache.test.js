const MemoryCache = require('../src/utils/memoryCache');

describe('MemoryCache', () => {
  let cache;

  beforeEach(() => {
    cache = new MemoryCache({
      maxSize: 3,
      defaultTTL: 1000, // 1秒用于测试
      cleanupInterval: 100 // 100ms清理间隔用于测试
    });
  });

  afterEach(() => {
    if (cache) {
      cache.destroy();
    }
  });

  describe('基本缓存操作', () => {
    test('应该能够设置和获取缓存项', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    test('应该能够检查缓存项是否存在', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    test('应该能够删除缓存项', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      
      const deleted = cache.delete('key1');
      expect(deleted).toBe(true);
      expect(cache.has('key1')).toBe(false);
    });

    test('应该能够清空所有缓存', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
      
      cache.clear();
      expect(cache.size()).toBe(0);
    });

    test('应该能够获取缓存大小', () => {
      expect(cache.size()).toBe(0);
      
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });

    test('应该能够获取所有缓存键', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const keys = cache.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys.length).toBe(2);
    });
  });

  describe('TTL（生存时间）功能', () => {
    test('应该在TTL过期后自动删除缓存项', async () => {
      cache.set('key1', 'value1', 100); // 100ms TTL
      expect(cache.get('key1')).toBe('value1');
      
      // 等待TTL过期
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.has('key1')).toBe(false);
    });

    test('应该使用默认TTL当未指定时', async () => {
      cache.set('key1', 'value1'); // 使用默认TTL (1000ms)
      expect(cache.get('key1')).toBe('value1');
      
      // 在默认TTL内应该仍然存在
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(cache.get('key1')).toBe('value1');
    });

    test('应该能够为不同的键设置不同的TTL', async () => {
      cache.set('shortTTL', 'value1', 100); // 100ms
      cache.set('longTTL', 'value2', 500);  // 500ms
      
      // 等待短TTL过期
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get('shortTTL')).toBeUndefined();
      expect(cache.get('longTTL')).toBe('value2');
    });
  });

  describe('LRU（最近最少使用）淘汰策略', () => {
    test('应该在达到最大容量时删除最久未使用的项', () => {
      // 缓存最大容量为3
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      expect(cache.size()).toBe(3);
      
      // 添加第4个项，应该删除key1（最久未使用）
      cache.set('key4', 'value4');
      expect(cache.size()).toBe(3);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    test('访问缓存项应该更新其LRU位置', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // 访问key1，使其成为最近使用的
      cache.get('key1');
      
      // 添加新项，应该删除key2（现在是最久未使用的）
      cache.set('key4', 'value4');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    test('更新现有键应该更新其LRU位置', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // 更新key1，使其成为最近使用的
      cache.set('key1', 'newValue1');
      
      // 添加新项，应该删除key2（现在是最久未使用的）
      cache.set('key4', 'value4');
      expect(cache.get('key1')).toBe('newValue1');
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });
  });

  describe('缓存统计信息', () => {
    test('应该返回正确的统计信息', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      const stats = cache.getStats();
      expect(stats.totalItems).toBe(2);
      expect(stats.maxSize).toBe(3);
      expect(stats.utilizationRate).toBe('66.67%');
    });

    test('应该正确计算过期项数量', async () => {
      // 创建一个没有自动清理的缓存实例来测试过期项统计
      const testCache = new MemoryCache({
        maxSize: 10,
        defaultTTL: 1000,
        cleanupInterval: 999999 // 设置很长的清理间隔，避免自动清理
      });
      
      testCache.set('key1', 'value1', 100); // 100ms TTL
      testCache.set('key2', 'value2', 1000); // 1000ms TTL
      
      // 等待第一个项过期
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const stats = testCache.getStats();
      expect(stats.expiredItems).toBe(1);
      expect(stats.validItems).toBe(1);
      
      testCache.destroy();
    });
  });

  describe('自动清理功能', () => {
    test('应该定期清理过期的缓存项', async () => {
      cache.set('key1', 'value1', 50);  // 50ms TTL
      cache.set('key2', 'value2', 200); // 200ms TTL
      
      expect(cache.size()).toBe(2);
      
      // 等待清理间隔和第一个项过期
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // 第一个项应该被自动清理
      expect(cache.size()).toBe(1);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
    });
  });

  describe('边界情况', () => {
    test('获取不存在的键应该返回undefined', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    test('删除不存在的键应该返回false', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });

    test('应该能够存储各种类型的值', () => {
      const testValues = [
        'string',
        123,
        { key: 'value' },
        [1, 2, 3],
        null,
        undefined,
        true,
        false
      ];
      
      testValues.forEach((value, index) => {
        const key = `key${index}`;
        cache.set(key, value);
        expect(cache.get(key)).toEqual(value);
      });
    });

    test('应该能够处理空字符串键', () => {
      cache.set('', 'empty key value');
      expect(cache.get('')).toBe('empty key value');
    });
  });

  describe('销毁功能', () => {
    test('销毁后应该清理所有资源', () => {
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      
      cache.destroy();
      expect(cache.size()).toBe(0);
      expect(cache.cleanupInterval).toBeNull();
    });
  });
});