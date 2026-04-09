import { prisma } from '../../config/database';
import { PropertyType } from '@prisma/client';

export type CreatePropertyInput = {
  name: string;
  propertyType: PropertyType;
  address?: string;
  description?: string;
};

export type UpdatePropertyInput = Partial<CreatePropertyInput>;

export type PropertyListFilters = {
  tenantId: string;
  propertyType?: PropertyType;
  page?: number;
  limit?: number;
};

export const propertyRepository = {
  findAll: async (filters: PropertyListFilters) => {
    const { tenantId, propertyType, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...(propertyType && { propertyType })
    };

    const [total, data] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { towers: true, units: true } }
        }
      })
    ]);

    return { data, total, page, limit };
  },

  findById: (id: string, tenantId: string) =>
    prisma.property.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { _count: { select: { towers: true, units: true } } }
    }),

  countActive: (tenantId: string) =>
    prisma.property.count({ where: { tenantId, deletedAt: null } }),

  hasUnits: async (id: string) => {
    const count = await prisma.unit.count({ where: { propertyId: id, deletedAt: null } });
    return count > 0;
  },

  create: (tenantId: string, data: CreatePropertyInput) =>
    prisma.property.create({ data: { ...data, tenantId } }),

  update: (id: string, data: UpdatePropertyInput) =>
    prisma.property.update({ where: { id }, data }),

  softDelete: (id: string) =>
    prisma.property.update({ where: { id }, data: { deletedAt: new Date() } })
};
