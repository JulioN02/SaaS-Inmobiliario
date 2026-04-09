// =============================================================================
// prisma/seed.js
// SaaS Inmobiliario — Datos iniciales del sistema
//
// Ejecutar: npx prisma db seed
// Configura en package.json:
//   "prisma": { "seed": "node prisma/seed.js" }
//
// Qué crea este seed:
//   1. 4 Roles base del sistema
//   2. Permissions por recurso y acción
//   3. RolePermissions — matriz de acceso por rol
//   4. SUPER_ADMIN inicial (credenciales desde .env)
// =============================================================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// =============================================================================
// ROLES
// =============================================================================

const ROLES = [
  {
    name: 'SUPER_ADMIN',
    description:
      'Acceso global a la plataforma. Crear y suspender tenants, ver métricas, gestionar planes.',
  },
  {
    name: 'ADMIN_TENANT',
    description:
      'Control total sobre su tenant. Gestión de usuarios internos, propiedades, configuración.',
  },
  {
    name: 'ADMINISTRATIVA',
    description:
      'Gestión de residentes, registro manual de cuotas, solicitudes de mantenimiento, anuncios.',
  },
  {
    name: 'PORTERIA',
    description:
      'Registro de visitantes y lectura de anuncios. Sin acceso a datos financieros ni residentes.',
  },
];

// =============================================================================
// RECURSOS Y ACCIONES
// =============================================================================

const RESOURCES = [
  'tenants',
  'users',
  'roles',
  'properties',
  'towers',
  'units',
  'residents',
  'occupancies',
  'fees',
  'maintenance',
  'visitors',
  'announcements',
  'website',
  'audit',
  'metrics',
];

const ACTIONS = ['read', 'create', 'update', 'delete'];

// =============================================================================
// MATRIZ RBAC
// Define qué acciones tiene cada rol sobre cada recurso.
// =============================================================================

const ROLE_MATRIX = {

  // SUPER_ADMIN — opera la plataforma, no opera dentro de tenants
  SUPER_ADMIN: {
    tenants:  ['read', 'create', 'update', 'delete'],
    users:    ['read', 'create', 'update', 'delete'],
    roles:    ['read'],
    audit:    ['read'],
    metrics:  ['read'],
  },

  // ADMIN_TENANT — control total sobre su propio tenant
  ADMIN_TENANT: {
    users:         ['read', 'create', 'update', 'delete'],
    roles:         ['read'],
    properties:    ['read', 'create', 'update', 'delete'],
    towers:        ['read', 'create', 'update', 'delete'],
    units:         ['read', 'create', 'update', 'delete'],
    residents:     ['read', 'create', 'update', 'delete'],
    occupancies:   ['read', 'create', 'update'],
    fees:          ['read', 'create', 'update', 'delete'],
    maintenance:   ['read', 'create', 'update', 'delete'],
    visitors:      ['read', 'create', 'update'],
    announcements: ['read', 'create', 'update', 'delete'],
    website:       ['read', 'update'],
    audit:         ['read'],
  },

  // ADMINISTRATIVA — gestión operativa diaria, sin acceso a usuarios ni auditoría
  ADMINISTRATIVA: {
    properties:    ['read'],
    towers:        ['read'],
    units:         ['read', 'update'],
    residents:     ['read', 'create', 'update'],
    occupancies:   ['read', 'create', 'update'],
    fees:          ['read', 'create', 'update'],
    maintenance:   ['read', 'create', 'update'],
    visitors:      ['read'],
    announcements: ['read', 'create', 'update'],
    website:       ['read'],
  },

  // PORTERIA — acceso mínimo: visitantes + lectura de anuncios
  PORTERIA: {
    visitors:      ['read', 'create', 'update'],
    announcements: ['read'],
    units:         ['read'],
  },
};

// =============================================================================
// HELPERS
// =============================================================================

function permissionKey(resource, action) {
  return `${resource}:${action}`;
}

function getSuperAdminCredentials() {
  const email    = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      '❌  SUPER_ADMIN_EMAIL y SUPER_ADMIN_PASSWORD son requeridos en .env'
    );
  }

  return { email, password };
}

