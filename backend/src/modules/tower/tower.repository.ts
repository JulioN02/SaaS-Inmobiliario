import { prisma } from '../../config/database';

export type CreateTowerInput = {
  name: string;
  floorsCount?: number;
};

export type UpdateTowerInput = Partial<CreateTowerInput>;

export type TowerListFilters = {
  tenantId: string;
  propertyId: string;
  page?: number;
  limit?: number;
};

export const towerRepository = {
  findAll: async (filters: TowerListFilters) => {
    const { tenantId, propertyId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = { tenantId, propertyId, deletedAt: null };

    const [total, data] = await Promise.all([
      prisma.tower.count({ where }),
      prisma.tower.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: { _count: { select: { units: true } } }
      })
    ]);

    return { data, total, page, limit };
  },

  findById: (id: string, tenantId: string) =>
    prisma.tower.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { _count: { select: { units: true } } }
    }),

  hasActiveUnits: async (id: string) => {
    const count = await prisma.unit.count({ where: { towerId: id, deletedAt: null } });
    return count > 0;
  },

  create: (tenantId: string, propertyId: string, data: CreateTowerInput) =>
    prisma.tower.create({ data: { ...data, tenantId, propertyId } }),

  update: (id: string, data: UpdateTowerInput) =>
    prisma.tower.update({ where: { id }, data }),

  softDelete: (id: string) =>
    prisma.tower.update({ where: { id }, data: { deletedAt: new Date() } })
};
