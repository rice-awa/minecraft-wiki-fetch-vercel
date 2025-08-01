/**
 * Page URL Handler for Minecraft Wiki
 * 处理页面名称到URL的转换，支持不同类型的Wiki页面URL格式
 */

class PageUrlHandler {
    constructor(baseUrl = 'https://zh.minecraft.wiki') {
        this.baseUrl = baseUrl.replace(/\/+$/, ''); // 移除末尾的斜杠
        this.wikiPath = '/w';
        
        // Wiki命名空间映射（ID到中文名称）
        this.namespaceMap = {
            0: '', // 主命名空间（无前缀）
            1: '讨论',
            2: '用户',
            3: '用户讨论',
            4: 'Minecraft Wiki',
            5: 'Minecraft Wiki讨论',
            6: '文件',
            7: '文件讨论',
            8: 'MediaWiki',
            9: 'MediaWiki讨论',
            10: '模板',
            11: '模板讨论',
            12: '帮助',
            13: '帮助讨论',
            14: '分类',
            15: '分类讨论',
            828: '模块',
            829: '模块讨论'
        };

        // 反向映射（中文名称到ID）
        this.reverseNamespaceMap = {};
        Object.entries(this.namespaceMap).forEach(([id, name]) => {
            if (name) {
                this.reverseNamespaceMap[name] = parseInt(id);
            }
        });

        // 特殊页面模式
        this.specialPages = {
            'Special:Search': 'Special:搜索',
            'Special:Random': 'Special:随机页面',
            'Special:RecentChanges': 'Special:最近更改',
            'Special:Upload': 'Special:上传文件'
        };
    }

