import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app/app';
import { prisma } from '../helpers/db';

// Helper: generate a signed JWT for test scenarios
const makeToken = (payload: object) =>
  jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });

describe('Core SaaS Modules — Auth Guard', () => {

  beforeEach(async () => {
    // create the ADMIN_TENANT role required for tenant creation
    await prisma.role.upsert({
      where: { name: 'ADMIN_TENANT' },
      update: {},
      create: { name: 'ADMIN_TENANT' }
    });
  });

  it('GET /api/v1/roles — 401 without token', async () => {
    const res = await request(app).get('/api/v1/roles');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/v1/tenants — 401 without token', async () => {
    const res = await request(app).get('/api/v1/tenants');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/v1/users — 401 without token', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/v1/audit — 401 without token', async () => {
    const res = await request(app).get('/api/v1/audit');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/v1/tenants — 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/tenants')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/v1/tenants — 403 with valid token but unknown/suspended tenant', async () => {
    // JWT points to a tenantId that doesn't exist in DB
    const token = makeToken({
      sub: '00000000-0000-0000-0000-000000000001',
      client_id: '00000000-0000-0000-0000-000000000099',
      role: 'ADMIN_TENANT'
    });

    const res = await request(app)
      .get('/api/v1/tenants')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
  });

  it('SUPER_ADMIN with PLATFORM_TENANT_ID bypasses tenant validation', async () => {
    const token = makeToken({
      sub: '00000000-0000-0000-0000-000000000001',
      client_id: process.env.PLATFORM_TENANT_ID,
      role: 'SUPER_ADMIN'
    });

    // DB is empty (reset) — SUPER_ADMIN can still query (will get empty list)
    // But RBAC will fail because roles table is also empty
    const res = await request(app)
      .get('/api/v1/tenants')
      .set('Authorization', `Bearer ${token}`);

    // SUPER_ADMIN bypasses RBAC check in rbacMiddleware
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  it('POST /api/v1/tenants — SUPER_ADMIN can create a tenant', async () => {
    const token = makeToken({
      sub: '00000000-0000-0000-0000-000000000001',
      client_id: process.env.PLATFORM_TENANT_ID,
      role: 'SUPER_ADMIN'
    });

    const res = await request(app)
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Conjunto Las Palmas',
        subdomain: 'laspalmas',
        plan: 'BASIC',
        adminEmail: 'admin@laspalmas.com',
        adminPassword: 'securepassword123'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.subdomain).toBe('laspalmas');
  });

  it('POST /api/v1/tenants — duplicate subdomain returns 409', async () => {
    const token = makeToken({
      sub: '00000000-0000-0000-0000-000000000001',
      client_id: process.env.PLATFORM_TENANT_ID,
      role: 'SUPER_ADMIN'
    });

    await request(app)
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test A', subdomain: 'duplicado', plan: 'BASIC', adminEmail: 'admin1@test.com', adminPassword: 'securepassword1' });

    const res = await request(app)
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test B', subdomain: 'duplicado', plan: 'BASIC', adminEmail: 'admin2@test.com', adminPassword: 'securepassword2' });

    expect(res.statusCode).toBe(409);
  });

});
