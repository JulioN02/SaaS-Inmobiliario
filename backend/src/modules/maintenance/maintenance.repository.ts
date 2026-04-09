import { prisma } from '../../config/database';
import { Prisma, MaintenanceStatus } from '@prisma/client';

export type CreateMaintenanceInput = {
  unitId: string;
  title: string;
  description?: string;
};

export type UpdateMaintenanceInput = {
  status?: MaintenanceStatus;
  assignedTo?: string;
  description?: string;
};

export type MaintenanceFilters = {
  tenantId: string;
  unitId?: string;
  status?: MaintenanceStatus;
  page?: number;
  limit?: number;
};

export const maintenanceRepository = {
  findAll: async (filters: MaintenanceFilters) => {
    const { tenantId, unitId, status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.MaintenanceRequestWhereInput = {
      tenantId,
      ...(unitId && { unitId }),
      ...(status && { status })
    };

    const [total, data] = await Promise.all([
      prisma.maintenanceRequest.count({ where }),
      prisma.maintenanceRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return { data, total, page, limit };
  },

  findById: (id: string, tenantId: string) =>
    prisma.maintenanceRequest.findFirst({
      where: { id, tenantId }
    }),

  create: (data: CreateMaintenanceInput & { tenantId: string }) =>
    prisma.maintenanceRequest.create({
      data: {
        ...data,
        status: 'PENDING'
      }
    }),

  update: (id: string, data: UpdateMaintenanceInput) =>
    prisma.maintenanceRequest.update({
      where: { id },
      data: {
        ...data,
        ...(data.status === 'RESOLVED' && { resolvedAt: new Date() })
      }
    })
};