    /**
     * 将页面名称转换为完整的Wiki页面URL
     * @param {string} pageName - 页面名称（可包含命名空间）
     * @param {Object} options - 转换选项
     * @param {string} options.action - 页面操作（view, edit, history等）
     * @param {string} options.section - 页面章节ID
     * @param {Object} options.query - 额外的查询参数
     * @returns {string} 完整的页面URL
     */
    buildPageUrl(pageName, options = {}) {
        if (!pageName || typeof pageName !== 'string') {
            throw new Error('页面名称必须是非空字符串');
        }

        const { action = 'view', section, query = {} } = options;

        // 清理和规范化页面名称
        const normalizedPageName = this.normalizePageName(pageName);
        
        // 构建基础URL
        let url = `${this.baseUrl}${this.wikiPath}/${this._encodePageName(normalizedPageName)}`;

        // 添加查询参数
        const params = new URLSearchParams();
        
        // 添加action参数（除了默认的view）
        if (action !== 'view') {
            params.set('action', action);
        }

        // 添加section参数
        if (section !== undefined) {
            params.set('section', section.toString());
        }

        // 添加其他查询参数
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.set(key, value.toString());
            }
        });

        // 如果有查询参数，添加到URL
        const queryString = params.toString();
        if (queryString) {
            url += `?${queryString}`;
        }

        return url;
    }

    /**
     * 将页面名称转换为API格式的URL
     * @param {string} pageName - 页面名称
     * @param {Object} options - API选项
     * @param {string} options.format - 响应格式（json, xml等）
     * @param {string} options.action - API操作
     * @param {Object} options.params - 额外的API参数
     * @returns {string} API URL
     */
    buildApiUrl(pageName, options = {}) {
        const { 
            format = 'json', 
            action = 'query',
            params = {}
        } = options;

        const normalizedPageName = this.normalizePageName(pageName);
        const apiUrl = `${this.baseUrl}/api.php`;
        
        const apiParams = new URLSearchParams({
            action,
            format,
            titles: normalizedPageName,
            ...params
        });

        return `${apiUrl}?${apiParams.toString()}`;
    }

    /**
     * 从URL中提取页面名称
     * @param {string} url - Wiki页面URL
     * @returns {Object} 包含页面名称和其他信息的对象
     */
    extractPageInfo(url) {
        try {
            const urlObj = new URL(url);
            
            // 检查是否是Wiki URL
            if (!this.isWikiUrl(url)) {
                throw new Error('不是有效的Wiki URL');
            }

            const result = {
                pageName: null,
                namespace: null,
                namespaceId: 0,
                action: 'view',
                section: null,
                query: {},
                isSpecialPage: false
            };

            // 提取路径
            const path = urlObj.pathname;
            
            // 处理 /w/PageName 格式
            if (path.startsWith(`${this.wikiPath}/`)) {
                const encodedPageName = path.substring(this.wikiPath.length + 1);
                const decodedPageName = decodeURIComponent(encodedPageName);
                
                result.pageName = this._normalizeFromUrl(decodedPageName);
                
                // 检查是否是特殊页面
                if (decodedPageName.startsWith('Special:')) {
                    result.isSpecialPage = true;
                }
                
                // 提取命名空间信息
                const namespaceInfo = this._extractNamespace(result.pageName);
                result.namespace = namespaceInfo.namespace;
                result.namespaceId = namespaceInfo.namespaceId;
                result.pageName = namespaceInfo.title;
            }

            // 提取查询参数
            urlObj.searchParams.forEach((value, key) => {
                if (key === 'action') {
                    result.action = value;
                } else if (key === 'section') {
                    result.section = value;
                } else {
                    result.query[key] = value;
                }
            });

            return result;
        } catch (error) {
            throw new Error(`解析URL失败: ${error.message}`);
        }
    }

    /**
     * 验证URL是否是有效的Wiki页面URL
     * @param {string} url - 要验证的URL
     * @returns {boolean} 是否有效
     */
    isWikiUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.origin === new URL(this.baseUrl).origin;
        } catch {
            return false;
        }
    }

    /**
     * 规范化页面名称
     * @param {string} pageName - 原始页面名称
     * @returns {string} 规范化后的页面名称
     */
    normalizePageName(pageName) {
        if (!pageName) return '';

        let normalized = pageName.trim();

        // 替换下划线为空格
        normalized = normalized.replace(/_/g, ' ');

        // 移除多余的空格
        normalized = normalized.replace(/\s+/g, ' ');

        // 首字母大写（但保持其他字符的原始大小写）
        if (normalized.length > 0) {
            // 检查是否有命名空间前缀
            const colonIndex = normalized.indexOf(':');
            if (colonIndex > 0) {
                const namespacePart = normalized.substring(0, colonIndex);
                const titlePart = normalized.substring(colonIndex + 1);
                
                // 命名空间部分首字母大写，标题部分首字母大写
                const normalizedNamespace = this._capitalizeFirst(namespacePart);
                const normalizedTitle = this._capitalizeFirst(titlePart);
                
                normalized = `${normalizedNamespace}:${normalizedTitle}`;
            } else {
                // 没有命名空间，直接首字母大写
                normalized = this._capitalizeFirst(normalized);
            }
        }

        return normalized;
    }

    /**
     * 获取支持的命名空间列表
     * @returns {Object} 命名空间映射
     */
    getNamespaces() {
        return { ...this.namespaceMap };
    }

    /**
     * 获取命名空间ID
     * @param {string} namespaceName - 命名空间名称
     * @returns {number|null} 命名空间ID
     */
    getNamespaceId(namespaceName) {
        return this.reverseNamespaceMap[namespaceName] || null;
    }

    /**
     * 获取命名空间名称
     * @param {number} namespaceId - 命名空间ID
     * @returns {string} 命名空间名称
     */
    getNamespaceName(namespaceId) {
        return this.namespaceMap[namespaceId] || '';
    }

    /**
     * 检查页面名称是否有效
     * @param {string} pageName - 页面名称
     * @returns {Object} 验证结果
     */
    validatePageName(pageName) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (!pageName || typeof pageName !== 'string') {
            result.isValid = false;
            result.errors.push('页面名称必须是非空字符串');
            return result;
        }

        const trimmed = pageName.trim();
        if (!trimmed) {
            result.isValid = false;
            result.errors.push('页面名称不能为空或只包含空格');
            return result;
        }

        // 检查长度
        if (trimmed.length > 255) {
            result.isValid = false;
            result.errors.push('页面名称长度不能超过255个字符');
        }

        // 检查非法字符
        const invalidChars = /[<>"\|{}[\]]/;
        if (invalidChars.test(trimmed)) {
            result.isValid = false;
            result.errors.push('页面名称包含非法字符: < > " | { } [ ]');
        }

        // 检查是否以点号开头
        if (trimmed.startsWith('.')) {
            result.warnings.push('页面名称以点号开头可能导致访问问题');
        }

        // 检查连续的冒号
        if (trimmed.includes('::')) {
            result.warnings.push('页面名称包含连续的冒号');
        }

        return result;
    }

    /**
     * 编码页面名称用于URL
     * @private
     */
    _encodePageName(pageName) {
        // 将空格替换为下划线，然后进行URL编码
        return encodeURIComponent(pageName.replace(/ /g, '_'));
    }

    /**
     * 从URL规范化页面名称
     * @private
     */
    _normalizeFromUrl(pageName) {
        // 将下划线替换为空格
        return pageName.replace(/_/g, ' ');
    }

    /**
     * 首字母大写
     * @private
     */
    _capitalizeFirst(str) {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * 从页面名称中提取命名空间信息
     * @private
     */
    _extractNamespace(pageName) {
        const colonIndex = pageName.indexOf(':');
        
        if (colonIndex <= 0) {
            return {
                namespace: '',
                namespaceId: 0,
                title: pageName
            };
        }

        const namespacePart = pageName.substring(0, colonIndex);
        const titlePart = pageName.substring(colonIndex + 1);
        
        // 首先检查中文命名空间
        let namespaceId = this.getNamespaceId(namespacePart);
        
        // 如果没找到，检查是否是英文命名空间
        if (namespaceId === null) {
            // 检查常见的英文命名空间映射
            const englishToChineseMap = {
                'Template': '模板',
                'Category': '分类',
                'File': '文件',
                'Help': '帮助',
                'User': '用户',
                'Module': '模块'
            };
            
            const chineseName = englishToChineseMap[namespacePart];
            if (chineseName) {
                namespaceId = this.getNamespaceId(chineseName);
                return {
                    namespace: namespacePart, // 保持原始英文名称
                    namespaceId: namespaceId,
                    title: titlePart
                };
            }
        }
        
        if (namespaceId !== null) {
            return {
                namespace: namespacePart,
                namespaceId: namespaceId,
                title: titlePart
            };
        }

        // 如果不是已知的命名空间，可能是标题的一部分
        return {
            namespace: '',
            namespaceId: 0,
            title: pageName
        };
    }

    /**
     * 更新配置
     * @param {Object} options - 配置选项
     */
    updateConfig(options = {}) {
        if (options.baseUrl) {
            this.baseUrl = options.baseUrl.replace(/\/+$/, '');
        }
        
        if (options.wikiPath) {
            this.wikiPath = options.wikiPath;
        }

        if (options.namespaceMap) {
            this.namespaceMap = { ...options.namespaceMap };
            // 更新反向映射
            this.reverseNamespaceMap = {};
            Object.entries(this.namespaceMap).forEach(([id, name]) => {
                if (name) {
                    this.reverseNamespaceMap[name] = parseInt(id);
                }
            });
        }
    }
}

module.exports = PageUrlHandler;