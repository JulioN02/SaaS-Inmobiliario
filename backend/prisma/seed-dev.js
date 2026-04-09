// =============================================================================
// prisma/seed-dev.js
// SaaS Inmobiliario — Datos de DEMOSTRACIÓN para desarrollo
//
// Ejecutar DESPUÉS del seed principal:
//   node prisma/seed-dev.js
//
// Qué crea este seed:
//   1. 1 Tenant demo (Conjunto residencial)
//   2. 2 Usuarios internos (AdminTenant + Portero)
//   3. 2 Propiedades (1 conjunto + 1 casa)
//   4. 1 Torre con 10 apartamentos
//   5. 5 Residentes de ejemplo
//   6. 3 Ocupaciones activas
//   7. 5 Cuotas del mes actual
//   8. 2 Solicitudes de mantenimiento
//   9. 3 Visitantes registrados
//  10. 2 Anuncios
//  11. Configuración del website
// =============================================================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// =============================================================================
// DATOS DE DEMOSTRACIÓN
// =============================================================================

const TENANT_ID = 'tenant-demo-001-0000-0000-000000000001';

const DEMO_TENANT = {
  id: TENANT_ID,
  name: 'Conjunto Residencial Las Palmas',
  subdomain: 'laspalmas',
  plan: 'PREMIUM',
  status: 'ACTIVE',
  contactEmail: 'admin@laspalmas.com',
  contactPhone: '+57 300 123 4567',
};

const DEMO_USERS = [
  {
    email: 'admin@laspalmas.com',
    password: 'Admin_2026!',
    role: 'ADMIN_TENANT',
    firstName: 'María',
    lastName: 'García',
  },
  {
    email: 'porteria@laspalmas.com',
    password: 'Portero_2026!',
    role: 'PORTERIA',
    firstName: 'Carlos',
    lastName: 'Ramírez',
  },
];

const DEMO_PROPERTIES = [
  {
    name: 'Torre A - Las Palmas',
    propertyType: 'EDIFICIO',
    address: 'Carrera 15 #80-45, Bogotá',
    description: 'Edificio residencial de 15 pisos con 30 apartamentos',
  },
  {
    name: 'Casa Campestre 1',
    propertyType: 'CASA_INDEPENDIENTE',
    address: 'Vereda El Retiro, Km 5, Chía',
    description: 'Casa campestre con 3 habitaciones y piscina',
  },
];

const DEMO_UNITS = [
  // Apartamentos Torre A
  { identifier: 'A-101', unitType: 'APARTMENT', floor: 1, monthlyFeeAmount: 450000 },
  { identifier: 'A-102', unitType: 'APARTMENT', floor: 1, monthlyFeeAmount: 450000 },
  { identifier: 'A-201', unitType: 'APARTMENT', floor: 2, monthlyFeeAmount: 500000 },
  { identifier: 'A-202', unitType: 'APARTMENT', floor: 2, monthlyFeeAmount: 500000 },
  { identifier: 'A-301', unitType: 'APARTMENT', floor: 3, monthlyFeeAmount: 550000 },
  { identifier: 'A-302', unitType: 'APARTMENT', floor: 3, monthlyFeeAmount: 550000 },
  { identifier: 'A-401', unitType: 'APARTMENT', floor: 4, monthlyFeeAmount: 580000 },
  { identifier: 'A-402', unitType: 'APARTMENT', floor: 4, monthlyFeeAmount: 580000 },
  { identifier: 'A-501', unitType: 'APARTMENT', floor: 5, monthlyFeeAmount: 600000 },
  { identifier: 'A-502', unitType: 'APARTMENT', floor: 5, monthlyFeeAmount: 600000 },
  // Parqueaderos
  { identifier: 'P-001', unitType: 'PARKING', floor: null, monthlyFeeAmount: 120000 },
  { identifier: 'P-002', unitType: 'PARKING', floor: null, monthlyFeeAmount: 120000 },
  // Casa campestre
  { identifier: 'CC-01', unitType: 'HOUSE', floor: null, monthlyFeeAmount: 800000 },
];

const DEMO_RESIDENTS = [
  { firstName: 'Juan', lastName: 'Pérez', documentType: 'CC', documentNumber: '1020304050', email: 'juan.perez@mail.com', phone: '+57 310 111 2233' },
  { firstName: 'Ana', lastName: 'López', documentType: 'CC', documentNumber: '5060708090', email: 'ana.lopez@mail.com', phone: '+57 320 444 5566' },
  { firstName: 'Pedro', lastName: 'Martínez', documentType: 'CC', documentNumber: '1122334455', email: 'pedro.martinez@mail.com', phone: '+57 300 777 8899' },
  { firstName: 'Laura', lastName: 'Hernández', documentType: 'CE', documentNumber: 'CE-987654', email: 'laura.hernandez@mail.com', phone: '+57 315 123 4567' },
  { firstName: 'Roberto', lastName: 'Sánchez', documentType: 'CC', documentNumber: '9988776655', email: 'roberto.sanchez@mail.com', phone: '+57 300 987 6543' },
];

