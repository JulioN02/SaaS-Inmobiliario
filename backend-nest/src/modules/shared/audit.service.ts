import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditAction, AuditEntity, Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    tenantId: string;
    userId: string;
    entity: AuditEntity;
    entityId: string;
    action: AuditAction;
    snapshot?: Record<string, unknown>;
    ipAddress?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        entity: data.entity,
        entityId: data.entityId,
        action: data.action,
        snapshot: (data.snapshot as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        ipAddress: data.ipAddress ?? null,
      },
    });
  }
}
