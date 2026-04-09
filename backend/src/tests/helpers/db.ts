import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Reset database by truncating tables in cascade.
 * This uses TRUNCATE ... RESTART IDENTITY CASCADE which is fast
 * and avoids FK ordering issues. Adjust list if you add/remove tables.
 */
export async function resetDatabase() {
  const tables = [
    'audit_logs',
    'fee_status_history',
    'fees',
    'maintenance_requests',
    'visitors',
    'announcements',
    'website_configs',
    'occupancies',
    'residents',
    'units',
    'towers',
    'properties',
    'users',
    'role_permissions',
    'permissions',
    'roles',
    'tenants'
  ];

  const sql = `TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE;`;
  await prisma.$executeRawUnsafe(sql);
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}

export { prisma };
