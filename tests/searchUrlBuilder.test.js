const SearchUrlBuilder = require('../src/services/searchUrlBuilder');

describe('SearchUrlBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new SearchUrlBuilder();
  });

  describe('constructor', () => {
    it('should use default base URL', () => {
      expect(builder.baseUrl).toBe('https://zh.minecraft.wiki');
    });

    it('should accept custom base URL', () => {
      const customBuilder = new SearchUrlBuilder('https://custom.wiki');
      expect(customBuilder.baseUrl).toBe('https://custom.wiki');
    });
  });

  describe('buildSearchUrl', () => {
    it('should build basic search URL with English keyword', () => {
      const url = builder.buildSearchUrl('diamond');
      expect(url).toBe('https://zh.minecraft.wiki/w/Special:Search?search=diamond&limit=20&ns=0&profile=default');
    });

    it('should build search URL with Chinese keyword', () => {
      const url = builder.buildSearchUrl('钻石');
      expect(url).toContain('search=%E9%92%BB%E7%9F%B3'); // URL encoded Chinese
    });

    it('should handle keywords with spaces', () => {
      const url = builder.buildSearchUrl('钻石 矿石');
      expect(url).toContain('search=%E9%92%BB%E7%9F%B3+%E7%9F%BF%E7%9F%B3');
    });

    it('should handle keywords with special characters', () => {
      const url = builder.buildSearchUrl('钻石&剑');
      expect(url).toContain('search=%E9%92%BB%E7%9F%B3%26%E5%89%91');
    });

    it('should trim whitespace from keywords', () => {
      const url = builder.buildSearchUrl('  钻石  ');
      expect(url).toContain('search=%E9%92%BB%E7%9F%B3');
    });

    it('should use custom limit', () => {
      const url = builder.buildSearchUrl('钻石', { limit: 50 });
      expect(url).toContain('limit=50');
    });

    it('should use custom namespace', () => {
      const url = builder.buildSearchUrl('钻石', { namespace: '6' });
      expect(url).toContain('ns=6');
    });

    it('should use custom profile', () => {
      const url = builder.buildSearchUrl('钻石', { profile: 'advanced' });
      expect(url).toContain('profile=advanced');
    });

    it('should combine all custom options', () => {
      const url = builder.buildSearchUrl('钻石', {
        limit: 30,
        namespace: '6',
        profile: 'advanced'
      });
      expect(url).toContain('limit=30');
      expect(url).toContain('ns=6');
      expect(url).toContain('profile=advanced');
    });

    it('should throw error for empty keyword', () => {
      expect(() => builder.buildSearchUrl('')).toThrow('Keyword must be a non-empty string');
    });

    it('should throw error for null keyword', () => {
      expect(() => builder.buildSearchUrl(null)).toThrow('Keyword must be a non-empty string');
    });

    it('should throw error for non-string keyword', () => {
      expect(() => builder.buildSearchUrl(123)).toThrow('Keyword must be a non-empty string');
    });

    it('should throw error for invalid limit (too low)', () => {
      expect(() => builder.buildSearchUrl('钻石', { limit: 0 })).toThrow('Limit must be between 1 and 500');
    });

    it('should throw error for invalid limit (too high)', () => {
      expect(() => builder.buildSearchUrl('钻石', { limit: 501 })).toThrow('Limit must be between 1 and 500');
    });
  });

  describe('buildNamespaceSearchUrl', () => {
    it('should build URL with single namespace', () => {
      const url = builder.buildNamespaceSearchUrl('钻石', ['6']);
      expect(url).toContain('ns=6');
    });

    it('should build URL with multiple namespaces', () => {
      const url = builder.buildNamespaceSearchUrl('钻石', ['0', '6', '10']);
      expect(url).toContain('ns=0');
      expect(url).toContain('ns=6');
      expect(url).toContain('ns=10');
    });

    it('should use default namespace when not provided', () => {
      const url = builder.buildNamespaceSearchUrl('钻石');
      expect(url).toContain('ns=0');
    });

    it('should throw error for empty namespaces array', () => {
      expect(() => builder.buildNamespaceSearchUrl('钻石', [])).toThrow('Namespaces must be a non-empty array');
    });

    it('should throw error for non-array namespaces', () => {
      expect(() => builder.buildNamespaceSearchUrl('钻石', '0')).toThrow('Namespaces must be a non-empty array');
    });
  });

  describe('getNamespaces', () => {
    it('should return namespace mappings', () => {
      const namespaces = builder.getNamespaces();
      expect(namespaces).toHaveProperty('0', 'Main');
      expect(namespaces).toHaveProperty('6', 'File');
      expect(namespaces).toHaveProperty('10', 'Template');
      expect(namespaces).toHaveProperty('14', 'Category');
    });

    it('should return object with string keys', () => {
      const namespaces = builder.getNamespaces();
      Object.keys(namespaces).forEach(key => {
        expect(typeof key).toBe('string');
      });
    });
  });

  describe('normalizeKeyword', () => {
    it('should trim whitespace', () => {
      expect(builder.normalizeKeyword('  钻石  ')).toBe('钻石');
    });

    it('should replace multiple spaces with single space', () => {
      expect(builder.normalizeKeyword('钻石   矿石')).toBe('钻石 矿石');
    });

    it('should handle mixed whitespace characters', () => {
      expect(builder.normalizeKeyword('钻石\t\n矿石')).toBe('钻石 矿石');
    });

    it('should throw error for empty string', () => {
      expect(() => builder.normalizeKeyword('')).toThrow('Keyword must be a non-empty string');
    });

    it('should throw error for null', () => {
      expect(() => builder.normalizeKeyword(null)).toThrow('Keyword must be a non-empty string');
    });

    it('should throw error for non-string', () => {
      expect(() => builder.normalizeKeyword(123)).toThrow('Keyword must be a non-empty string');
    });
  });

  describe('URL encoding verification', () => {
    it('should properly encode common Chinese characters', () => {
      const testCases = [
        { input: '钻石', expected: '%E9%92%BB%E7%9F%B3' },
        { input: '红石', expected: '%E7%BA%A2%E7%9F%B3' },
        { input: '末影龙', expected: '%E6%9C%AB%E5%BD%B1%E9%BE%99' }
      ];

      testCases.forEach(({ input, expected }) => {
        const url = builder.buildSearchUrl(input);
        expect(url).toContain(`search=${expected}`);
      });
    });

    it('should handle mixed Chinese and English', () => {
      const url = builder.buildSearchUrl('钻石sword');
      expect(url).toContain('%E9%92%BB%E7%9F%B3sword');
    });

    it('should handle Chinese with numbers', () => {
      const url = builder.buildSearchUrl('钻石x64');
      expect(url).toContain('%E9%92%BB%E7%9F%B3x64');
    });
  });

  describe('edge cases', () => {
    it('should handle very long keywords', () => {
      const longKeyword = '钻石'.repeat(100);
      const url = builder.buildSearchUrl(longKeyword);
      expect(url).toContain('search=');
      expect(url.length).toBeGreaterThan(100);
    });

    it('should handle keywords with only whitespace', () => {
      expect(() => builder.buildSearchUrl('   ')).toThrow('Keyword must be a non-empty string');
    });

    it('should handle limit boundary values', () => {
      expect(() => builder.buildSearchUrl('钻石', { limit: 1 })).not.toThrow();
      expect(() => builder.buildSearchUrl('钻石', { limit: 500 })).not.toThrow();
    });
  });
});