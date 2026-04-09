import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../app/app';
import { prisma } from '../helpers/db';

const makeToken = (payload: object) =>
  jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });

// Helpers to seed DB across tests
const seedTenant = async () => {
  const role = await prisma.role.upsert({
    where: { name: 'ADMIN_TENANT' },
    update: {},
    create: { name: 'ADMIN_TENANT' }
  });
  const uniqueKey = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const tenant = await prisma.tenant.create({
    data: { name: 'Conjunto Test', subdomain: `test-${uniqueKey}`, plan: 'PREMIUM' }
  });
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      roleId: role.id,
      email: `admin-${uniqueKey}@test.com`,
      password: 'hashedpassword123',
      role: 'ADMIN_TENANT'
    }
  });
  return { tenant, role };
};

const seedPermissions = async (roleId: string) => {
  const resources = ['properties', 'towers', 'units', 'residents', 'occupancies', 'fees', 'maintenance', 'visitors'];
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

describe('Dominio Inmobiliario — Integration Tests', () => {

  let tenantId: string;
  let token: string;

  beforeEach(async () => {
    const { tenant, role } = await seedTenant();
    tenantId = tenant.id;
    await seedPermissions(role.id);
    token = makeToken({ sub: 'sys-admin-id', client_id: tenantId, role: 'ADMIN_TENANT' });
  });

  // ── PROPERTY ────────────────────────────────────────────────────────────────

  describe('Property', () => {
    it('POST /properties — creates property for PREMIUM tenant', async () => {
      const res = await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Conjunto A', propertyType: 'CONJUNTO' });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Conjunto A');
    });

    it('POST /properties — BASIC plan blocks 2nd property', async () => {
      // Change tenant plan to BASIC
      await prisma.tenant.update({ where: { id: tenantId }, data: { plan: 'BASIC' } });

      // Create first (allowed)
      await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Propiedad 1', propertyType: 'EDIFICIO' });

      // Second should fail
      const res = await request(app)
        .post('/api/v1/properties')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Propiedad 2', propertyType: 'EDIFICIO' });

      expect(res.statusCode).toBe(403);
    });

    it('DELETE /properties/:id — blocked when property has units', async () => {
      const prop = await prisma.property.create({
        data: { tenantId, name: 'Prop con Unidad', propertyType: 'CONJUNTO' }
      });
      // Seed a unit directly
      await prisma.unit.create({
        data: { tenantId, propertyId: prop.id, identifier: 'Apto 1', unitType: 'APARTMENT' }
      });

      const res = await request(app)
        .delete(`/api/v1/properties/${prop.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(409);
    });
  });

  // ── TOWER ────────────────────────────────────────────────────────────────────

  describe('Tower', () => {
    it('POST /properties/:id/towers — creates tower under property', async () => {
      const prop = await prisma.property.create({
        data: { tenantId, name: 'Prop', propertyType: 'CONJUNTO' }
      });

      const res = await request(app)
        .post(`/api/v1/properties/${prop.id}/towers`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Torre A', floorsCount: 10 });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Torre A');
    });

    it('POST /properties/:id/towers — 404 if property does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/properties/00000000-0000-0000-0000-000000000000/towers')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Torre B' });

      expect(res.statusCode).toBe(404);
    });
  });

  // ── UNIT ─────────────────────────────────────────────────────────────────────

  describe('Unit', () => {
    it('POST /properties/:id/units — creates unit under property', async () => {
      const prop = await prisma.property.create({
        data: { tenantId, name: 'Prop', propertyType: 'EDIFICIO' }
      });

      const res = await request(app)
        .post('/api/v1/units')
        .set('Authorization', `Bearer ${token}`)
        .send({ propertyId: prop.id, identifier: 'Apto 101', unitType: 'APARTMENT', floor: 1 });

      expect(res.statusCode).toBe(201);
      expect(res.body.identifier).toBe('Apto 101');
    });

    it('Unit creation rejects towerId from a different property', async () => {
      const propA = await prisma.property.create({
        data: { tenantId, name: 'Prop A', propertyType: 'CONJUNTO' }
      });
      const propB = await prisma.property.create({
        data: { tenantId, name: 'Prop B', propertyType: 'CONJUNTO' }
      });
      const tower = await prisma.tower.create({
        data: { tenantId, propertyId: propB.id, name: 'Torre de B' }
      });

      const res = await request(app)
        .post('/api/v1/units')
        .set('Authorization', `Bearer ${token}`)
        .send({ propertyId: propA.id, identifier: 'Apto 1', unitType: 'APARTMENT', towerId: tower.id });

      expect(res.statusCode).toBe(422);
    });
  });

  // ── RESIDENT ─────────────────────────────────────────────────────────────────

  describe('Resident', () => {
    it('POST /residents — creates resident', async () => {
      const res = await request(app)
        .post('/api/v1/residents')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'María', lastName: 'González',
          documentType: 'CC', documentNumber: '1098765432'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.documentNumber).toBe('1098765432');
    });

    it('POST /residents — 409 on duplicate documentNumber', async () => {
      await request(app)
        .post('/api/v1/residents')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Maria', lastName: 'Perez', documentType: 'CC', documentNumber: '111222333' });

      const res = await request(app)
        .post('/api/v1/residents')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'Juana', lastName: 'Lopez', documentType: 'CC', documentNumber: '111222333' });

      expect(res.statusCode).toBe(409);
    });
  });

  // ── OCCUPANCY ────────────────────────────────────────────────────────────────

  describe('Occupancy', () => {
    let propId: string;
    let unitId: string;
    let residentId: string;

    beforeEach(async () => {
      const prop = await prisma.property.create({
        data: { tenantId, name: 'Prop', propertyType: 'CONJUNTO' }
      });
      propId = prop.id;

      const unit = await prisma.unit.create({
        data: { tenantId, propertyId: prop.id, identifier: 'Apto 201', unitType: 'APARTMENT' }
      });
      unitId = unit.id;

      const resident = await prisma.resident.create({
        data: {
          tenantId,
          firstName: 'Juan', lastName: 'Pérez',
          documentType: 'CC', documentNumber: '999'
        }
      });
      residentId = resident.id;
    });

    it('POST /occupancies — opens occupancy and sets unit to OCCUPIED', async () => {
      const res = await request(app)
        .post('/api/v1/occupancies')
        .set('Authorization', `Bearer ${token}`)
        .send({ unitId, residentId, type: 'TENANT', startDate: '2025-01-01' });

      expect(res.statusCode).toBe(201);
      expect(res.body.endDate).toBeNull();

      const unit = await prisma.unit.findUnique({ where: { id: unitId } });
      expect(unit!.status).toBe('OCCUPIED');
    });

    it('POST /occupancies — 409 when unit already occupied', async () => {
      await prisma.occupancy.create({
        data: { tenantId, unitId, residentId, type: 'OWNER', startDate: new Date('2025-01-01') }
      });
      await prisma.unit.update({ where: { id: unitId }, data: { status: 'OCCUPIED' } });

      const res = await request(app)
        .post('/api/v1/occupancies')
        .set('Authorization', `Bearer ${token}`)
        .send({ unitId, residentId, type: 'TENANT', startDate: '2025-06-01' });

      expect(res.statusCode).toBe(409);
    });

    it('PATCH /occupancies/:id/close — closes and sets unit back to AVAILABLE', async () => {
      const occ = await prisma.occupancy.create({
        data: { tenantId, unitId, residentId, type: 'OWNER', startDate: new Date('2025-01-01') }
      });
      await prisma.unit.update({ where: { id: unitId }, data: { status: 'OCCUPIED' } });

      const res = await request(app)
        .patch(`/api/v1/occupancies/${occ.id}/close`)
        .set('Authorization', `Bearer ${token}`)
        .send({ endDate: '2025-02-01' });

      expect(res.statusCode).toBe(200);

      const unit = await prisma.unit.findUnique({ where: { id: unitId } });
      expect(unit!.status).toBe('AVAILABLE');
    });

    it('PATCH /occupancies/:id/close — 422 if already closed', async () => {
      const occ = await prisma.occupancy.create({
        data: {
          tenantId, unitId, residentId, type: 'OWNER',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-06-01')
        }
      });

      const res = await request(app)
        .patch(`/api/v1/occupancies/${occ.id}/close`)
        .set('Authorization', `Bearer ${token}`)
        .send({ endDate: '2025-07-01' });

      expect(res.statusCode).toBe(422);
    });
  });

});
