import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app/app';
import { prisma } from '../helpers/db';

const makeToken = (payload: object) =>
  jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });

const seedTenant = async () => {
  const role = await prisma.role.upsert({
    where: { name: 'ADMIN_TENANT' },
    update: {},
    create: { name: 'ADMIN_TENANT' }
  });
  const uniqueKey = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const tenant = await prisma.tenant.create({
    data: { name: 'Tenant Fees', subdomain: `fees-${uniqueKey}`, plan: 'PREMIUM' }
  });
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      roleId: role.id,
      email: `admin-fees-${uniqueKey}@test.com`,
      password: 'hashed',
      role: 'ADMIN_TENANT'
    }
  });
  return { tenant, role };
};

const seedPermissions = async (roleId: string) => {
  const perm = await prisma.permission.upsert({
    where: { resource_action: { resource: 'fees', action: 'create' } },
    update: {},
    create: { resource: 'fees', action: 'create' }
  });
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId, permissionId: perm.id } },
    update: {},
    create: { roleId, permissionId: perm.id }
  });
  
  const permUpdate = await prisma.permission.upsert({
    where: { resource_action: { resource: 'fees', action: 'update' } },
    update: {},
    create: { resource: 'fees', action: 'update' }
  });
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId, permissionId: permUpdate.id } },
    update: {},
    create: { roleId, permissionId: permUpdate.id }
  });
  
  const permRead = await prisma.permission.upsert({
    where: { resource_action: { resource: 'fees', action: 'read' } },
    update: {},
    create: { resource: 'fees', action: 'read' }
  });
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId, permissionId: permRead.id } },
    update: {},
    create: { roleId, permissionId: permRead.id }
  });
};

describe('Fees Module — Integration Tests', () => {

  let tenantId: string;
  let token: string;
  let unitId: string;

  beforeEach(async () => {
    const { tenant, role } = await seedTenant();
    tenantId = tenant.id;
    await seedPermissions(role.id);
    
    token = makeToken({ sub: 'sys-admin-id', client_id: tenantId, role: 'ADMIN_TENANT' });

    const prop = await prisma.property.create({
      data: { tenantId, name: 'Prop Fees', propertyType: 'EDIFICIO' }
    });
    const unit = await prisma.unit.create({
      data: { tenantId, propertyId: prop.id, identifier: 'Apto 101', unitType: 'APARTMENT' }
    });
    unitId = unit.id;
  });

  it('POST /fees — creates a fee with PENDING status', async () => {
    const res = await request(app)
      .post('/api/v1/fees')
      .set('Authorization', `Bearer ${token}`)
      .send({ unitId, type: 'PERIODIC', amount: 350000.00, period: '2025-01' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.status).toBe('PENDING');
  });

  it('PATCH /fees/:id/status — transits PENDING to PARTIAL correctly', async () => {
    const fee = await prisma.fee.create({
      data: { tenantId, unitId, type: 'PERIODIC', amount: 350000.00, period: '2025-01', status: 'PENDING' }
    });

    const res = await request(app)
      .patch(`/api/v1/fees/${fee.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'PARTIAL', paidAmount: 100000.00, notes: 'Abono 1' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('PARTIAL');
    expect(Number(res.body.paidAmount)).toBe(100000);

    // Verify history was created
    const history = await prisma.feeStatusHistory.findMany({ where: { feeId: fee.id } });
    expect(history.length).toBe(1);
    expect(history[0].toStatus).toBe('PARTIAL');
  });

  it('PATCH /fees/:id/status — auto-completes to PAID if PARTIAL covers full amount', async () => {
    const fee = await prisma.fee.create({
      data: { tenantId, unitId, type: 'PERIODIC', amount: 350000.00, period: '2025-01', status: 'PARTIAL', paidAmount: 150000.00 }
    });

    const res = await request(app)
      .patch(`/api/v1/fees/${fee.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'PARTIAL', paidAmount: 200000.00, notes: 'Abono 2 final' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('PAID');
    expect(Number(res.body.paidAmount)).toBe(350000);
  });

  it('PATCH /fees/:id/status — blocks changing a PAID fee', async () => {
    const fee = await prisma.fee.create({
      data: { tenantId, unitId, type: 'PERIODIC', amount: 350000.00, period: '2025-01', status: 'PAID', paidAmount: 350000.00 }
    });

    const res = await request(app)
      .patch(`/api/v1/fees/${fee.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'PARTIAL', paidAmount: 100000.00 });

    expect(res.statusCode).toBe(409);
  });

});
