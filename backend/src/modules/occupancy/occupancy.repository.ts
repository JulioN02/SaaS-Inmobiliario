import { prisma } from '../../config/database';
import { OccupancyType } from '@prisma/client';

export type CreateOccupancyInput = {
  unitId: string;
  residentId: string;
  type: OccupancyType;
  startDate: Date | string;
  notes?: string;
};

export type OccupancyListFilters = {
  tenantId: string;
  unitId?: string;
  residentId?: string;
  active?: boolean;     // true → endDate IS NULL
  page?: number;
  limit?: number;
};

export const occupancyRepository = {
  findAll: async (filters: OccupancyListFilters) => {
    const { tenantId, unitId, residentId, active, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(unitId && { unitId }),
      ...(residentId && { residentId }),
      // active=true → endDate IS NULL; active=false → endDate IS NOT NULL
      ...(active === true  && { endDate: null }),
      ...(active === false && { NOT: { endDate: null } })
    };

    const [total, data] = await Promise.all([
      prisma.occupancy.count({ where }),
      prisma.occupancy.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
        include: {
          unit:     { select: { identifier: true, status: true } },
          resident: { select: { firstName: true, lastName: true, documentNumber: true } }
        }
      })
    ]);

    return { data, total, page, limit };
  },

  findById: (id: string, tenantId: string) =>
    prisma.occupancy.findFirst({
      where: { id, tenantId },
      include: {
        unit:     { select: { identifier: true, status: true } },
        resident: { select: { firstName: true, lastName: true } }
      }
    }),

  findActiveByUnit: (unitId: string) =>
    prisma.occupancy.findFirst({ where: { unitId, endDate: null } }),

  create: (tenantId: string, data: CreateOccupancyInput) =>
    prisma.occupancy.create({
      data: {
        ...data,
        tenantId,
        startDate: new Date(data.startDate)
      }
    }),

  close: (id: string, data: { endDate: Date; notes?: string }) =>
    prisma.occupancy.update({ where: { id }, data })
};
