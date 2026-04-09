import { prisma } from '../../config/database';
import { TenantStatus, TenantPlan } from '@prisma/client';

export type CreateTenantInput = {
  name: string;
  subdomain: string;
  plan?: TenantPlan;
  contactEmail?: string;
  contactPhone?: string;
  adminEmail: string;
  adminPassword: string;
};

export type UpdateTenantInput = Partial<Omit<CreateTenantInput, 'subdomain'>> & { status?: TenantStatus };

export type TenantListFilters = {
  status?: TenantStatus;
  plan?: TenantPlan;
  page?: number;
  limit?: number;
};

export const tenantRepository = {
  findAll: async (filters: TenantListFilters) => {
    const { status, plan, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      deletedAt: null,
      ...(status && { status }),
      ...(plan && { plan })
    };

    const [total, data] = await Promise.all([
      prisma.tenant.count({ where }),
      prisma.tenant.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    return { data, total, page, limit };
  },

  findById: (id: string) => {
    return prisma.tenant.findUnique({
      where: { id, deletedAt: null }
    });
  },

  findBySubdomain: (subdomain: string) => {
    return prisma.tenant.findUnique({
      where: { subdomain }
    });
  },

  countUsers: (tenantId: string) => {
    return prisma.user.count({
      where: { tenantId, deletedAt: null, isActive: true }
    });
  },

  countProperties: (tenantId: string) => {
    return prisma.property.count({
      where: { tenantId, deletedAt: null }
    });
  },

  create: (data: CreateTenantInput) => {
    const { adminEmail, adminPassword, ...tenantData } = data;
    return prisma.tenant.create({ data: tenantData });
  },

  update: (id: string, data: UpdateTenantInput) => {
    return prisma.tenant.update({ where: { id }, data });
  },

  softDelete: (id: string) => {
    return prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }
};
