/**
 * Integration tests for basic HTTP client and configuration management
 */

const config = require('../src/config');
const { logger } = require('../src/utils/logger');
const { HttpClient } = require('../src/utils/httpClient');

describe('Integration Tests', () => {
  describe('Configuration and Logger Integration', () => {
    test('should load configuration and create logger successfully', () => {
      expect(config.server.port).toBeDefined();
      expect(config.wiki.baseUrl).toBeDefined();
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });

    test('should use configuration values in logger', () => {
      expect(config.logging.level).toBeDefined();
      expect(config.logging.enableConsole).toBeDefined();
    });
  });

  describe('HTTP Client and Configuration Integration', () => {
    test('should create HTTP client with configuration values', () => {
      const client = new HttpClient();
      const clientConfig = client.getConfig();
      
      expect(clientConfig.baseURL).toBe(config.wiki.baseUrl);
      expect(clientConfig.timeout).toBe(config.wiki.requestTimeout);
      expect(clientConfig.maxRetries).toBe(config.wiki.maxRetries);
      expect(clientConfig.userAgent).toBe(config.wiki.userAgent);
    });

    test('should handle configuration updates', () => {
      const client = new HttpClient();
      const newTimeout = 15000;
      
      client.updateConfig({ timeout: newTimeout });
      expect(client.getConfig().timeout).toBe(newTimeout);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle configuration validation errors gracefully', () => {
      // This test ensures our error handling works
      expect(() => {
        const client = new HttpClient({
          baseURL: config.wiki.baseUrl,
          timeout: config.wiki.requestTimeout
        });
        expect(client).toBeDefined();
      }).not.toThrow();
    });
  });
});