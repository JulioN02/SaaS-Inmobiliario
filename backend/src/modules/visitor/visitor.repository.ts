import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export type CreateVisitorInput = {
  unitId: string;
  visitorName: string;
  documentNumber?: string;
  entryDate: Date;
  notes?: string;
};

export type VisitorFilters = {
  tenantId: string;
  unitId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
};

export const visitorRepository = {
  findAll: async (filters: VisitorFilters) => {
    const { tenantId, unitId, dateFrom, dateTo, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.VisitorWhereInput = {
      tenantId,
      ...(unitId && { unitId }),
      ...(dateFrom || dateTo ? {
        entryDate: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo })
        }
      } : {})
    };

    const [total, data] = await Promise.all([
      prisma.visitor.count({ where }),
      prisma.visitor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { entryDate: 'desc' }
      })
    ]);

    return { data, total, page, limit };
  },

  findById: (id: string, tenantId: string) =>
    prisma.visitor.findFirst({
      where: { id, tenantId }
    }),

  create: (data: CreateVisitorInput & { tenantId: string; registeredBy: string }) =>
    prisma.visitor.create({
      data
    }),

  checkout: (id: string, exitDate: Date, notes?: string) =>
    prisma.visitor.update({
      where: { id },
      data: {
        exitDate,
        ...(notes && { notes })
      }
    })
};
