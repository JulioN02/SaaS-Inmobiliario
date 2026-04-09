import { prisma } from '../../config/database';

export const metricsRepository = {
  getGlobalMetrics: async () => {
    const [
      tenantsActive,
      tenantsSuspended,
      totalUnits,
      totalActiveUsers,
      basicCount,
      premiumCount,
      enterpriseCount
    ] = await Promise.all([
      prisma.tenant.count({ where: { status: 'ACTIVE' } }),
      prisma.tenant.count({ where: { status: 'SUSPENDED' } }),
      prisma.unit.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.tenant.count({ where: { plan: 'BASIC' } }),
      prisma.tenant.count({ where: { plan: 'PREMIUM' } }),
      prisma.tenant.count({ where: { plan: 'ENTERPRISE' } }),
    ]);

    return {
      tenantsActive,
      tenantsSuspended,
      totalUnits,
      totalActiveUsers,
      byPlan: {
        basic: basicCount,
        premium: premiumCount,
        enterprise: enterpriseCount,
      },
      generatedAt: new Date(),
    };
  }
};
