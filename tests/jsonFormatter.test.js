/**
 * JSON格式化中间件测试
 */

const request = require('supertest');
const express = require('express');
const { jsonFormatterMiddleware, validatePrettyParam, isPrettyRequested } = require('../src/middleware/jsonFormatter');

describe('JSON格式化中间件测试', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(jsonFormatterMiddleware());
        
        // 测试路由
        app.get('/test', (req, res) => {
            res.json({
                message: 'Hello World',
                data: {
                    items: [1, 2, 3],
                    nested: {
                        value: 'test'
                    }
                }
            });
        });

        app.get('/test-validation', validatePrettyParam, (req, res) => {
            res.json({ message: 'Validation passed' });
        });
    });

    describe('isPrettyRequested 函数测试', () => {
        test('应该正确识别true值', () => {
            expect(isPrettyRequested('true')).toBe(true);
            expect(isPrettyRequested('TRUE')).toBe(true);
            expect(isPrettyRequested('1')).toBe(true);
            expect(isPrettyRequested('yes')).toBe(true);
            expect(isPrettyRequested('YES')).toBe(true);
            expect(isPrettyRequested(true)).toBe(true);
            expect(isPrettyRequested(1)).toBe(true);
        });

        test('应该正确识别false值', () => {
            expect(isPrettyRequested('false')).toBe(false);
            expect(isPrettyRequested('FALSE')).toBe(false);
            expect(isPrettyRequested('0')).toBe(false);
            expect(isPrettyRequested('no')).toBe(false);
            expect(isPrettyRequested('NO')).toBe(false);
            expect(isPrettyRequested(false)).toBe(false);
            expect(isPrettyRequested(0)).toBe(false);
            expect(isPrettyRequested(undefined)).toBe(false);
            expect(isPrettyRequested(null)).toBe(false);
        });

        test('应该正确处理无效值', () => {
            expect(isPrettyRequested('invalid')).toBe(false);
            expect(isPrettyRequested(2)).toBe(false);
            expect(isPrettyRequested({})).toBe(false);
            expect(isPrettyRequested([])).toBe(false);
        });
    });

    describe('JSON格式化功能测试', () => {
        test('不带pretty参数应该返回压缩JSON', async () => {
            const response = await request(app)
                .get('/test')
                .expect(200);

            expect(response.headers['x-json-formatted']).toBe('false');
            expect(response.text).not.toMatch(/\n\s+/); // 不应该包含换行和缩进
        });

        test('pretty=true应该返回格式化JSON', async () => {
            const response = await request(app)
                .get('/test?pretty=true')
                .expect(200);

            expect(response.headers['x-json-formatted']).toBe('true');
            expect(response.text).toMatch(/\n\s+/); // 应该包含换行和缩进
            expect(response.text).toMatch(/{\n  "message"/); // 检查格式化结构
        });

        test('pretty=1应该返回格式化JSON', async () => {
            const response = await request(app)
                .get('/test?pretty=1')
                .expect(200);

            expect(response.headers['x-json-formatted']).toBe('true');
            expect(response.text).toMatch(/\n\s+/);
        });

        test('pretty=false应该返回压缩JSON', async () => {
            const response = await request(app)
                .get('/test?pretty=false')
                .expect(200);

            expect(response.headers['x-json-formatted']).toBe('false');
            expect(response.text).not.toMatch(/\n\s+/);
        });

        test('pretty=0应该返回压缩JSON', async () => {
            const response = await request(app)
                .get('/test?pretty=0')
                .expect(200);

            expect(response.headers['x-json-formatted']).toBe('false');
            expect(response.text).not.toMatch(/\n\s+/);
        });

        test('应该设置正确的Content-Type', async () => {
            const response = await request(app)
                .get('/test?pretty=true')
                .expect(200);

            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.headers['content-type']).toMatch(/charset=utf-8/);
        });
    });

    describe('参数验证测试', () => {
        test('有效的pretty参数应该通过验证', async () => {
            const validValues = ['true', 'false', '1', '0', 'yes', 'no'];
            
            for (const value of validValues) {
                await request(app)
                    .get(`/test-validation?pretty=${value}`)
                    .expect(200);
            }
        });

        test('无效的pretty参数应该返回400错误', async () => {
            const response = await request(app)
                .get('/test-validation?pretty=invalid')
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_PRETTY_PARAMETER');
            expect(response.body.error.message).toBe('pretty参数值无效');
            expect(response.body.error.details.validValues).toEqual(['true', 'false', '1', '0', 'yes', 'no']);
        });

        test('大小写不敏感的参数验证', async () => {
            await request(app)
                .get('/test-validation?pretty=TRUE')
                .expect(200);

            await request(app)
                .get('/test-validation?pretty=False')
                .expect(200);

            await request(app)
                .get('/test-validation?pretty=YES')
                .expect(200);
        });
    });

    describe('边界情况测试', () => {
        test('空的pretty参数应该被视为false', async () => {
            const response = await request(app)
                .get('/test?pretty=')
                .expect(200);

            expect(response.headers['x-json-formatted']).toBe('false');
        });

        test('多个pretty参数应该使用第一个', async () => {
            const response = await request(app)
                .get('/test?pretty=true&pretty=false')
                .expect(200);

            expect(response.headers['x-json-formatted']).toBe('true');
        });

        test('复杂的JSON结构应该正确格式化', async () => {
            app.get('/complex', jsonFormatterMiddleware(), (req, res) => {
                res.json({
                    array: [1, 2, { nested: true }],
                    object: {
                        deep: {
                            very: {
                                deep: 'value'
                            }
                        }
                    },
                    string: 'test with "quotes" and \n newlines',
                    number: 123.456,
                    boolean: true,
                    null: null
                });
            });

            const response = await request(app)
                .get('/complex?pretty=true')
                .expect(200);

            expect(response.headers['x-json-formatted']).toBe('true');
            
            // 验证JSON结构正确
            const parsed = JSON.parse(response.text);
            expect(parsed.array).toHaveLength(3);
            expect(parsed.object.deep.very.deep).toBe('value');
            expect(parsed.string).toContain('quotes');
            expect(parsed.number).toBe(123.456);
            expect(parsed.boolean).toBe(true);
            expect(parsed.null).toBeNull();
        });
    });
});