// =============================================================================
// SEED PRINCIPAL
// Orden: Roles → Permissions → RolePermissions → SuperAdmin
// Idempotente — re-ejecutable sin duplicados (upsert en todo)
// =============================================================================

async function main() {
  console.log('🌱 Iniciando seed...\n');

  // ─── 1. Roles ──────────────────────────────────────────────────────────────
  console.log('📋 Creando roles...');

  const roleMap = {};

  for (const roleData of ROLES) {
    const role = await prisma.role.upsert({
      where:  { name: roleData.name },
      update: { description: roleData.description },
      create: { name: roleData.name, description: roleData.description },
    });

    roleMap[roleData.name] = role.id;
    console.log(`   ✓ ${roleData.name} (${role.id})`);
  }

  // ─── 2. Permissions ────────────────────────────────────────────────────────
  console.log('\n🔑 Creando permisos...');

  const permMap = {};

  for (const resource of RESOURCES) {
    for (const action of ACTIONS) {
      const perm = await prisma.permission.upsert({
        where:  { resource_action: { resource, action } },
        update: {},
        create: { resource, action },
      });

      permMap[permissionKey(resource, action)] = perm.id;
    }
  }

  const totalPerms = RESOURCES.length * ACTIONS.length;
  console.log(`   ✓ ${totalPerms} permisos (${RESOURCES.length} recursos × ${ACTIONS.length} acciones)`);

  // ─── 3. RolePermissions ────────────────────────────────────────────────────
  console.log('\n🔗 Asignando permisos a roles...');

  for (const [roleName, matrix] of Object.entries(ROLE_MATRIX)) {
    const roleId = roleMap[roleName];
    let count = 0;

    for (const [resource, actions] of Object.entries(matrix)) {
      for (const action of actions) {
        const permId = permMap[permissionKey(resource, action)];

        if (!permId) {
          console.warn(`   ⚠  Permiso no encontrado: ${resource}:${action} — omitido`);
          continue;
        }

        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId, permissionId: permId },
          },
          update: {},
          create: { roleId, permissionId: permId },
        });

        count++;
      }
    }

    console.log(`   ✓ ${roleName}: ${count} permisos asignados`);
  }

  // ─── 4. SUPER_ADMIN inicial ────────────────────────────────────────────────
  console.log('\n👤 Creando SUPER_ADMIN...');

  const { email, password } = getSuperAdminCredentials();
  const passwordHash = await bcrypt.hash(password, 12);
  const superAdminRoleId = roleMap['SUPER_ADMIN'];

  // Tenant fantasma de plataforma — satisface el FK sin pertenecer a ningún cliente
  // El TenantMiddleware debe saltar la validación de tenant cuando role === SUPER_ADMIN
  const PLATFORM_TENANT_ID = '00000000-0000-0000-0000-000000000000';

  await prisma.tenant.upsert({
    where:  { id: PLATFORM_TENANT_ID },
    update: {},
    create: {
      id:        PLATFORM_TENANT_ID,
      name:      'PLATFORM',
      subdomain: 'platform',
      plan:      'ENTERPRISE',
      status:    'ACTIVE',
    },
  });

  const superAdmin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: PLATFORM_TENANT_ID,
        email,
      },
    },
    update: {
      password: passwordHash,
      isActive: true,
    },
    create: {
      tenantId:  PLATFORM_TENANT_ID,
      roleId:    superAdminRoleId,
      email,
      password:  passwordHash,
      role:      'SUPER_ADMIN',
      firstName: 'Super',
      lastName:  'Admin',
      isActive:  true,
    },
  });

  console.log(`   ✓ ${superAdmin.email} (${superAdmin.id})`);

  // ─── Resumen ───────────────────────────────────────────────────────────────
  const assignedCount = Object.values(ROLE_MATRIX).reduce((total, matrix) => {
    return total + Object.values(matrix).reduce((s, actions) => s + actions.length, 0);
  }, 0);

  console.log('\n✅ Seed completado.');
  console.log('─────────────────────────────────────────');
  console.log(`   Roles:      ${ROLES.length}`);
  console.log(`   Permisos:   ${totalPerms}`);
  console.log(`   Asignados:  ${assignedCount}`);
  console.log(`   SuperAdmin: ${superAdmin.email}`);
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((error) => {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });