// tests/integration/auth.contract.test.js
import request from 'supertest';
import { app } from '../../app/app';

describe('Auth Contract - MVP', () => {

  it('POST /api/v1/auth/login should fail without tenant context', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@test.com',
        password: 'wrongpass'
      });

    // It should be 403 Forbidden because tenantMiddleware won't resolve tenant from localhost
    expect(response.statusCode).toBe(403);
  });

});