import request from 'supertest';
import app from '../app';
import { db } from '../config/db';

describe('Base Project Verification', () => {
  describe('API Health', () => {
    it('should return 200 OK for health check', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('API is running');
    });
  });

  describe('Database (Configuration Check)', () => {
    it('should have a valid knex instance', () => {
      expect(db).toBeDefined();
    });

    // Note: Actual DB connectivity tests would require a running Postgres instance.
    // In a real CI/CD, we would run these against a test database.
  });
});
