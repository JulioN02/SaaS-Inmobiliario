import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// =============================================================================
// Constants
// =============================================================================

const RESOURCES = [
  'tenant',
  'user',
  'role',
  'property',
  'tower',
  'unit',
  'resident',
  'occupancy',
  'fee',
  'maintenance',
  'plan',
  'visitor',
  'announcement',
  'website',
  'audit',
  'metrics',
  'subscription',
  'invoice',
  'payment',
] as const;

const ACTIONS = ['read', 'create', 'update', 'delete'] as const;

const ROLES = [
  { name: 'SUPER_ADMIN', description: 'Acceso total a la plataforma' },
  { name: 'ADMIN_TENANT', description: 'Control total sobre su tenant (todos los módulos)' },
  { name: 'ADMINISTRATIVA', description: 'Gestión operativa de residentes, cuotas, mantenimiento' },
  { name: 'PORTERIA', description: 'Registro de visitantes y lectura de información' },
] as const;

// =============================================================================
// Role-Permission Matrix
// =============================================================================

function getPermissionsForRole(roleName: string): Array<{ resource: string; action: string }> {
  switch (roleName) {
    case 'SUPER_ADMIN':
      // ALL permissions on ALL resources
      return RESOURCES.flatMap(resource =>
        ACTIONS.map(action => ({ resource, action })),
      );

    case 'ADMIN_TENANT':
      // ALL actions on all resources EXCEPT tenant CRUD (tenant is SuperAdmin-only)
      // ✅ INCLUDES audit and metrics — full visibility for the admin user
      return RESOURCES.flatMap(resource => {
        if (resource === 'tenant') return []; // AdminTenant cannot manage tenant entity
        return ACTIONS.map(action => ({ resource, action }));
      });

    case 'ADMINISTRATIVA': {
      const permissions: Array<{ resource: string; action: string }> = [];

      // Full CRUD on resident, occupancy, fee, maintenance, visitor
      for (const resource of ['resident', 'occupancy', 'fee', 'maintenance', 'visitor']) {
        for (const action of ['read', 'create', 'update']) {
          permissions.push({ resource, action });
        }
      }

      // Read-only on property, tower, unit, announcement
      for (const resource of ['property', 'tower', 'unit', 'announcement']) {
        permissions.push({ resource, action: 'read' });
      }

      return permissions;
    }

    case 'PORTERIA': {
      const permissions: Array<{ resource: string; action: string }> = [];

      // Read-only on property, tower, unit, resident, announcement, maintenance
      for (const resource of ['property', 'tower', 'unit', 'resident', 'announcement', 'maintenance']) {
        permissions.push({ resource, action: 'read' });
      }

      // Create + read on visitor
      permissions.push({ resource: 'visitor', action: 'read' });
      permissions.push({ resource: 'visitor', action: 'create' });

      return permissions;
    }

    default:
      return [];
  }
}

// =============================================================================
// Demo Data Helpers
// =============================================================================

const RESIDENT_NAMES = [
  { firstName: 'Carlos', lastName: 'Mendoza', docType: 'CC' as const, docNumber: '1012345678', email: 'carlos.mendoza@email.com', phone: '3001112233' },
  { firstName: 'María', lastName: 'González', docType: 'CC' as const, docNumber: '1023456789', email: 'maria.gonzalez@email.com', phone: '3002223344' },
  { firstName: 'Andrés', lastName: 'López', docType: 'CC' as const, docNumber: '1034567890', email: 'andres.lopez@email.com', phone: '3003334455' },
  { firstName: 'Laura', lastName: 'Martínez', docType: 'CE' as const, docNumber: '123456789', email: 'laura.martinez@email.com', phone: '3004445566' },
  { firstName: 'Pedro', lastName: 'Ramírez', docType: 'CC' as const, docNumber: '1045678901', email: 'pedro.ramirez@email.com', phone: '3005556677' },
  { firstName: 'Ana', lastName: 'Torres', docType: 'CC' as const, docNumber: '1056789012', email: 'ana.torres@email.com', phone: '3006667788' },
  { firstName: 'Jorge', lastName: 'Herrera', docType: 'PASSPORT' as const, docNumber: 'AB123456', email: 'jorge.herrera@email.com', phone: '3007778899' },
  { firstName: 'Sofía', lastName: 'Castro', docType: 'CC' as const, docNumber: '1067890123', email: 'sofia.castro@email.com', phone: '3008889900' },
];

