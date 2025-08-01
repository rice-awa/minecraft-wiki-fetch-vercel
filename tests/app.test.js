const request = require('supertest');
const app = require('../src/index');

describe('App Basic Tests', () => {
  let server;

  beforeAll(() => {
    // Start server on a random port for testing
    server = app.listen(0);
  });

  afterAll((done) => {
    // Close server after tests
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'healthy');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('uptime');
    });
  });

  describe('GET /api', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('message', 'Minecraft Wiki API');
      expect(response.body.data).toHaveProperty('endpoints');
      expect(Array.isArray(response.body.data.endpoints)).toBe(true);
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
    });
  });
});