import request from 'supertest';
import app from '../server.js';

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should return validation error for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'invalid', password: '123456', company_name: 'Test Co' });

      expect(res.status).toBe(400);
    });

    it('should return validation error for short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'test@test.com', password: '123', company_name: 'Test Co' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return validation error for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid', password: '123456' });

      expect(res.status).toBe(400);
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: '12345678' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBeDefined();
    });
  });
});

describe('Health Check', () => {
  it('should return status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('Not Found', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.message).toBeDefined();
  });
});
