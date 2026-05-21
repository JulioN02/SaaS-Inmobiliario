import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { FindAllAuditDto } from './dto/find-all-audit.dto';
import { AuditResponseDto } from './dto/audit-response.dto';
import { AuditAction, AuditEntity, Prisma, UserRole } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    filters: FindAllAuditDto,
    tenantId: string,
    userRole: UserRole,
  ): Promise<{
    data: AuditResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, entity, entityId, action, startDate, endDate } = filters;

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    // SUPER_ADMIN bypasses tenant filter - sees ALL logs
    // ADMIN_TENANT only sees their tenant's logs
    if (userRole !== UserRole.SUPER_ADMIN) {
      where.tenantId = tenantId;
    }

    // Apply filters
    if (entity) {
      where.entity = entity;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    if (action) {
      where.action = action;
    }

    // Date range filter
    if (startDate || endDate) {
      where.timestamp = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    // Execute query with pagination
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          tenant: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // Fetch user info for each log
    const userIds = [...new Set(data.map((log) => log.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const formattedData: AuditResponseDto[] = data.map((log) => {
      const user = userMap.get(log.userId);
      return {
        id: log.id,
        tenantId: log.tenantId,
        userId: log.userId,
        userInfo: {
          firstName: user?.firstName ?? null,
          lastName: user?.lastName ?? null,
          email: user?.email ?? 'unknown',
        },
        entity: log.entity as AuditEntity,
        entityId: log.entityId,
        action: log.action as AuditAction,
        snapshot: log.snapshot as Record<string, unknown> | null,
        ipAddress: log.ipAddress,
        createdAt: log.timestamp,
      };
    });

    return {
      data: formattedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, tenantId: string, userRole: UserRole): Promise<AuditResponseDto> {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        tenant: {
          select: { id: true, name: true },
        },
      },
    });

    if (!log) {
      throw new NotFoundException(`Log de auditoría ${id} no encontrado`);
    }

    // SUPER_ADMIN can see any log
    // ADMIN_TENANT can only see logs from their tenant
    if (userRole !== UserRole.SUPER_ADMIN && log.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes permiso para ver este log');
    }

    // Fetch user info
    const user = await this.prisma.user.findUnique({
      where: { id: log.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    return {
      id: log.id,
      tenantId: log.tenantId,
      userId: log.userId,
      userInfo: {
        firstName: user?.firstName ?? null,
        lastName: user?.lastName ?? null,
        email: user?.email ?? 'unknown',
      },
      entity: log.entity as AuditEntity,
      entityId: log.entityId,
      action: log.action as AuditAction,
      snapshot: log.snapshot as Record<string, unknown> | null,
      ipAddress: log.ipAddress,
      createdAt: log.timestamp,
    };
  }
}