const DEMO_ANNOUNCEMENTS = [
  {
    title: 'Mantenimiento de ascensores programado',
    body: 'Se informa que el día sábado 15 de marzo se realizará mantenimiento preventivo a los ascensores de 8:00 AM a 12:00 PM. Disculpen las molestias.',
    targetRoles: ['ADMINISTRATIVA', 'PORTERIA'],
  },
  {
    title: 'Nueva normativa de horarios de visitas',
    body: 'A partir del 1 de abril, las visitas deberán registrarse en portería con documento de identidad. Horario de visitas: 8:00 AM - 10:00 PM.',
    targetRoles: ['ADMINISTRATIVA', 'PORTERIA'],
  },
];

// =============================================================================
// HELPERS
// =============================================================================

async function getRoleIds() {
  const roles = await prisma.role.findMany({ select: { id: true, name: true } });
  return Object.fromEntries(roles.map(r => [r.name, r.id]));
}

async function getPropertyId(tenantId, name) {
  const property = await prisma.property.findFirst({
    where: { tenantId, name },
    select: { id: true },
  });
  return property?.id;
}

async function getUnitId(tenantId, identifier) {
  const unit = await prisma.unit.findFirst({
    where: { tenantId, identifier },
    select: { id: true },
  });
  return unit?.id;
}

async function getResidentId(tenantId, documentNumber) {
  const resident = await prisma.resident.findFirst({
    where: { tenantId, documentNumber },
    select: { id: true },
  });
  return resident?.id;
}

// =============================================================================
// SEED PRINCIPAL
// =============================================================================