const UNIT_LABELS = [
  { identifier: '101', floor: 1, type: 'APARTMENT' as const },
  { identifier: '102', floor: 1, type: 'APARTMENT' as const },
  { identifier: '201', floor: 2, type: 'APARTMENT' as const },
  { identifier: '202', floor: 2, type: 'APARTMENT' as const },
  { identifier: '301', floor: 3, type: 'APARTMENT' as const },
  { identifier: '302', floor: 3, type: 'APARTMENT' as const },
  { identifier: 'PH-A', floor: 4, type: 'APARTMENT' as const },
  { identifier: 'PH-B', floor: 4, type: 'APARTMENT' as const },
  { identifier: 'LOCAL-1', floor: 0, type: 'COMMERCIAL' as const },
  { identifier: 'PARK-1', floor: -1, type: 'PARKING' as const },
  { identifier: 'PARK-2', floor: -2, type: 'PARKING' as const },
];

// =============================================================================
// Seed Function
// =============================================================================

async function seed() {
  console.log('🌱 Starting seed...');

  // ── 1. Create Roles ──────────────────────────────────────────────────────
  console.log('📋 Creating roles...');
  const roleMap = new Map<string, string>();
  for (const role of ROLES) {
    const created = await prisma.role.upsert({
      where: { name: role.name as any },
      update: { description: role.description },
      create: { name: role.name as any, description: role.description },
    });
    roleMap.set(role.name, created.id);
    console.log(`   ✅ Role: ${role.name}`);
  }

  // ── 2. Create Permissions ────────────────────────────────────────────────
  console.log('🔐 Creating permissions...');
  const permissionMap = new Map<string, string>();
  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      const created = await prisma.permission.upsert({
        where: {
          resource_action: { resource, action: action as any },
        },
        update: {},
        create: { resource, action: action as any },
      });
      permissionMap.set(`${resource}:${action}`, created.id);
    }
  }
  console.log(`   ✅ ${permissionMap.size} permissions created`);

  // ── 3. Role-Permission Matrix ────────────────────────────────────────────
  console.log('🔗 Assigning role-permission matrix...');
  for (const roleName of roleMap.keys()) {
    const roleId = roleMap.get(roleName)!;
    const permissions = getPermissionsForRole(roleName);

    for (const { resource, action } of permissions) {
      const permissionId = permissionMap.get(`${resource}:${action}`);
      if (!permissionId) {
        console.warn(`   ⚠️  Permission ${resource}:${action} not found`);
        continue;
      }
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
        update: {},
        create: { roleId, permissionId },
      });
    }
    console.log(`   ✅ ${roleName}: ${permissions.length} permissions assigned`);
  }

  // ── 4. Default Plans ────────────────────────────────────────────────────
  console.log('📋 Creating default plans...');
  const plans = [
    {
      name: 'Básico',
      slug: 'basic',
      description: 'Para conjuntos pequeños — 1 propiedad, hasta 100 unidades, 5 usuarios',
      limits: { properties: 1, units: 100, users: 5 },
      prices: { monthly: 0, yearly: 0 },
      features: ['Sitio web público', 'RBAC completo', 'Gestión de residentes', 'Control de visitantes', 'Solicitudes de mantenimiento'],
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Premium',
      slug: 'premium',
      description: 'Para conjuntos medianos — 10 propiedades, hasta 500 unidades, 15 usuarios',
      limits: { properties: 10, units: 500, users: 15 },
      prices: { monthly: 0, yearly: 0 },
      features: ['Sitio web público', 'RBAC completo', 'Gestión de residentes', 'Control de visitantes', 'Solicitudes de mantenimiento', 'Múltiples propiedades', 'Auditoría completa', 'Reportes avanzados'],
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Sin límites — propiedades ilimitadas, unidades ilimitadas, usuarios ilimitados',
      limits: { properties: -1, units: -1, users: -1 },
      prices: { monthly: 0, yearly: 0 },
      features: ['Sitio web público', 'RBAC completo', 'Gestión de residentes', 'Control de visitantes', 'Solicitudes de mantenimiento', 'Múltiples propiedades', 'Auditoría completa', 'Reportes avanzados', 'Soporte prioritario', 'API completa'],
      isActive: true,
      sortOrder: 3,
    },
  ];

  for (const planData of plans) {
    await prisma.plan.upsert({
      where: { slug: planData.slug },
      update: planData,
      create: planData,
    });
  }
  console.log(`   ✅ ${plans.length} default plans created`);

  // Store plan IDs for later use
  const planMap = new Map<string, string>();
  const allPlans = await prisma.plan.findMany();
  for (const p of allPlans) {
    planMap.set(p.slug, p.id);
  }

  // ── 5. Platform Tenant + SuperAdmin ─────────────────────────────────────
  console.log('🏢 Creating platform tenant...');
  const platformTenant = await prisma.tenant.upsert({
    where: { subdomain: 'platform' },
    update: {},
    create: {
      name: 'Plataforma SaaS Inmobiliario',
      subdomain: 'platform',
      planId: planMap.get('enterprise')!,
      status: 'ACTIVE' as any,
      contactEmail: 'admin@platform.com',
    },
  });
  console.log(`   ✅ Platform tenant: ${platformTenant.id}`);

  const superAdminRoleId = roleMap.get('SUPER_ADMIN')!;
  const hashedPassword = await bcrypt.hash('Admin_Pass_2026!', 10);

  const superAdmin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: platformTenant.id,
        email: 'admin@platform.com',
      },
    },
    update: {
      password: hashedPassword,
      roleId: superAdminRoleId,
      role: 'SUPER_ADMIN' as any,
      isActive: true,
    },
    create: {
      tenantId: platformTenant.id,
      roleId: superAdminRoleId,
      email: 'admin@platform.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN' as any,
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
    },
  });
  console.log(`   ✅ SuperAdmin: ${superAdmin.email} / Admin_Pass_2026!`);

  // ── 6. Demo Tenant: Conjunto Residencial Los Álamos ─────────────────────
  console.log('\n🏘️ Creating demo tenant...');
  const demoTenant = await prisma.tenant.upsert({
    where: { subdomain: 'losalamos' },
    update: {},
    create: {
      name: 'Conjunto Residencial Los Álamos',
      subdomain: 'losalamos',
      planId: planMap.get('premium')!,
      status: 'ACTIVE' as any,
      contactEmail: 'admin@losalamos.com',
    },
  });
  console.log(`   ✅ Demo tenant: ${demoTenant.name} (${demoTenant.id})`);

  // ── 7. Demo Users ────────────────────────────────────────────────────────
  console.log('👤 Creating demo users...');
  const adminTenantRoleId = roleMap.get('ADMIN_TENANT')!;
  const adminRoleId = roleMap.get('ADMINISTRATIVA')!;
  const porteroRoleId = roleMap.get('PORTERIA')!;
  const userPassword = await bcrypt.hash('Demo_2026!', 10);

  // AdminTenant — full access to ALL modules
  const adminUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: demoTenant.id,
        email: 'admin@losalamos.com',
      },
    },
    update: { password: userPassword, isActive: true, roleId: adminTenantRoleId },
    create: {
      tenantId: demoTenant.id,
      roleId: adminTenantRoleId,
      email: 'admin@losalamos.com',
      password: userPassword,
      role: 'ADMIN_TENANT' as any,
      firstName: 'Admin',
      lastName: 'Los Álamos',
      isActive: true,
    },
  });
  console.log(`   ✅ AdminTenant: ${adminUser.email} / Demo_2026!`);

  // Administrative user
  const adminUser2 = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: demoTenant.id,
        email: 'operativo@losalamos.com',
      },
    },
    update: { password: userPassword, isActive: true, roleId: adminRoleId },
    create: {
      tenantId: demoTenant.id,
      roleId: adminRoleId,
      email: 'operativo@losalamos.com',
      password: userPassword,
      role: 'ADMINISTRATIVA' as any,
      firstName: 'María',
      lastName: 'Operaciones',
      isActive: true,
    },
  });
  console.log(`   ✅ Administrativa: ${adminUser2.email} / Demo_2026!`);

  // Portero user
  const porteroUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: demoTenant.id,
        email: 'portero@losalamos.com',
      },
    },
    update: { password: userPassword, isActive: true, roleId: porteroRoleId },
    create: {
      tenantId: demoTenant.id,
      roleId: porteroRoleId,
      email: 'portero@losalamos.com',
      password: userPassword,
      role: 'PORTERIA' as any,
      firstName: 'Pedro',
      lastName: 'Portero',
      isActive: true,
    },
  });
  console.log(`   ✅ Portería: ${porteroUser.email} / Demo_2026!`);

  // ── 8. Demo Properties ───────────────────────────────────────────────────
  console.log('🏢 Creating demo properties...');
  const property1 = await prisma.property.create({
    data: {
      tenantId: demoTenant.id,
      name: 'Torre Principal',
      propertyType: 'CONJUNTO' as any,
      address: 'Carrera 50 # 80-20, Medellín',
      description: 'Torre principal del conjunto con 4 pisos y locales comerciales',
    },
  });

  const property2 = await prisma.property.create({
    data: {
      tenantId: demoTenant.id,
      name: 'Torre Secundaria',
      propertyType: 'CONJUNTO' as any,
      address: 'Carrera 50 # 80-40, Medellín',
      description: 'Torre secundaria con apartamentos tipo estudio',
    },
  });
  console.log(`   ✅ Properties: ${property1.name}, ${property2.name}`);

  // ── 9. Towers ────────────────────────────────────────────────────────────
  console.log('🏗️ Creating towers...');
  const towerA = await prisma.tower.create({
    data: {
      tenantId: demoTenant.id,
      propertyId: property1.id,
      name: 'Torre A',
      floorsCount: 4,
    },
  });
  const towerB = await prisma.tower.create({
    data: {
      tenantId: demoTenant.id,
      propertyId: property2.id,
      name: 'Torre B',
      floorsCount: 3,
    },
  });
  console.log(`   ✅ Towers: ${towerA.name}, ${towerB.name}`);

  // ── 10. Units ────────────────────────────────────────────────────────────
  console.log('🔢 Creating units...');
  const towerAUnits: string[] = [];
  const towerBUnits: string[] = [];

  for (const label of UNIT_LABELS.slice(0, 8)) {
    const unit = await prisma.unit.create({
      data: {
        tenantId: demoTenant.id,
        propertyId: property1.id,
        towerId: towerA.id,
        identifier: `A-${label.identifier}`,
        unitType: label.type,
        floor: label.floor,
        monthlyFeeAmount: 250000,
        status: label.identifier === 'PH-A' ? 'MAINTENANCE' as any : 'AVAILABLE' as any,
      },
    });
    towerAUnits.push(unit.id);
  }

  for (const label of UNIT_LABELS.slice(0, 4)) {
    const unit = await prisma.unit.create({
      data: {
        tenantId: demoTenant.id,
        propertyId: property2.id,
        towerId: towerB.id,
        identifier: `B-${label.identifier}`,
        unitType: label.type,
        floor: label.floor,
        monthlyFeeAmount: 180000,
        status: 'AVAILABLE' as any,
      },
    });
    towerBUnits.push(unit.id);
  }

  // Commercial and parking units (no tower)
  for (const label of UNIT_LABELS.slice(8)) {
    await prisma.unit.create({
      data: {
        tenantId: demoTenant.id,
        propertyId: property1.id,
        identifier: label.identifier,
        unitType: label.type,
        floor: label.floor,
        monthlyFeeAmount: 120000,
      },
    });
  }

  console.log(`   ✅ ${towerAUnits.length + towerBUnits.length + UNIT_LABELS.slice(8).length} units created`);

  // ── 11. Residents ────────────────────────────────────────────────────────
  console.log('👨‍👩‍👧‍👦 Creating residents...');
  const residentIds: string[] = [];
  for (const r of RESIDENT_NAMES) {
    const resident = await prisma.resident.create({
      data: {
        tenantId: demoTenant.id,
        firstName: r.firstName,
        lastName: r.lastName,
        documentType: r.docType,
        documentNumber: r.docNumber,
        email: r.email,
        phone: r.phone,
      },
    });
    residentIds.push(resident.id);
  }
  console.log(`   ✅ ${residentIds.length} residents created`);

  // ── 12. Occupancies ──────────────────────────────────────────────────────
  console.log('🔗 Creating occupancies...');
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  // Active occupancies (residents in units)
  await prisma.occupancy.create({
    data: {
      tenantId: demoTenant.id,
      unitId: towerAUnits[0],
      residentId: residentIds[0],
      type: 'OWNER' as any,
      startDate: sixMonthsAgo,
      notes: 'Propietario del apartamento A-101',
    },
  });

  await prisma.occupancy.create({
    data: {
      tenantId: demoTenant.id,
      unitId: towerAUnits[1],
      residentId: residentIds[1],
      type: 'TENANT' as any,
      startDate: sixMonthsAgo,
      notes: 'Arrendataria del apartamento A-102',
    },
  });

  await prisma.occupancy.create({
    data: {
      tenantId: demoTenant.id,
      unitId: towerAUnits[2],
      residentId: residentIds[2],
      type: 'OWNER' as any,
      startDate: threeMonthsAgo,
      notes: 'Propietario del apartamento A-201',
    },
  });

  await prisma.occupancy.create({
    data: {
      tenantId: demoTenant.id,
      unitId: towerBUnits[0],
      residentId: residentIds[3],
      type: 'TENANT' as any,
      startDate: sixMonthsAgo,
      notes: 'Arrendataria del apartamento B-101',
    },
  });

  // Historical occupancy (closed)
  await prisma.occupancy.create({
    data: {
      tenantId: demoTenant.id,
      unitId: towerAUnits[0],
      residentId: residentIds[4],
      type: 'TENANT' as any,
      startDate: new Date(now.getFullYear() - 1, 0, 1),
      endDate: sixMonthsAgo,
      notes: 'Arrendatario anterior del A-101',
    },
  });

  await prisma.occupancy.create({
    data: {
      tenantId: demoTenant.id,
      unitId: towerBUnits[1],
      residentId: residentIds[5],
      type: 'OWNER' as any,
      startDate: new Date(now.getFullYear() - 2, 0, 1),
      endDate: new Date(now.getFullYear() - 1, 5, 1),
      notes: 'Propietaria anterior del B-102',
    },
  });

  console.log(`   ✅ 6 occupancies created (4 active, 2 historical)`);

  // ── 13. Fees ─────────────────────────────────────────────────────────────
  console.log('💰 Creating fees...');
  const periods = [
    { period: '2026-04', dueDate: new Date(2026, 3, 15) },
    { period: '2026-05', dueDate: new Date(2026, 4, 15) },
  ];

  for (const { period, dueDate } of periods) {
    for (const unitId of [...towerAUnits, ...towerBUnits]) {
      const amount = unitId.startsWith(towerBUnits[0]?.charAt(0) === 'B' ? 'B' : 'A')
        ? 180000
        : 250000;
      
      const isLate = unitId === towerAUnits[0] && period === '2026-04';
      const isPaid = unitId === towerAUnits[1] || (unitId === towerBUnits[0] && period !== '2026-04');

      await prisma.fee.create({
        data: {
          tenantId: demoTenant.id,
          unitId,
          type: 'PERIODIC' as any,
          amount: amount,
          period,
          dueDate,
          status: isPaid ? 'PAID' as any : (isLate ? 'PENDING' as any : 'PENDING' as any),
          paidAmount: isPaid ? amount : null,
          description: `Cuota mensual ${period}`,
        },
      });
    }
  }
  console.log(`   ✅ ${periods.length * (towerAUnits.length + towerBUnits.length)} fees created`);

  // ── 14. Maintenance Requests ────────────────────────────────────────────
  console.log('🔧 Creating maintenance requests...');
  const maintenanceItems = [
    { unitId: towerAUnits[0], title: 'Fuga de agua en baño principal', description: 'El lavamanos del baño principal presenta una fuga constante', status: 'IN_PROGRESS' as const },
    { unitId: towerAUnits[2], title: 'Cambio de bombillos área social', description: '3 bombillos fundidos en el pasillo del segundo piso', status: 'PENDING' as const },
    { unitId: towerBUnits[0], title: 'Revisión de tubería de gas', description: 'Olor a gas en la cocina, requiere revisión urgente', status: 'PENDING' as const },
    { unitId: towerAUnits[1], title: 'Arreglo de cerradura', description: 'La cerradura de la puerta principal está dañada', status: 'RESOLVED' as const, resolvedAt: new Date(2026, 4, 8) },
    { unitId: towerBUnits[1], title: 'Mantenimiento aire acondicionado', description: 'El aire acondicionado no enfría adecuadamente', status: 'CANCELLED' as const },
  ];

  for (const item of maintenanceItems) {
    await prisma.maintenanceRequest.create({
      data: {
        tenantId: demoTenant.id,
        unitId: item.unitId,
        title: item.title,
        description: item.description,
        status: item.status,
        createdBy: adminUser.id,
        assignedTo: item.status === 'IN_PROGRESS' ? 'Carlos Técnico' : null,
        resolvedAt: (item as any).resolvedAt || null,
      },
    });
  }
  console.log(`   ✅ ${maintenanceItems.length} maintenance requests created`);

  // ── 15. Visitors ─────────────────────────────────────────────────────────
  console.log('🚪 Creating visitors...');
  const visitors = [
    { visitorName: 'Luis Fernando Pérez', documentNumber: '1078901234', unitId: towerAUnits[0], entryDate: new Date(2026, 4, 10, 9, 30), notes: 'Visita a Carlos Mendoza' },
    { visitorName: 'Diana Morales', documentNumber: '1089012345', unitId: towerAUnits[1], entryDate: new Date(2026, 4, 10, 14, 0), notes: 'Familiar de María González' },
    { visitorName: 'Roberto Sánchez', documentNumber: '1090123456', unitId: towerAUnits[2], entryDate: new Date(2026, 4, 10, 10, 0), exitDate: new Date(2026, 4, 10, 12, 30), notes: 'Técnico de reparación' },
    { visitorName: 'Carmen Jiménez', documentNumber: '1101234567', unitId: towerBUnits[0], entryDate: new Date(2026, 4, 9, 15, 0), notes: 'Amiga de Laura Martínez' },
    { visitorName: 'Fernando Vargas', documentNumber: '1112345678', unitId: towerAUnits[3], entryDate: new Date(2026, 4, 11, 8, 0), exitDate: new Date(2026, 4, 11, 10, 0), notes: 'Servicio de mudanza' },
  ];

  for (const v of visitors) {
    await prisma.visitor.create({
      data: {
        tenantId: demoTenant.id,
        unitId: v.unitId,
        visitorName: v.visitorName,
        documentNumber: v.documentNumber,
        entryDate: v.entryDate,
        exitDate: v.exitDate || null,
        notes: v.notes,
        registeredBy: porteroUser.id,
      },
    });
  }
  console.log(`   ✅ ${visitors.length} visitors created`);

  // ── 16. Announcements ────────────────────────────────────────────────────
  console.log('📢 Creating announcements...');
  const announcements = [
    { title: 'Corte de agua programado', content: 'Se informa a todos los residentes que el día sábado 15 de mayo se realizará mantenimiento a la tubería principal. El servicio de agua estará suspendido de 8:00 AM a 2:00 PM.', priority: 'HIGH' as const, targetRoles: ['ADMIN_TENANT', 'ADMINISTRATIVA'] as any },
    { title: 'Nueva administradora', content: 'Damos la bienvenida a la Sra. María González como nueva administradora del conjunto. Su oficina estará abierta de lunes a viernes de 9:00 AM a 5:00 PM.', priority: 'NORMAL' as const, targetRoles: ['ADMIN_TENANT', 'ADMINISTRATIVA', 'PORTERIA'] as any },
    { title: 'Recordatorio cuotas de administración', content: 'Los pagos de administración del mes de mayo se recibirán hasta el 15 de mayo sin recargo. A partir del 16 de mayo se aplicará un recargo del 2% mensual.', priority: 'URGENT' as const, targetRoles: ['ADMIN_TENANT', 'ADMINISTRATIVA'] as any },
  ];

  for (const a of announcements) {
    await prisma.announcement.create({
      data: {
        tenantId: demoTenant.id,
        title: a.title,
        content: a.content,
        priority: a.priority,
        targetRoles: a.targetRoles,
        targetUnits: [],
        isActive: true,
        createdBy: adminUser.id,
        startsAt: new Date(),
      },
    });
  }
  console.log(`   ✅ ${announcements.length} announcements created`);

  // ── 17. Website Config ───────────────────────────────────────────────────
  console.log('🌐 Creating website config...');
  await prisma.websiteConfig.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      siteTitle: 'Conjunto Residencial Los Álamos',
      welcomeMessage: 'Bienvenido al portal oficial del Conjunto Residencial Los Álamos. Aquí encontrarás información importante sobre tu comunidad.',
      primaryColor: '#1D4ED8',
      secondaryColor: '#1E293B',
      backgroundColor: '#F8FAFC',
      isPublic: true,
      isMaintenanceMode: false,
    },
  });
  console.log(`   ✅ Website config created`);

  // ── 18. Billing — Platform Tenant (Enterprise, ACTIVE) ────────────────────
  console.log('💳 Creating platform tenant billing...');
  const platformNow = new Date();
  const platformPeriodStart = new Date(platformNow.getFullYear(), platformNow.getMonth(), 1);
  const platformPeriodEnd = new Date(platformNow.getFullYear(), platformNow.getMonth() + 1, 0);

  await prisma.subscription.upsert({
    where: { tenantId: platformTenant.id },
    update: {},
    create: {
      tenantId: platformTenant.id,
      planId: planMap.get('enterprise')!,
      status: 'ACTIVE' as any,
      periodStart: platformPeriodStart,
      periodEnd: platformPeriodEnd,
    },
  });

  await prisma.billingConfig.upsert({
    where: { tenantId: platformTenant.id },
    update: {},
    create: {
      tenantId: platformTenant.id,
      billingCycle: 'MONTHLY' as any,
      currency: 'COP',
      gracePeriodDays: 5,
    },
  });
  console.log(`   ✅ Platform tenant billing configured`);

  // ── 19. Billing — Demo Tenant Los Álamos (Premium, ACTIVE) ────────────────
  console.log('💳 Creating demo tenant billing...');
  const demoNow = new Date();
  const demoTrialPeriodStart = new Date(demoNow.getFullYear(), demoNow.getMonth() - 2, 1);
  const demoPeriodEnd = new Date(demoNow.getFullYear(), demoNow.getMonth() + 1, 0);
  const demoTrialEndsAt = new Date(demoNow.getFullYear(), demoNow.getMonth() - 2, 15);

  await prisma.subscription.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      planId: planMap.get('premium')!,
      status: 'ACTIVE' as any,
      periodStart: demoTrialPeriodStart,
      periodEnd: demoPeriodEnd,
      trialEndsAt: demoTrialEndsAt,
    },
  });

  await prisma.billingConfig.upsert({
    where: { tenantId: demoTenant.id },
    update: {},
    create: {
      tenantId: demoTenant.id,
      billingCycle: 'MONTHLY' as any,
      currency: 'COP',
      gracePeriodDays: 5,
    },
  });

  // Seed a PENDING invoice for the demo tenant
  const demoSavedSubscription = await prisma.subscription.findUnique({
    where: { tenantId: demoTenant.id },
  });

  const invoiceNow = new Date();
  const invoicePeriodStart = new Date(invoiceNow.getFullYear(), invoiceNow.getMonth(), 1);
  const invoicePeriodEnd = new Date(invoiceNow.getFullYear(), invoiceNow.getMonth() + 1, 0);
  const invoiceDueDate = new Date(invoiceNow.getFullYear(), invoiceNow.getMonth(), 15);

  // Only create if not exists
  const existingInvoice = await prisma.invoice.findFirst({
    where: { tenantId: demoTenant.id, status: 'PENDING' as any },
  });

  if (!existingInvoice) {
    await prisma.invoice.create({
      data: {
        subscriptionId: demoSavedSubscription!.id,
        tenantId: demoTenant.id,
        planId: planMap.get('premium')!,
        amount: 0, // Free plan demo
        currency: 'COP',
        status: 'PENDING' as any,
        periodStart: invoicePeriodStart,
        periodEnd: invoicePeriodEnd,
        dueDate: invoiceDueDate,
        notes: 'Factura mensual - Plan Premium',
      },
    });
    console.log(`   ✅ Demo invoice created`);
  } else {
    console.log(`   ✅ Demo invoice already exists`);
  }
  console.log(`   ✅ Demo tenant billing configured`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60));
  console.log('📊 SEED COMPLETED SUCCESSFULLY');
  console.log('='.repeat(60));
  console.log('');
  console.log('🔑 CREDENCIALES DE PRUEBA:');
  console.log('   ┌──────────────────────┬────────────────────────────┬──────────────┐');
  console.log('   │ Rol                  │ Email                      │ Contraseña   │');
  console.log('   ├──────────────────────┼────────────────────────────┼──────────────┤');
  console.log('   │ SuperAdmin           │ admin@platform.com         │ Admin_Pass_2026! │');
  console.log('   │ AdminTenant (todos)  │ admin@losalamos.com        │ Demo_2026!   │');
  console.log('   │ Administrativa       │ operativo@losalamos.com    │ Demo_2026!   │');
  console.log('   │ Portería             │ portero@losalamos.com      │ Demo_2026!   │');
  console.log('   └──────────────────────┴────────────────────────────┴──────────────┘');
  console.log('');
  console.log('📦 DATA CREADA:');
  console.log(`   • ${ROLES.length} roles con permisos`);
  console.log(`   • ${plans.length} planes (Básico, Premium, Enterprise)`);
  console.log(`   • 2 tenants (Platform + Los Álamos)`);
  console.log(`   • 4 usuarios de prueba`);
  console.log(`   • 2 propiedades con ${towerAUnits.length + towerBUnits.length + UNIT_LABELS.slice(8).length} unidades`);
  console.log(`   • ${residentIds.length} residentes`);
  console.log(`   • 6 ocupaciones (4 activas + 2 históricas)`);
  console.log(`   • ${periods.length * (towerAUnits.length + towerBUnits.length)} cuotas`);
  console.log(`   • ${maintenanceItems.length} solicitudes de mantenimiento`);
  console.log(`   • ${visitors.length} visitantes registrados`);
  console.log(`   • ${announcements.length} anuncios`);
  console.log('   • Configuración de sitio web');
  console.log('   • Suscripciones y configuración de facturación para 2 tenants');
  console.log('');
  console.log('🌱 Seed completed!');
}

seed()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
