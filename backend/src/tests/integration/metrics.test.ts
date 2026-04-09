import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app/app';
import { prisma } from '../helpers/db';

const makeToken = (payload: object) =>
  jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });

describe('Metrics Module — Integration Tests', () => {
  let superAdminToken: string;
  let tenantAdminToken: string;

  beforeEach(async () => {
    // Seed a SUPER_ADMIN role if it doesn't exist
    const superAdminRole = await prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: { name: 'SUPER_ADMIN' }
    });

    // Seed a regular tenant role
    const tenantAdminRole = await prisma.role.upsert({
      where: { name: 'ADMIN_TENANT' },
      update: {},
      create: { name: 'ADMIN_TENANT' }
    });

    superAdminToken = makeToken({ id: 'sa-1', sub: 'sa-1', role: 'SUPER_ADMIN' });
    tenantAdminToken = makeToken({ id: 'ta-1', sub: 'ta-1', client_id: 'some-tenant-id', role: 'ADMIN_TENANT' });

    // Seed some data to count
    await prisma.tenant.create({
      data: { name: 'Tenant 1', subdomain: 't1', plan: 'BASIC', status: 'ACTIVE' }
    });
    await prisma.tenant.create({
      data: { name: 'Tenant 2', subdomain: 't2', plan: 'PREMIUM', status: 'SUSPENDED' }
    });
  });

  it('GET /metrics — allows SUPER_ADMIN access', async () => {
    const res = await request(app)
      .get('/api/v1/metrics')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('tenantsActive');
    expect(res.body).toHaveProperty('byPlan');
  });

  it('GET /metrics — forbids non-SUPER_ADMIN access', async () => {
    const res = await request(app)
      .get('/api/v1/metrics')
      .set('Authorization', `Bearer ${tenantAdminToken}`);

    expect(res.statusCode).toBe(403);
  });
});