async function main() {
  console.log('🌱 Iniciando seed de DEMOSTRACIÓN...\n');

  const roleIds = await getRoleIds();

  // ─── 1. Tenant Demo ───────────────────────────────────────────────────────
  console.log('🏢 Creando tenant demo...');

  await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: {
      name: DEMO_TENANT.name,
      status: DEMO_TENANT.status,
    },
    create: DEMO_TENANT,
  });
  console.log(`   ✓ ${DEMO_TENANT.name}`);

  // ─── 2. Usuarios Internos ─────────────────────────────────────────────────
  console.log('\n👤 Creando usuarios internos...');

  for (const userData of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(userData.password, 12);

    await prisma.user.upsert({
      where: {
        tenantId_email: { tenantId: TENANT_ID, email: userData.email },
      },
      update: { password: passwordHash, isActive: true },
      create: {
        tenantId: TENANT_ID,
        roleId: roleIds[userData.role],
        email: userData.email,
        password: passwordHash,
        role: userData.role,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: true,
      },
    });
    console.log(`   ✓ ${userData.email} (${userData.role})`);
  }

  // ─── 3. Propiedades ───────────────────────────────────────────────────────
  console.log('\n🏠 Creando propiedades...');

  const propertyIds = [];

  for (const propData of DEMO_PROPERTIES) {
    const property = await prisma.property.upsert({
      where: {
        id: `prop-${propData.propertyType.toLowerCase()}-001`,
      },
      update: {},
      create: {
        id: `prop-${propData.propertyType.toLowerCase()}-001`,
        tenantId: TENANT_ID,
        name: propData.name,
        propertyType: propData.propertyType,
        address: propData.address,
        description: propData.description,
      },
    });
    propertyIds.push({ ...property, ...propData });
    console.log(`   ✓ ${propData.name}`);
  }

  // ─── 4. Torre (Opcional) ──────────────────────────────────────────────────
  console.log('\n🏗️  Creando torre...');

  const tower = await prisma.tower.upsert({
    where: { id: 'tower-a-001' },
    update: {},
    create: {
      id: 'tower-a-001',
      tenantId: TENANT_ID,
      propertyId: propertyIds[0].id,
      name: 'Torre A',
      floorsCount: 15,
    },
  });
  console.log(`   ✓ ${tower.name}`);

  // ─── 5. Unidades ──────────────────────────────────────────────────────────
  console.log('\n🚪 Creando unidades...');

  const unitIds = [];

  for (let i = 0; i < DEMO_UNITS.length; i++) {
    const unitData = DEMO_UNITS[i];
    const unitId = `unit-${unitData.identifier.toLowerCase().replace('-', '')}`;

    // Apartamentos y parqueaderos van a la Torre A, casa va a la propiedad 2
    const propertyId = i < 12 ? propertyIds[0].id : propertyIds[1].id;
    const towerId = i < 12 ? tower.id : null;

    const unit = await prisma.unit.upsert({
      where: { id: unitId },
      update: {},
      create: {
        id: unitId,
        tenantId: TENANT_ID,
        propertyId,
        towerId,
        identifier: unitData.identifier,
        unitType: unitData.unitType,
        floor: unitData.floor,
        status: i < 3 ? 'OCCUPIED' : 'AVAILABLE', // Primeras 3 ocupadas
        monthlyFeeAmount: unitData.monthlyFeeAmount,
      },
    });
    unitIds.push({ ...unit, ...unitData });
    console.log(`   ✓ ${unitData.identifier} (${unitData.unitType})`);
  }

  // ─── 6. Residentes ────────────────────────────────────────────────────────
  console.log('\n🧑‍🤝‍🧑 Creando residentes...');

  const residentIds = [];

  for (const resData of DEMO_RESIDENTS) {
    const resident = await prisma.resident.upsert({
      where: {
        tenantId_documentNumber: {
          tenantId: TENANT_ID,
          documentNumber: resData.documentNumber,
        },
      },
      update: {},
      create: {
        tenantId: TENANT_ID,
        firstName: resData.firstName,
        lastName: resData.lastName,
        documentType: resData.documentType,
        documentNumber: resData.documentNumber,
        email: resData.email,
        phone: resData.phone,
      },
    });
    residentIds.push({ ...resident, ...resData });
    console.log(`   ✓ ${resData.firstName} ${resData.lastName}`);
  }

  // ─── 7. Ocupaciones ───────────────────────────────────────────────────────
  console.log('\n📋 Creando ocupaciones...');

  const occupancyData = [
    { unitIndex: 0, residentIndex: 0, type: 'OWNER', startDate: new Date('2024-01-15') },
    { unitIndex: 1, residentIndex: 1, type: 'TENANT', startDate: new Date('2024-06-01') },
    { unitIndex: 2, residentIndex: 2, type: 'OWNER', startDate: new Date('2023-03-10') },
  ];

  for (let i = 0; i < occupancyData.length; i++) {
    const occ = occupancyData[i];
    const occupancyId = `occ-${i + 1}`;

    await prisma.occupancy.upsert({
      where: { id: occupancyId },
      update: {},
      create: {
        id: occupancyId,
        tenantId: TENANT_ID,
        unitId: unitIds[occ.unitIndex].id,
        residentId: residentIds[occ.residentIndex].id,
        type: occ.type,
        startDate: occ.startDate,
      },
    });
    console.log(`   ✓ ${residentIds[occ.residentIndex].firstName} → ${unitIds[occ.unitIndex].identifier}`);
  }

  // ─── 8. Cuotas del Mes Actual ─────────────────────────────────────────────
  console.log('\n💰 Creando cuotas...');

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  for (let i = 0; i < 5; i++) {
    const feeId = `fee-${unitIds[i].identifier.toLowerCase().replace('-', '')}-${currentPeriod}`;

    await prisma.fee.upsert({
      where: { id: feeId },
      update: {},
      create: {
        id: feeId,
        tenantId: TENANT_ID,
        unitId: unitIds[i].id,
        type: 'PERIODIC',
        amount: unitIds[i].monthlyFeeAmount,
        period: currentPeriod,
        status: i < 2 ? 'PAID' : 'PENDING',
        dueDate: new Date(now.getFullYear(), now.getMonth(), 10),
        description: `Cuota mensual ${currentPeriod}`,
      },
    });
    console.log(`   ✓ ${unitIds[i].identifier}: $${unitIds[i].monthlyFeeAmount} (${i < 2 ? 'PAGADO' : 'PENDIENTE'})`);
  }

  // ─── 9. Solicitudes de Mantenimiento ──────────────────────────────────────
  console.log('\n🔧 Creando solicitudes de mantenimiento...');

  const maintenanceData = [
    {
      id: 'maint-001',
      unitId: unitIds[0].id,
      title: 'Filtración en baño principal',
      description: 'Se reporta filtración de agua en el baño principal del apartamento A-101 desde hace 3 días.',
      status: 'PENDING',
    },
    {
      id: 'maint-002',
      unitId: unitIds[2].id,
      title: 'Puerta de entrada no cierra bien',
      description: 'La puerta principal del apartamento A-201 no encaja correctamente en el marco.',
      status: 'IN_PROGRESS',
      assignedTo: 'Juan Técnico',
    },
  ];

  for (const maint of maintenanceData) {
    await prisma.maintenanceRequest.upsert({
      where: { id: maint.id },
      update: {},
      create: {
        tenantId: TENANT_ID,
        unitId: maint.unitId,
        title: maint.title,
        description: maint.description,
        status: maint.status,
        assignedTo: maint.assignedTo || null,
      },
    });
    console.log(`   ✓ ${maint.title}`);
  }

  // ─── 10. Visitantes ───────────────────────────────────────────────────────
  console.log('\n🚪 Registrando visitantes...');

  const visitorData = [
    { id: 'visitor-001', unitId: unitIds[0].id, visitorName: 'María Rodríguez', documentNumber: '87654321', notes: 'Visita familiar', entryDate: new Date() },
    { id: 'visitor-002', unitId: unitIds[1].id, visitorName: 'Pedro Gómez', documentNumber: '12345678', notes: 'Reparación lavadora', entryDate: new Date() },
    { id: 'visitor-003', unitId: unitIds[2].id, visitorName: 'Carlos Díaz', documentNumber: '11112222', notes: 'Entrega paquete', entryDate: new Date() },
  ];

  for (const vis of visitorData) {
    await prisma.visitor.upsert({
      where: { id: vis.id },
      update: {},
      create: {
        tenantId: TENANT_ID,
        unitId: vis.unitId,
        visitorName: vis.visitorName,
        documentNumber: vis.documentNumber,
        notes: vis.notes,
        entryDate: vis.entryDate,
        registeredBy: 'porter@laspalmas.com',
      },
    });
    console.log(`   ✓ ${vis.visitorName} → Unidad`);
  }

  // ─── 11. Anuncios ─────────────────────────────────────────────────────────
  console.log('\n📢 Creando anuncios...');

  for (let i = 0; i < DEMO_ANNOUNCEMENTS.length; i++) {
    const ann = DEMO_ANNOUNCEMENTS[i];
    const annId = `ann-${i + 1}`;

    await prisma.announcement.upsert({
      where: { id: annId },
      update: {},
      create: {
        id: annId,
        tenantId: TENANT_ID,
        title: ann.title,
        body: ann.body,
        targetRoles: ann.targetRoles,
        createdBy: 'admin@laspalmas.com',
      },
    });
    console.log(`   ✓ ${ann.title}`);
  }

  // ─── 12. Configuración del Website ────────────────────────────────────────
  console.log('\n🎨 Creando configuración del website...');

  await prisma.websiteConfig.upsert({
    where: { tenantId: TENANT_ID },
    update: {
      primaryColor: '#1E40AF',
      secondaryColor: '#10B981',
    },
    create: {
      tenantId: TENANT_ID,
      primaryColor: '#1E40AF',
      secondaryColor: '#10B981',
      sections: {
        hero: {
          title: 'Conjunto Residencial Las Palmas',
          subtitle: 'Tu hogar ideal en el corazón de Bogotá',
        },
        about: {
          title: 'Sobre Nosotros',
          content: 'Un conjunto residencial de primer nivel con los mejores servicios para tu familia.',
        },
        contact: {
          phone: '+57 300 123 4567',
          email: 'info@laspalmas.com',
          address: 'Carrera 15 #80-45, Bogotá',
        },
      },
    },
  });
  console.log('   ✓ Website config creada');

  // ─── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n✅ Seed de DEMOSTRACIÓN completado.');
  console.log('─────────────────────────────────────────');
  console.log(`   Tenant:          ${DEMO_TENANT.name}`);
  console.log(`   Usuarios:        ${DEMO_USERS.length}`);
  console.log(`   Propiedades:     ${DEMO_PROPERTIES.length}`);
  console.log(`   Unidades:        ${DEMO_UNITS.length}`);
  console.log(`   Residentes:      ${DEMO_RESIDENTS.length}`);
  console.log(`   Ocupaciones:     ${occupancyData.length}`);
  console.log(`   Cuotas:          5`);
  console.log(`   Mantenimientos:  ${maintenanceData.length}`);
  console.log(`   Visitantes:      ${visitorData.length}`);
  console.log(`   Anuncios:        ${DEMO_ANNOUNCEMENTS.length}`);
  console.log('─────────────────────────────────────────');
  console.log('\n🔑 Credenciales de acceso:');
  console.log('   AdminTenant:  admin@laspalmas.com / Admin_2026!');
  console.log('   Portero:      porteria@laspalmas.com / Portero_2026!');
  console.log('');
}

main()
  .catch((error) => {
    console.error('❌ Error en seed de demostración:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
