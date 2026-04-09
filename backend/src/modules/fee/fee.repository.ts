import { prisma } from '../../config/database';
import { Prisma, FeeStatus, FeeType } from '@prisma/client';

export type CreateFeeInput = {
  unitId: string;
  type: FeeType;
  amount: number;
  period: string;
  dueDate?: Date;
  description?: string;
};

export type UpdateFeeStatusInput = {
  status: FeeStatus;
  paidAmount?: number;
  notes?: string;
};

export type FeeListFilters = {
  tenantId: string;
  unitId?: string;
  status?: FeeStatus;
  type?: FeeType;
  periodFrom?: string;
  periodTo?: string;
  page?: number;
  limit?: number;
};

export const feeRepository = {
  findAll: async (filters: FeeListFilters) => {
    const { tenantId, unitId, status, type, periodFrom, periodTo, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.FeeWhereInput = {
      tenantId,
      ...(unitId && { unitId }),
      ...(status && { status }),
      ...(type && { type }),
      ...(periodFrom || periodTo ? {
        period: {
          ...(periodFrom && { gte: periodFrom }),
          ...(periodTo && { lte: periodTo })
        }
      } : {})
    };

    const [total, data] = await Promise.all([
      prisma.fee.count({ where }),
      prisma.fee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { period: 'desc' }
      })
    ]);

    return { data, total, page, limit };
  },

  findById: (id: string, tenantId: string) =>
    prisma.fee.findFirst({
      where: { id, tenantId },
      include: {
        history: {
          orderBy: { changedAt: 'desc' }
        }
      }
    }),

  create: (data: CreateFeeInput & { tenantId: string }) =>
    prisma.fee.create({
      data: {
        ...data,
        status: 'PENDING'
      }
    })

  // Note: update status is handled directly in service via $transaction
};
