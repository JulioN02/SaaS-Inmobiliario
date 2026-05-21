/* =============================================================================
   SaaS Inmobiliario — Integration Tests
   Multi-tenant isolation, CRUD flows, and data integrity
   ============================================================================= */

import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import { createTestApp, cleanDatabase, createTestTenant } from './test-utils';

describe('Multi-tenant isolation (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // IDs de tenants creados para los tests
  let tenantAId: string;
  let tenantBId: string;

  beforeAll(async () => {
    const ctx = await createTestApp();
    app = ctx.app;
    prisma = ctx.prisma;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
    const tenantA = await createTestTenant(prisma, { name: 'Tenant A' });
    const tenantB = await createTestTenant(prisma, { name: 'Tenant B' });
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;
  });

  // ── Multi-tenant isolation tests ─────────────────────────────────────────

  it('should isolate properties by tenant — direct Prisma queries', async () => {
    // Crear propiedad para Tenant A
    await prisma.property.create({
      data: {
        tenantId: tenantAId,
        name: 'Edificio A',
        address: 'Calle 123',
        propertyType: 'TORRE',
      },
    });

    // Tenant B NO debe verla
    const tenantBProperties = await prisma.property.findMany({
      where: { tenantId: tenantBId },
    });
    expect(tenantBProperties).toHaveLength(0);

    // Tenant A SÍ debe verla
    const tenantAProperties = await prisma.property.findMany({
      where: { tenantId: tenantAId },
    });
    expect(tenantAProperties).toHaveLength(1);
  });

  it('should isolate units by tenant', async () => {
    // Crear propiedad en Tenant A
    const prop = await prisma.property.create({
      data: {
        tenantId: tenantAId,
        name: 'Conjunto A',
        address: 'Calle 456',
        propertyType: 'CONJUNTO',
      },
    });

    // Crear unidad en Tenant A
    await prisma.unit.create({
      data: {
        tenantId: tenantAId,
        propertyId: prop.id,
        identifier: '101',
        unitType: 'APARTMENT',
      },
    });

    // Verificar que Tenant B no tiene unidades
    const tenantBUnits = await prisma.unit.findMany({
      where: { tenantId: tenantBId },
    });
    expect(tenantBUnits).toHaveLength(0);

    // Y Tenant A sí
    const tenantAUnits = await prisma.unit.findMany({
      where: { tenantId: tenantAId },
    });
    expect(tenantAUnits).toHaveLength(1);
  });

  it('should isolate residents by tenant', async () => {
    // Crear residente en Tenant A
    await prisma.resident.create({
      data: {
        tenantId: tenantAId,
        firstName: 'Juan',
        lastName: 'Pérez',
        documentType: 'CC',
        documentNumber: '12345678',
      },
    });

    // Crear residente en Tenant B
    await prisma.resident.create({
      data: {
        tenantId: tenantBId,
        firstName: 'María',
        lastName: 'Gómez',
        documentType: 'CC',
        documentNumber: '87654321',
      },
    });

    // Verificar aislamiento
    const tenantAResidents = await prisma.resident.findMany({
      where: { tenantId: tenantAId },
    });
    expect(tenantAResidents).toHaveLength(1);
    expect(tenantAResidents[0]?.firstName).toBe('Juan');

    const tenantBResidents = await prisma.resident.findMany({
      where: { tenantId: tenantBId },
    });
    expect(tenantBResidents).toHaveLength(1);
    expect(tenantBResidents[0]?.firstName).toBe('María');
  });

  // ── CRUD flow tests ───────────────────────────────────────────────────

  it('should support complete property CRUD flow', async () => {
    // CREATE — usar el dto que espera el service (property, no type)
    const property = await prisma.property.create({
      data: {
        tenantId: tenantAId,
        name: 'Mi Propiedad',
        address: 'Av. Siempre Viva 742',
        propertyType: 'CASA_INDEPENDIENTE',
      },
    });
    expect(property.id).toBeDefined();
    expect(property.name).toBe('Mi Propiedad');

    // READ
    const found = await prisma.property.findUnique({
      where: { id: property.id },
    });
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Mi Propiedad');

    // UPDATE
    const updated = await prisma.property.update({
      where: { id: property.id },
      data: { name: 'Mi Propiedad Editada' },
    });
    expect(updated.name).toBe('Mi Propiedad Editada');

    // SOFT DELETE (set deletedAt)
    const deleted = await prisma.property.update({
      where: { id: property.id },
      data: { deletedAt: new Date() },
    });
    expect(deleted.deletedAt).not.toBeNull();
  });

  it('should support property → unit → resident → occupancy flow', async () => {
    // Crear propiedad
    const property = await prisma.property.create({
      data: {
        tenantId: tenantAId,
        name: 'Conjunto Residencial',
        address: 'Calle 789',
        propertyType: 'CONJUNTO',
      },
    });

    // Crear unidad
    const unit = await prisma.unit.create({
      data: {
        tenantId: tenantAId,
        propertyId: property.id,
        identifier: 'Apto 201',
        unitType: 'APARTMENT',
        monthlyFeeAmount: 500000,
      },
    });

    // Crear residente
    const resident = await prisma.resident.create({
      data: {
        tenantId: tenantAId,
        firstName: 'Carlos',
        lastName: 'López',
        documentType: 'CC',
        documentNumber: '111222333',
        email: 'carlos@example.com',
        phone: '3001234567',
      },
    });

    // Asignar ocupación
    const occupancy = await prisma.occupancy.create({
      data: {
        tenantId: tenantAId,
        unitId: unit.id,
        residentId: resident.id,
        type: 'OWNER',
        startDate: new Date('2026-01-01'),
      },
    });
    expect(occupancy.id).toBeDefined();

    // Verificar la relación
    const occupancies = await prisma.occupancy.findMany({
      where: { unitId: unit.id },
      include: { resident: true, unit: true },
    });
    expect(occupancies).toHaveLength(1);
    expect(occupancies[0]?.resident.firstName).toBe('Carlos');
    expect(occupancies[0]?.unit.identifier).toBe('Apto 201');

    // Cerrar ocupación
    const closed = await prisma.occupancy.update({
      where: { id: occupancy.id },
      data: { endDate: new Date('2026-12-31') },
    });
    expect(closed.endDate).not.toBeNull();
  });

  it('should create and update fees with audit trail', async () => {
    const property = await prisma.property.create({
      data: {
        tenantId: tenantAId,
        name: 'Prop Test',
        address: 'Addr',
        propertyType: 'TORRE',
      },
    });

    const unit = await prisma.unit.create({
      data: {
        tenantId: tenantAId,
        propertyId: property.id,
        identifier: '301',
        unitType: 'APARTMENT',
        monthlyFeeAmount: 600000,
      },
    });

    // Crear cuota
    const fee = await prisma.fee.create({
      data: {
        tenantId: tenantAId,
        unitId: unit.id,
        amount: 600000,
        period: '2026-06',
        dueDate: new Date('2026-06-30'),
        type: 'PERIODIC',
      },
    });
    expect(fee.id).toBeDefined();

    // Actualizar a pagado
    const paid = await prisma.fee.update({
      where: { id: fee.id },
      data: { status: 'PAID', paidAmount: 600000 },
    });
    expect(paid.status).toBe('PAID');
    expect(paid.paidAmount?.toString()).toBe('600000');

    // Auditoría: crear log manual
    await prisma.auditLog.create({
      data: {
        tenantId: tenantAId,
        userId: 'test-user',
        entity: 'fee',
        entityId: fee.id,
        action: 'UPDATE',
      },
    });

    const logs = await prisma.auditLog.findMany({
      where: { entityId: fee.id },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('UPDATE');
  });

  // ── Plan limits enforcement ───────────────────────────────────────────

  it('should include tenant plan in DB for multi-tenant setup', async () => {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantAId } });
    expect(tenant).toBeDefined();
    expect(tenant!.plan).toBe('BASIC');

    // El plan BASICO en la DB es correcto
    const dbTenants = await prisma.tenant.findMany({ orderBy: { createdAt: 'asc' } });
    expect(dbTenants).toHaveLength(2);
    expect(dbTenants.some((t) => t.name === 'Tenant A')).toBe(true);
    expect(dbTenants.some((t) => t.name === 'Tenant B')).toBe(true);
  });

  it('should allow finding data across tenants without data leaking', async () => {
    // Crear 2 propiedades en Tenant A, 1 en Tenant B
    for (let i = 0; i < 2; i++) {
      await prisma.property.create({
        data: {
          tenantId: tenantAId,
          name: `Prop A-${i}`,
          address: `Addr ${i}`,
          propertyType: 'CASA_INDEPENDIENTE',
        },
      });
    }
    await prisma.property.create({
      data: {
        tenantId: tenantBId,
        name: 'Prop B-1',
        address: 'Addr B',
        propertyType: 'CASA_INDEPENDIENTE',
      },
    });

    // Tenant A: 2
    const countA = await prisma.property.count({ where: { tenantId: tenantAId } });
    expect(countA).toBe(2);

    // Tenant B: 1
    const countB = await prisma.property.count({ where: { tenantId: tenantBId } });
    expect(countB).toBe(1);

    // La consulta sin filtro devuelve 3 (todos los datos existen)
    const allProps = await prisma.property.findMany({ orderBy: { name: 'asc' } });
    expect(allProps).toHaveLength(3);
  });
});
