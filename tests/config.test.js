/**
 * Tests for configuration management system
 */

const config = require('../src/config');

describe('Configuration Management', () => {
  describe('Basic Configuration', () => {
    test('should have default server configuration', () => {
      expect(config.server.port).toBeDefined();
      expect(typeof config.server.port).toBe('number');
      expect(config.server.nodeEnv).toBeDefined();
    });

    test('should have wiki configuration', () => {
      expect(config.wiki.baseUrl).toBeDefined();
      expect(config.wiki.requestTimeout).toBeDefined();
      expect(config.wiki.maxRetries).toBeDefined();
      expect(config.wiki.userAgent).toBeDefined();
    });

    test('should have cache configuration', () => {
      expect(config.cache.ttl).toBeDefined();
      expect(config.cache.memoryCache.maxSize).toBeDefined();
    });

    test('should have rate limit configuration', () => {
      expect(config.rateLimit.windowMs).toBeDefined();
      expect(config.rateLimit.max).toBeDefined();
    });
  });

  describe('Configuration Getter', () => {
    test('should get nested configuration values', () => {
      expect(config.get('server.port')).toBe(config.server.port);
      expect(config.get('wiki.baseUrl')).toBe(config.wiki.baseUrl);
    });

    test('should return default value for non-existent keys', () => {
      expect(config.get('non.existent.key', 'default')).toBe('default');
      expect(config.get('non.existent.key')).toBeUndefined();
    });
  });

  describe('Environment Detection', () => {
    test('should detect environment correctly', () => {
      expect(typeof config.isDevelopment()).toBe('boolean');
      expect(typeof config.isProduction()).toBe('boolean');
      expect(typeof config.isTest()).toBe('boolean');
    });
  });

  describe('Configuration Validation', () => {
    test('should validate configuration without throwing', () => {
      expect(() => config.validateConfig()).not.toThrow();
    });
  });
});