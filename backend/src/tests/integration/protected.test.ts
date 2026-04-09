// tests/integration/protected.test.js
import request from 'supertest';
import { app } from '../../app/app';

describe('Protected Routes Infrastructure', () => {

  it('GET /api/v1/properties should require auth (currently 401 intercept by openapi)', async () => {
    const response = await request(app).get('/api/v1/properties');

    // intercept by openapi validator
    expect(response.statusCode).toBe(401);
  });

});