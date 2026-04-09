import { prisma } from '../../config/database';
import { AuditAction, AuditEntity, Prisma } from '@prisma/client';

type AuditLogInput = {
  tenantId: string;
  userId: string;
  entity: AuditEntity;
  entityId: string;
  action: AuditAction;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
};

export const auditService = {
  log: async (input: AuditLogInput): Promise<void> => {
    await prisma.auditLog.create({
      data: {
        tenantId: input.tenantId,
        userId: input.userId,
        entity: input.entity,
        entityId: input.entityId,
        action: input.action,
        snapshot: input.before || input.after
          ? ({ before: input.before ?? null, after: input.after ?? null } as Prisma.JsonObject)
          : undefined,
        ipAddress: input.ipAddress ?? null
      }
    });
  }
};
