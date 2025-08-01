/**
 * PageUrlHandler Tests
 * 测试页面URL处理器的各种功能
 */

const PageUrlHandler = require('../src/services/pageUrlHandler');

describe('PageUrlHandler', () => {
    let handler;

    beforeEach(() => {
        handler = new PageUrlHandler();
    });

    describe('constructor', () => {
        test('should use default base URL', () => {
            expect(handler.baseUrl).toBe('https://zh.minecraft.wiki');
            expect(handler.wikiPath).toBe('/w');
        });

        test('should accept custom base URL', () => {
            const customHandler = new PageUrlHandler('https://custom.wiki.com/');
            expect(customHandler.baseUrl).toBe('https://custom.wiki.com');
        });

        test('should have namespace mappings', () => {
            const namespaces = handler.getNamespaces();
            expect(namespaces[0]).toBe('');
            expect(namespaces[1]).toBe('讨论');
            expect(namespaces[10]).toBe('模板');
            expect(namespaces[14]).toBe('分类');
        });
    });

    describe('buildPageUrl', () => {
        test('should build basic page URL', () => {
            const url = handler.buildPageUrl('钻石');
            expect(url).toBe('https://zh.minecraft.wiki/w/%E9%92%BB%E7%9F%B3');
        });

        test('should build page URL with English name', () => {
            const url = handler.buildPageUrl('Diamond');
            expect(url).toBe('https://zh.minecraft.wiki/w/Diamond');
        });

        test('should build page URL with namespace', () => {
            const url = handler.buildPageUrl('模板:Infobox');
            expect(url).toBe('https://zh.minecraft.wiki/w/%E6%A8%A1%E6%9D%BF%3AInfobox');
        });

        test('should handle spaces in page names', () => {
            const url = handler.buildPageUrl('钻石 剑');
            expect(url).toBe('https://zh.minecraft.wiki/w/%E9%92%BB%E7%9F%B3_%E5%89%91');
        });

        test('should handle special characters', () => {
            const url = handler.buildPageUrl('Java版1.19');
            expect(url).toBe('https://zh.minecraft.wiki/w/Java%E7%89%881.19');
        });

        test('should add action parameter', () => {
            const url = handler.buildPageUrl('钻石', { action: 'edit' });
            expect(url).toBe('https://zh.minecraft.wiki/w/%E9%92%BB%E7%9F%B3?action=edit');
        });

        test('should add section parameter', () => {
            const url = handler.buildPageUrl('钻石', { section: 2 });
            expect(url).toBe('https://zh.minecraft.wiki/w/%E9%92%BB%E7%9F%B3?section=2');
        });

        test('should add multiple query parameters', () => {
            const url = handler.buildPageUrl('钻石', {
                action: 'edit',
                section: 1,
                query: { oldid: '12345', diff: 'prev' }
            });
            expect(url).toContain('action=edit');
            expect(url).toContain('section=1');
            expect(url).toContain('oldid=12345');
            expect(url).toContain('diff=prev');
        });

        test('should throw error for invalid page name', () => {
            expect(() => handler.buildPageUrl('')).toThrow('页面名称必须是非空字符串');
            expect(() => handler.buildPageUrl(null)).toThrow('页面名称必须是非空字符串');
            expect(() => handler.buildPageUrl(123)).toThrow('页面名称必须是非空字符串');
        });
    });

    describe('buildApiUrl', () => {
        test('should build basic API URL', () => {
            const url = handler.buildApiUrl('钻石');
            expect(url).toContain('https://zh.minecraft.wiki/api.php');
            expect(url).toContain('action=query');
            expect(url).toContain('format=json');
            expect(url).toContain('titles=%E9%92%BB%E7%9F%B3');
        });

        test('should accept custom API parameters', () => {
            const url = handler.buildApiUrl('钻石', {
                format: 'xml',
                action: 'parse',
                params: { prop: 'text', section: '0' }
            });
            expect(url).toContain('format=xml');
            expect(url).toContain('action=parse');
            expect(url).toContain('prop=text');
            expect(url).toContain('section=0');
        });
    });

    describe('extractPageInfo', () => {
        test('should extract page info from basic URL', () => {
            const url = 'https://zh.minecraft.wiki/w/%E9%92%BB%E7%9F%B3';
            const info = handler.extractPageInfo(url);
            
            expect(info.pageName).toBe('钻石');
            expect(info.namespace).toBe('');
            expect(info.namespaceId).toBe(0);
            expect(info.action).toBe('view');
            expect(info.isSpecialPage).toBe(false);
        });

        test('should extract page info with namespace', () => {
            const url = 'https://zh.minecraft.wiki/w/%E6%A8%A1%E6%9D%BF:Infobox';
            const info = handler.extractPageInfo(url);
            
            expect(info.pageName).toBe('Infobox');
            expect(info.namespace).toBe('模板');
            expect(info.namespaceId).toBe(10);
        });

        test('should extract page info with query parameters', () => {
            const url = 'https://zh.minecraft.wiki/w/%E9%92%BB%E7%9F%B3?action=edit&section=1';
            const info = handler.extractPageInfo(url);
            
            expect(info.pageName).toBe('钻石');
            expect(info.action).toBe('edit');
            expect(info.section).toBe('1');
        });

        test('should handle special pages', () => {
            const url = 'https://zh.minecraft.wiki/w/Special:Search?search=钻石';
            const info = handler.extractPageInfo(url);
            
            expect(info.pageName).toBe('Special:Search');
            expect(info.isSpecialPage).toBe(true);
            expect(info.query.search).toBe('钻石');
        });

        test('should throw error for invalid URL', () => {
            expect(() => handler.extractPageInfo('invalid-url')).toThrow();
            expect(() => handler.extractPageInfo('https://other-site.com/page')).toThrow('不是有效的Wiki URL');
        });
    });

    describe('isWikiUrl', () => {
        test('should return true for valid wiki URLs', () => {
            expect(handler.isWikiUrl('https://zh.minecraft.wiki/w/钻石')).toBe(true);
            expect(handler.isWikiUrl('https://zh.minecraft.wiki/api.php')).toBe(true);
        });

        test('should return false for non-wiki URLs', () => {
            expect(handler.isWikiUrl('https://google.com')).toBe(false);
            expect(handler.isWikiUrl('https://other-wiki.com/w/page')).toBe(false);
            expect(handler.isWikiUrl('invalid-url')).toBe(false);
        });
    });

    describe('normalizePageName', () => {
        test('should capitalize first letter', () => {
            expect(handler.normalizePageName('diamond')).toBe('Diamond');
            expect(handler.normalizePageName('钻石')).toBe('钻石');
        });

        test('should replace underscores with spaces', () => {
            expect(handler.normalizePageName('diamond_sword')).toBe('Diamond sword');
            expect(handler.normalizePageName('钻石_剑')).toBe('钻石 剑');
        });

        test('should handle multiple spaces', () => {
            expect(handler.normalizePageName('diamond   sword')).toBe('Diamond sword');
            expect(handler.normalizePageName('  钻石  剑  ')).toBe('钻石 剑');
        });

        test('should handle namespaces correctly', () => {
            expect(handler.normalizePageName('template:infobox')).toBe('Template:Infobox');
            expect(handler.normalizePageName('模板:信息框')).toBe('模板:信息框');
        });

        test('should handle empty input', () => {
            expect(handler.normalizePageName('')).toBe('');
            expect(handler.normalizePageName('   ')).toBe('');
        });
    });

    describe('namespace methods', () => {
        test('should get namespace ID by name', () => {
            expect(handler.getNamespaceId('模板')).toBe(10);
            expect(handler.getNamespaceId('分类')).toBe(14);
            expect(handler.getNamespaceId('不存在的命名空间')).toBeNull();
        });

        test('should get namespace name by ID', () => {
            expect(handler.getNamespaceName(10)).toBe('模板');
            expect(handler.getNamespaceName(14)).toBe('分类');
            expect(handler.getNamespaceName(0)).toBe('');
            expect(handler.getNamespaceName(999)).toBe('');
        });

        test('should return all namespaces', () => {
            const namespaces = handler.getNamespaces();
            expect(typeof namespaces).toBe('object');
            expect(namespaces[10]).toBe('模板');
            expect(namespaces[14]).toBe('分类');
        });
    });

    describe('validatePageName', () => {
        test('should validate correct page names', () => {
            const result1 = handler.validatePageName('钻石');
            expect(result1.isValid).toBe(true);
            expect(result1.errors).toHaveLength(0);

            const result2 = handler.validatePageName('Diamond Sword');
            expect(result2.isValid).toBe(true);
            expect(result2.errors).toHaveLength(0);

            const result3 = handler.validatePageName('模板:Infobox');
            expect(result3.isValid).toBe(true);
            expect(result3.errors).toHaveLength(0);
        });

        test('should reject invalid page names', () => {
            const result1 = handler.validatePageName('');
            expect(result1.isValid).toBe(false);
            expect(result1.errors).toContain('页面名称必须是非空字符串');

            const result2 = handler.validatePageName(null);
            expect(result2.isValid).toBe(false);
            expect(result2.errors).toContain('页面名称必须是非空字符串');

            const result3 = handler.validatePageName('页面<标题>');
            expect(result3.isValid).toBe(false);
            expect(result3.errors).toContain('页面名称包含非法字符: < > " | { } [ ]');

            const result4 = handler.validatePageName('   ');
            expect(result4.isValid).toBe(false);
            expect(result4.errors).toContain('页面名称不能为空或只包含空格');
        });

        test('should provide warnings for questionable page names', () => {
            const result1 = handler.validatePageName('.hidden');
            expect(result1.isValid).toBe(true);
            expect(result1.warnings).toContain('页面名称以点号开头可能导致访问问题');

            const result2 = handler.validatePageName('namespace::page');
            expect(result2.isValid).toBe(true);
            expect(result2.warnings).toContain('页面名称包含连续的冒号');
        });

        test('should reject very long page names', () => {
            const longName = 'a'.repeat(256);
            const result = handler.validatePageName(longName);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('页面名称长度不能超过255个字符');
        });
    });

    describe('updateConfig', () => {
        test('should update base URL', () => {
            handler.updateConfig({ baseUrl: 'https://new.wiki.com/' });
            expect(handler.baseUrl).toBe('https://new.wiki.com');
        });

        test('should update wiki path', () => {
            handler.updateConfig({ wikiPath: '/wiki' });
            expect(handler.wikiPath).toBe('/wiki');
        });

        test('should update namespace mappings', () => {
            const customNamespaces = { 0: '', 100: '自定义' };
            handler.updateConfig({ namespaceMap: customNamespaces });
            
            expect(handler.getNamespaceName(100)).toBe('自定义');
            expect(handler.getNamespaceId('自定义')).toBe(100);
        });
    });

    describe('edge cases and integration', () => {
        test('should handle complex page names', () => {
            const complexName = '基岩版/开发版本/1.19.0';
            const url = handler.buildPageUrl(complexName);
            const info = handler.extractPageInfo(url);
            
            expect(info.pageName).toBe(complexName);
            expect(info.namespace).toBe('');
            expect(info.namespaceId).toBe(0);
        });

        test('should handle Unicode characters correctly', () => {
            const unicodeName = '🎮游戏';
            const url = handler.buildPageUrl(unicodeName);
            const info = handler.extractPageInfo(url);
            
            expect(info.pageName).toBe(unicodeName);
        });

        test('should handle mixed language namespaces', () => {
            const mixedName = 'Template:中文模板';
            const url = handler.buildPageUrl(mixedName);
            const info = handler.extractPageInfo(url);
            
            expect(info.pageName).toBe('中文模板');
            expect(info.namespace).toBe('Template');
        });

        test('should preserve case in titles except first letter', () => {
            const caseName = 'iPhone 设备';
            const normalized = handler.normalizePageName(caseName);
            expect(normalized).toBe('IPhone 设备');
        });
    });
});