// tests/integration/health.test.js
import request from 'supertest';
import { app } from '../../app/app';

describe('Health Endpoint', () => {

  it('GET /health should return 200', async () => {
    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

});