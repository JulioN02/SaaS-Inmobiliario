import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import {
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  FindAllMaintenanceDto,
  MaintenanceResponseDto,
} from './dto';
import { AuditAction, AuditEntity, MaintenanceStatus, Prisma } from '@prisma/client';

interface CallerCtx {
  userId: string;
  tenantId: string;
  ipAddress?: string;
}

// State machine transitions
const VALID_TRANSITIONS: Record<MaintenanceStatus, MaintenanceStatus[]> = {
  [MaintenanceStatus.PENDING]: [MaintenanceStatus.IN_PROGRESS, MaintenanceStatus.CANCELLED],
  [MaintenanceStatus.IN_PROGRESS]: [MaintenanceStatus.RESOLVED, MaintenanceStatus.CANCELLED],
  [MaintenanceStatus.RESOLVED]: [],
  [MaintenanceStatus.CANCELLED]: [],
};

@Injectable()
export class MaintenanceService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(tenantId: string, filters: FindAllMaintenanceDto) {
    const { page = 1, limit = 20, unitId, status } = filters;

    const where: Prisma.MaintenanceRequestWhereInput = {
      tenantId,
      ...(unitId && { unitId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.maintenanceRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          unit: {
            select: {
              identifier: true,
              tower: {
                select: {
                  name: true,
                },
              },
            },
          },

        },
      }),
      this.prisma.maintenanceRequest.count({ where }),
    ]);

    // Transform data to include unit info in flat structure
    const transformedData = data.map((maintenance) => ({
      id: maintenance.id,
      tenantId: maintenance.tenantId,
      unitId: maintenance.unitId,
      title: maintenance.title,
      description: maintenance.description,
      status: maintenance.status,
      assignedTo: maintenance.assignedTo,
      resolvedAt: maintenance.resolvedAt,
      createdBy: maintenance.createdBy,
      createdAt: maintenance.createdAt,
      updatedAt: maintenance.updatedAt,
      unitNumber: maintenance.unit?.identifier || null,
      towerName: maintenance.unit?.tower?.name || null,
    }));

    return {
      data: transformedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(tenantId: string, id: string) {
    const maintenance = await this.prisma.maintenanceRequest.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        unit: {
          select: {
            identifier: true,
            tower: {
              select: {
                name: true,
              },
            },
          },
        },
        createdByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!maintenance) {
      throw new NotFoundException(`Solicitud de mantenimiento ${id} no encontrada`);
    }

    return {
      id: maintenance.id,
      tenantId: maintenance.tenantId,
      unitId: maintenance.unitId,
      title: maintenance.title,
      description: maintenance.description,
      status: maintenance.status,
      assignedTo: maintenance.assignedTo,
      resolvedAt: maintenance.resolvedAt,
      createdBy: maintenance.createdBy,
      createdAt: maintenance.createdAt,
      updatedAt: maintenance.updatedAt,
      unitNumber: maintenance.unit?.identifier || null,
      towerName: maintenance.unit?.tower?.name || null,
    };
  }

  async create(tenantId: string, dto: CreateMaintenanceDto, ctx: CallerCtx) {
    // Validate unit exists and belongs to tenant
    const unit = await this.prisma.unit.findFirst({
      where: {
        id: dto.unitId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!unit) {
      throw new NotFoundException(
        `Unidad ${dto.unitId} no encontrada o no pertenece al tenant`,
      );
    }

    const maintenance = await this.prisma.maintenanceRequest.create({
      data: {
        tenantId,
        unitId: dto.unitId,
        title: dto.title,
        description: dto.description,
        status: MaintenanceStatus.PENDING,
        createdBy: ctx.userId, // From JWT, NOT from frontend
      },
      select: this.maintenanceSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.maintenance,
      entityId: maintenance.id,
      action: AuditAction.CREATE,
      snapshot: {
        title: maintenance.title,
        description: maintenance.description,
        unitId: maintenance.unitId,
        status: maintenance.status,
      },
      ipAddress: ctx.ipAddress,
    });

    return {
      ...maintenance,
      createdBy: maintenance.createdBy,
      resolvedAt: maintenance.resolvedAt,
      unitNumber: unit.identifier,
      towerName: null,
    };
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateMaintenanceDto,
    ctx: CallerCtx,
  ) {
    const maintenance = await this.prisma.maintenanceRequest.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!maintenance) {
      throw new NotFoundException(`Solicitud de mantenimiento ${id} no encontrada`);
    }

    // Validate state machine transition
    const currentStatus = maintenance.status;
    const newStatus = dto.status;

    if (newStatus && newStatus !== currentStatus) {
      const allowedTransitions = VALID_TRANSITIONS[currentStatus];
      if (!allowedTransitions.includes(newStatus)) {
        throw new BadRequestException(
          `Transición de estado inválida: ${currentStatus} → ${newStatus}. Estado actual es inmutable o transición no permitida.`,
        );
      }
    }

    // Prepare update data
    const updateData: Prisma.MaintenanceRequestUpdateInput = {};

    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }

    if (dto.assignedTo !== undefined) {
      updateData.assignedTo = dto.assignedTo;
    }

    // If resolving, set resolvedAt
    if (dto.status === MaintenanceStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    }

    const updated = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        unit: {
          select: {
            identifier: true,
            tower: {
              select: {
                name: true,
              },
            },
          },
        },
        createdByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.maintenance,
      entityId: id,
      action: AuditAction.STATUS_CHANGE,
      snapshot: {
        before: { status: currentStatus, assignedTo: maintenance.assignedTo },
        after: { status: dto.status, assignedTo: dto.assignedTo },
      },
      ipAddress: ctx.ipAddress,
    });

    return {
      id: updated.id,
      tenantId: updated.tenantId,
      unitId: updated.unitId,
      title: updated.title,
      description: updated.description,
      status: updated.status,
      assignedTo: updated.assignedTo,
      resolvedAt: updated.resolvedAt,
      createdBy: updated.createdBy,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      unitNumber: updated.unit?.identifier || null,
      towerName: updated.unit?.tower?.name || null,
    };
  }

  private maintenanceSelect() {
    return {
      id: true,
      tenantId: true,
      unitId: true,
      title: true,
      description: true,
      status: true,
      assignedTo: true,
      resolvedAt: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}