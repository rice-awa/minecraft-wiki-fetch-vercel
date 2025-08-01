/**
 * 内存缓存使用示例
 */

const MemoryCache = require('../src/utils/memoryCache');

async function demonstrateMemoryCache() {
  console.log('=== 内存缓存演示 ===\n');

  // 创建缓存实例
  const cache = new MemoryCache({
    maxSize: 5,           // 最大5个条目
    defaultTTL: 5000,     // 默认5秒TTL
    cleanupInterval: 2000 // 每2秒清理一次
  });

  console.log('1. 基本缓存操作');
  console.log('设置缓存项...');
  cache.set('user:123', { name: '史蒂夫', level: 10 });
  cache.set('item:diamond', { name: '钻石', rarity: 'rare' });
  cache.set('search:钻石', ['钻石', '钻石剑', '钻石镐']);

  console.log('获取缓存项:');
  console.log('user:123 =>', cache.get('user:123'));
  console.log('item:diamond =>', cache.get('item:diamond'));
  console.log('search:钻石 =>', cache.get('search:钻石'));
  console.log();

  console.log('2. TTL功能演示');
  console.log('设置短TTL的缓存项...');
  cache.set('temp:data', '临时数据', 1000); // 1秒TTL
  console.log('立即获取:', cache.get('temp:data'));
  
  console.log('等待1.5秒后再次获取...');
  await new Promise(resolve => setTimeout(resolve, 1500));
  console.log('1.5秒后获取:', cache.get('temp:data')); // 应该是undefined
  console.log();

  console.log('3. LRU淘汰策略演示');
  console.log('当前缓存大小:', cache.size());
  console.log('添加更多项直到超过最大容量...');
  
  cache.set('item1', 'value1');
  cache.set('item2', 'value2');
  cache.set('item3', 'value3'); // 这会触发LRU淘汰
  
  console.log('缓存大小:', cache.size());
  console.log('检查最早的项是否被淘汰:');
  console.log('user:123 存在?', cache.has('user:123')); // 可能被淘汰
  console.log('item3 存在?', cache.has('item3')); // 应该存在
  console.log();

  console.log('4. 缓存统计信息');
  const stats = cache.getStats();
  console.log('统计信息:', stats);
  console.log();

  console.log('5. 访问更新LRU顺序');
  console.log('访问一个旧项目...');
  if (cache.has('item:diamond')) {
    cache.get('item:diamond'); // 更新LRU位置
    console.log('访问了 item:diamond');
  }
  
  console.log('添加新项...');
  cache.set('newItem', 'new value');
  console.log('当前所有键:', cache.keys());
  console.log();

  console.log('6. 自动清理演示');
  console.log('设置一些短TTL的项...');
  cache.set('short1', 'value1', 500);
  cache.set('short2', 'value2', 1000);
  cache.set('long1', 'value3', 10000);
  
  console.log('等待自动清理...');
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  console.log('清理后的统计:', cache.getStats());
  console.log('剩余的键:', cache.keys());
  console.log();

  console.log('7. 清理资源');
  cache.destroy();
  console.log('缓存已销毁');
  
  console.log('\n=== 演示完成 ===');
}

// 运行演示
if (require.main === module) {
  demonstrateMemoryCache().catch(console.error);
}

module.exports = { demonstrateMemoryCache };