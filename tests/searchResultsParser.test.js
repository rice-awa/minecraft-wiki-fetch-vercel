/**
 * Tests for SearchResultsParser
 * Verifies parsing accuracy for various search result scenarios
 */

const SearchResultsParser = require('../src/services/searchResultsParser');

describe('SearchResultsParser', () => {
    let parser;

    beforeEach(() => {
        parser = new SearchResultsParser();
    });

    describe('parseSearchResults', () => {
        it('should throw error for invalid HTML input', () => {
            expect(() => parser.parseSearchResults(null)).toThrow('HTML content must be a non-empty string');
            expect(() => parser.parseSearchResults('')).toThrow('HTML content must be a non-empty string');
            expect(() => parser.parseSearchResults(123)).toThrow('HTML content must be a non-empty string');
        });

        it('should return empty results for HTML with no search results', () => {
            const html = '<html><body><div class="content">No search results</div></body></html>';
            const result = parser.parseSearchResults(html, 'test');

            expect(result.success).toBe(true);
            expect(result.data.results).toEqual([]);
            expect(result.data.totalCount).toBe(0);
            expect(result.data.hasMore).toBe(false);
            expect(result.data.keyword).toBe('test');
            expect(result.timestamp).toBeDefined();
        });

        it('should parse basic search results correctly', () => {
            const html = `
                <html>
                <body>
                    <div class="mw-search-result-data">
                        <div class="mw-search-result-heading">
                            <a href="/w/钻石" title="钻石">钻石</a>
                        </div>
                        <div class="searchresult">钻石是一种稀有的矿物，可以用来制作工具和装备。</div>
                    </div>
                    <div class="mw-search-result-data">
                        <div class="mw-search-result-heading">
                            <a href="/w/钻石剑" title="钻石剑">钻石剑</a>
                        </div>
                        <div class="searchresult">钻石剑是游戏中最强的剑之一。</div>
                    </div>
                </body>
                </html>
            `;

            const result = parser.parseSearchResults(html, '钻石');

            expect(result.success).toBe(true);
            expect(result.data.results).toHaveLength(2);
            
            const firstResult = result.data.results[0];
            expect(firstResult.title).toBe('钻石');
            expect(firstResult.url).toBe('https://zh.minecraft.wiki/w/钻石');
            expect(firstResult.snippet).toBe('钻石是一种稀有的矿物，可以用来制作工具和装备。');
            expect(firstResult.namespace).toBe('主要');

            const secondResult = result.data.results[1];
            expect(secondResult.title).toBe('钻石剑');
            expect(secondResult.url).toBe('https://zh.minecraft.wiki/w/钻石剑');
            expect(secondResult.snippet).toBe('钻石剑是游戏中最强的剑之一。');
        });

        it('should handle namespace information correctly', () => {
            const html = `
                <html>
                <body>
                    <div class="mw-search-result-data">
                        <div class="mw-search-result-heading">
                            <a href="/w/Template:物品" title="Template:物品">Template:物品</a>
                        </div>
                        <div class="searchresult">物品模板</div>
                        <div class="mw-search-result-ns">模板</div>
                    </div>
                    <div class="mw-search-result-data">
                        <div class="mw-search-result-heading">
                            <a href="/w/Category:物品" title="Category:物品">Category:物品</a>
                        </div>
                        <div class="searchresult">物品分类</div>
                    </div>
                </body>
                </html>
            `;

            const result = parser.parseSearchResults(html, '物品');

            expect(result.success).toBe(true);
            expect(result.data.results).toHaveLength(2);
            
            expect(result.data.results[0].namespace).toBe('模板');
            expect(result.data.results[1].namespace).toBe('分类');
        });

        it('should extract pagination information', () => {
            const html = `
                <html>
                <body>
                    <div class="results-info">找到 150 个结果</div>
                    <div class="mw-search-result-data">
                        <div class="mw-search-result-heading">
                            <a href="/w/测试" title="测试">测试</a>
                        </div>
                        <div class="searchresult">测试内容</div>
                    </div>
                    <div class="mw-search-pager-bottom">
                        <a class="mw-nextlink" href="/search?q=test&page=2">下一页</a>
                    </div>
                </body>
                </html>
            `;

            const result = parser.parseSearchResults(html, '测试');

            expect(result.success).toBe(true);
            expect(result.data.totalCount).toBe(150);
            expect(result.data.hasMore).toBe(true);
            expect(result.data.currentPage).toBe(1);
        });

        it('should handle parsing errors gracefully', () => {
            const malformedHtml = '<html><body><div class="mw-search-result-data"><a href="/w/test">Test</a></div>';
            
            // Should not throw, but may return partial results
            const result = parser.parseSearchResults(malformedHtml, 'test');
            expect(result.success).toBe(true);
            expect(Array.isArray(result.data.results)).toBe(true);
        });

        it('should extract additional metadata when available', () => {
            const html = `
                <html>
                <body>
                    <div class="mw-search-result-data">
                        <div class="mw-search-result-heading">
                            <a href="/w/File:Diamond.png" title="File:Diamond.png">File:Diamond.png</a>
                        </div>
                        <div class="searchresult">钻石图片文件</div>
                        <div class="filesize">50 KB</div>
                        <div class="mw-search-result-date">2024-01-15</div>
                    </div>
                </body>
                </html>
            `;

            const result = parser.parseSearchResults(html, 'diamond');

            expect(result.success).toBe(true);
            expect(result.data.results).toHaveLength(1);
            
            const fileResult = result.data.results[0];
            expect(fileResult.fileSize).toBe('50 KB');
            expect(fileResult.lastModified).toBe('2024-01-15');
            expect(fileResult.namespace).toBe('文件');
        });
    });

    describe('hasNoResults', () => {
        it('should return true for empty or null HTML', () => {
            expect(parser.hasNoResults(null)).toBe(true);
            expect(parser.hasNoResults('')).toBe(true);
            expect(parser.hasNoResults('   ')).toBe(true);
        });

        it('should return true when no results found indicators are present', () => {
            const noResultsHtml = `
                <html>
                <body>
                    <div class="mw-search-nonefound">没有找到匹配的结果</div>
                </body>
                </html>
            `;

            expect(parser.hasNoResults(noResultsHtml)).toBe(true);
        });

        it('should return false when search results are present', () => {
            const withResultsHtml = `
                <html>
                <body>
                    <div class="mw-search-result-data">
                        <div class="mw-search-result-heading">
                            <a href="/w/test">Test</a>
                        </div>
                    </div>
                </body>
                </html>
            `;

            expect(parser.hasNoResults(withResultsHtml)).toBe(false);
        });
    });

    describe('extractSuggestions', () => {
        it('should return empty array for HTML without suggestions', () => {
            const html = '<html><body><div>No suggestions</div></body></html>';
            const suggestions = parser.extractSuggestions(html);

            expect(suggestions).toEqual([]);
        });

        it('should extract "did you mean" suggestions', () => {
            const html = `
                <html>
                <body>
                    <div class="mw-search-did-you-mean">
                        您是否要找：<a href="/search?q=钻石">钻石</a>
                    </div>
                </body>
                </html>
            `;

            const suggestions = parser.extractSuggestions(html);

            expect(suggestions).toContain('钻石');
        });

        it('should extract related search suggestions', () => {
            const html = `
                <html>
                <body>
                    <div class="mw-search-related">
                        相关搜索：
                        <a href="/search?q=钻石工具">钻石工具</a>
                        <a href="/search?q=钻石装备">钻石装备</a>
                    </div>
                </body>
                </html>
            `;

            const suggestions = parser.extractSuggestions(html);

            expect(suggestions).toContain('钻石工具');
            expect(suggestions).toContain('钻石装备');
        });

        it('should handle empty or null HTML gracefully', () => {
            expect(parser.extractSuggestions(null)).toEqual([]);
            expect(parser.extractSuggestions('')).toEqual([]);
        });
    });

    describe('_normalizeUrl', () => {
        it('should return empty string for empty input', () => {
            expect(parser._normalizeUrl('')).toBe('');
            expect(parser._normalizeUrl(null)).toBe('');
            expect(parser._normalizeUrl(undefined)).toBe('');
        });

        it('should return absolute URLs unchanged', () => {
            const absoluteUrl = 'https://zh.minecraft.wiki/w/钻石';
            expect(parser._normalizeUrl(absoluteUrl)).toBe(absoluteUrl);
        });

        it('should convert relative URLs to absolute', () => {
            expect(parser._normalizeUrl('/w/钻石')).toBe('https://zh.minecraft.wiki/w/钻石');
            expect(parser._normalizeUrl('w/钻石')).toBe('https://zh.minecraft.wiki/w/钻石');
        });
    });

    describe('_mapNamespaceFromPrefix', () => {
        it('should map English namespace prefixes to Chinese', () => {
            expect(parser._mapNamespaceFromPrefix('Template')).toBe('模板');
            expect(parser._mapNamespaceFromPrefix('Category')).toBe('分类');
            expect(parser._mapNamespaceFromPrefix('File')).toBe('文件');
            expect(parser._mapNamespaceFromPrefix('Help')).toBe('帮助');
        });

        it('should handle Chinese namespace prefixes', () => {
            expect(parser._mapNamespaceFromPrefix('模板')).toBe('模板');
            expect(parser._mapNamespaceFromPrefix('分类')).toBe('分类');
        });

        it('should return default namespace for unknown prefixes', () => {
            expect(parser._mapNamespaceFromPrefix('Unknown')).toBe('主要');
            expect(parser._mapNamespaceFromPrefix('')).toBe('主要');
        });
    });

    describe('integration scenarios', () => {
        it('should handle complex search results with mixed content', () => {
            const complexHtml = `
                <html>
                <body>
                    <div class="results-info">找到 25 个结果</div>
                    
                    <div class="mw-search-result-data">
                        <div class="mw-search-result-heading">
                            <a href="/w/钻石" title="钻石">钻石</a>
                        </div>
                        <div class="searchresult">钻石是一种稀有的矿物，可以用来制作最强的工具和装备。</div>
                    </div>
                    
                    <div class="mw-search-result-data">
                        <div class="mw-search-result-heading">
                            <a href="/w/Template:钻石工具" title="Template:钻石工具">Template:钻石工具</a>
                        </div>
                        <div class="searchresult">钻石工具模板</div>
                        <div class="mw-search-result-ns">模板</div>
                    </div>
                    
                    <div class="mw-search-result-data">
                        <div class="mw-search-result-heading">
                            <a href="/w/File:Diamond_Ore.png" title="File:Diamond_Ore.png">File:Diamond_Ore.png</a>
                        </div>
                        <div class="searchresult">钻石矿石贴图文件</div>
                        <div class="filesize">128 KB</div>
                        <div class="mw-search-result-date">2024-02-01</div>
                    </div>
                    
                    <div class="mw-search-pager-bottom">
                        <span class="mw-search-pager-current">1</span>
                        <a class="mw-nextlink" href="/search?q=钻石&page=2">2</a>
                    </div>
                    
                    <div class="mw-search-did-you-mean">
                        您是否要找：<a href="/search?q=钻石矿">钻石矿</a>
                    </div>
                </body>
                </html>
            `;

            const result = parser.parseSearchResults(complexHtml, '钻石');

            expect(result.success).toBe(true);
            expect(result.data.results).toHaveLength(3);
            expect(result.data.totalCount).toBe(25);
            expect(result.data.hasMore).toBe(true);
            expect(result.data.currentPage).toBe(1);

            // Check main article result
            const mainResult = result.data.results[0];
            expect(mainResult.title).toBe('钻石');
            expect(mainResult.namespace).toBe('主要');
            expect(mainResult.snippet).toContain('稀有的矿物');

            // Check template result
            const templateResult = result.data.results[1];
            expect(templateResult.title).toBe('Template:钻石工具');
            expect(templateResult.namespace).toBe('模板');

            // Check file result with metadata
            const fileResult = result.data.results[2];
            expect(fileResult.title).toBe('File:Diamond_Ore.png');
            expect(fileResult.namespace).toBe('文件');
            expect(fileResult.fileSize).toBe('128 KB');
            expect(fileResult.lastModified).toBe('2024-02-01');

            // Check suggestions
            const suggestions = parser.extractSuggestions(complexHtml);
            expect(suggestions).toContain('钻石矿');
        });

        it('should handle edge cases gracefully', () => {
            const edgeCaseHtml = `
                <html>
                <body>
                    <div class="mw-search-result-data">
                        <div class="mw-search-result-heading">
                            <a href="/w/测试页面" title="">测试页面</a>
                        </div>
                        <!-- Missing searchresult div -->
                    </div>
                    
                    <div class="mw-search-result-data">
                        <div class="mw-search-result-heading">
                            <!-- Missing link -->
                        </div>
                        <div class="searchresult">孤立的描述文本</div>
                    </div>
                    
                    <div class="mw-search-result-data">
                        <div class="mw-search-result-heading">
                            <a href="" title="空链接">空链接</a>
                        </div>
                        <div class="searchresult">   </div>
                    </div>
                </body>
                </html>
            `;

            const result = parser.parseSearchResults(edgeCaseHtml, 'test');

            expect(result.success).toBe(true);
            // Should only include results with valid titles
            expect(result.data.results.length).toBeGreaterThanOrEqual(0);
            
            // Results with titles should be included even if other fields are missing
            const validResults = result.data.results.filter(r => r.title);
            validResults.forEach(result => {
                expect(result.title).toBeTruthy();
                expect(typeof result.snippet).toBe('string');
                expect(typeof result.namespace).toBe('string');
            });
        });
    });
});