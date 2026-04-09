import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app/app';
import { prisma } from '../helpers/db';
import { UserRole } from '@prisma/client';

const makeToken = (payload: object) =>
  jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });

const seedTenant = async () => {
  const roleAdmin = await prisma.role.upsert({
    where: { name: 'ADMIN_TENANT' },
    update: {},
    create: { name: 'ADMIN_TENANT' }
  });
  const roleResident = await prisma.role.upsert({
    where: { name: 'ADMINISTRATIVA' },
    update: {},
    create: { name: 'ADMINISTRATIVA' }
  });
  const uniqueKey = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const tenant = await prisma.tenant.create({
    data: { name: 'Operativo Test', subdomain: `op-${uniqueKey}`, plan: 'PREMIUM' }
  });
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      roleId: roleAdmin.id,
      email: `admin-op-${uniqueKey}@test.com`,
      password: 'hashed',
      role: 'ADMIN_TENANT'
    }
  });
  return { tenant, roleAdmin, roleResident };
};

const seedPermissions = async (roleId: string, resources: string[]) => {
  const actions = ['read', 'create', 'update', 'delete'] as const;

  for (const resource of resources) {
    for (const action of actions) {
      const perm = await prisma.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: { resource, action }
      });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId: perm.id } },
        update: {},
        create: { roleId, permissionId: perm.id }
      });
    }
  }
};

describe('Operational Modules — Integration Tests', () => {

  let tenantId: string;
  let adminToken: string;
  let residentToken: string;
  let unitId: string;

  beforeEach(async () => {
    const { tenant, roleAdmin, roleResident } = await seedTenant();
    tenantId = tenant.id;
    await seedPermissions(roleAdmin.id, ['maintenance', 'visitors', 'announcements', 'website']);
    await seedPermissions(roleResident.id, ['maintenance', 'visitors', 'announcements', 'website']);
    
    adminToken = makeToken({ id: 'sys-admin-id', sub: 'sys-admin-id', client_id: tenantId, role: 'ADMIN_TENANT' });
    residentToken = makeToken({ id: 'res-id', sub: 'res-id', client_id: tenantId, role: 'ADMINISTRATIVA' });

    const prop = await prisma.property.create({
      data: { tenantId, name: 'Prop Operativa', propertyType: 'EDIFICIO' }
    });
    const unit = await prisma.unit.create({
      data: { tenantId, propertyId: prop.id, identifier: 'Apto 101', unitType: 'APARTMENT' }
    });
    unitId = unit.id;
  });

  // ── MAINTENANCE ─────────────────────────────────────────────────────────────
  it('POST /maintenance — creates request', async () => {
    const res = await request(app)
      .post('/api/v1/maintenance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ unitId, title: 'Fuga de agua en baño' });

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('PENDING');
  });

  it('PATCH /maintenance/:id — updates status to RESOLVED', async () => {
    const req1 = await prisma.maintenanceRequest.create({
      data: { tenantId, unitId, title: 'Fuga', status: 'PENDING' }
    });

    const res = await request(app)
      .patch(`/api/v1/maintenance/${req1.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED', assignedTo: 'Plomero Juan' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('RESOLVED');
    expect(res.body.resolvedAt).not.toBeNull();
  });

  // ── VISITORS ─────────────────────────────────────────────────────────────────
  it('POST /visitors — registers a visitor', async () => {
    const res = await request(app)
      .post('/api/v1/visitors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ unitId, visitorName: 'Pedro Perez', entryDate: new Date() });

    expect(res.statusCode).toBe(201);
    expect(res.body.visitorName).toBe('Pedro Perez');
  });

  it('PATCH /visitors/:id/checkout — registers exit', async () => {
    const visitor = await prisma.visitor.create({
      data: { tenantId, unitId, visitorName: 'Pedro', entryDate: new Date(), registeredBy: 'admin' }
    });

    const res = await request(app)
      .patch(`/api/v1/visitors/${visitor.id}/checkout`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ exitDate: new Date() });

    expect(res.statusCode).toBe(200);
    expect(res.body.exitDate).not.toBeNull();
  });

  // ── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
  it('POST /announcements — creates an announcement', async () => {
    const res = await request(app)
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Reunión Anual', body: 'Asistencia obligatoria', targetRoles: ['ADMINISTRATIVA'] });

    expect(res.statusCode).toBe(201);
    expect(res.body.targetRoles).toContain('ADMINISTRATIVA');
  });

  it('GET /announcements — filters by user role', async () => {
    await prisma.announcement.create({
      data: { tenantId, title: 'Solo Administrativa', body: '...', targetRoles: ['ADMINISTRATIVA'], createdBy: 'admin' }
    });
    await prisma.announcement.create({
      data: { tenantId, title: 'Solo Guardas', body: '...', targetRoles: ['PORTERIA'], createdBy: 'admin' }
    });

    const resAdmin = await request(app).get('/api/v1/announcements').set('Authorization', `Bearer ${adminToken}`);
    // Admin sees all
    expect(resAdmin.body.data.length).toBe(2);

    const resResident = await request(app).get('/api/v1/announcements').set('Authorization', `Bearer ${residentToken}`);
    // Resident (ADMINISTRATIVA) sees only 'ADMINISTRATIVA'
    expect(resResident.body.data.length).toBe(1);
    expect(resResident.body.data[0].title).toBe('Solo Administrativa');
  });

  // ── WEBSITE ──────────────────────────────────────────────────────────────────
  it('PATCH /website-config — updates or creates website config', async () => {
    const res = await request(app)
      .patch('/api/v1/website')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ primaryColor: '#FF0000', logoUrl: 'https://img.com/logo.png' });

    expect(res.statusCode).toBe(200);
    expect(res.body.primaryColor).toBe('#FF0000');
  });

});
