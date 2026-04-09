import { prisma } from '../../config/database';
import { AuditAction, AuditEntity } from '@prisma/client';

export type AuditListFilters = {
  tenantId: string;
  entity?: AuditEntity;
  action?: AuditAction;
  userId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
};

export const auditRepository = {
  findAll: async (filters: AuditListFilters) => {
    const { tenantId, entity, action, userId, from, to, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      ...(entity && { entity }),
      ...(action && { action }),
      ...(userId && { userId }),
      ...(from || to
        ? {
            timestamp: {
              ...(from && { gte: from }),
              ...(to && { lte: to })
            }
          }
        : {})
    };

    const [total, data] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit
      })
    ]);

    return { data, total, page, limit };
  }
};
