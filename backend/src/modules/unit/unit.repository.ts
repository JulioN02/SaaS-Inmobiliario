import { prisma } from '../../config/database';
import { UnitType, UnitStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export type CreateUnitInput = {
  identifier: string;
  unitType: UnitType;
  floor?: number;
  monthlyFeeAmount?: Decimal | number;
  towerId?: string;
};

export type UpdateUnitInput = Partial<Omit<CreateUnitInput, 'identifier'>>;

export type UnitListFilters = {
  tenantId: string;
  propertyId?: string;
  towerId?: string;
  status?: UnitStatus;
  page?: number;
  limit?: number;
};

export const unitRepository = {
  findAll: async (filters: UnitListFilters) => {
    const { tenantId, propertyId, towerId, status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...(propertyId && { propertyId }),
      ...(towerId && { towerId }),
      ...(status && { status })
    };

    const [total, data] = await Promise.all([
      prisma.unit.count({ where }),
      prisma.unit.findMany({
        where,
        orderBy: [{ propertyId: 'asc' }, { identifier: 'asc' }],
        skip,
        take: limit
      })
    ]);

    return { data, total, page, limit };
  },

  findById: (id: string, tenantId: string) =>
    prisma.unit.findFirst({ where: { id, tenantId, deletedAt: null } }),

  hasActiveOccupancy: async (id: string) => {
    const count = await prisma.occupancy.count({ where: { unitId: id, endDate: null } });
    return count > 0;
  },

  setStatus: (id: string, status: UnitStatus) =>
    prisma.unit.update({ where: { id }, data: { status } }),

  create: (tenantId: string, propertyId: string, data: CreateUnitInput) =>
    prisma.unit.create({ data: { ...data, tenantId, propertyId } }),

  update: (id: string, data: UpdateUnitInput) =>
    prisma.unit.update({ where: { id }, data }),

  softDelete: (id: string) =>
    prisma.unit.update({ where: { id }, data: { deletedAt: new Date() } })
};
