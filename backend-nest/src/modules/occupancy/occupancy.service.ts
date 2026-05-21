import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  MethodNotAllowedException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import {
  CreateOccupancyDto,
  CloseOccupancyDto,
  FindAllOccupanciesDto,
  OccupancyResponseDto,
} from './dto';
import { AuditAction, AuditEntity, Prisma, UnitStatus, OccupancyType } from '@prisma/client';

interface CallerCtx {
  userId: string;
  tenantId: string;
  ipAddress?: string;
}

@Injectable()
export class OccupancyService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(tenantId: string, filters: FindAllOccupanciesDto) {
    const { page = 1, limit = 10, unitId, residentId, type, active } = filters;

    const where: Prisma.OccupancyWhereInput = {
      tenantId,
      ...(unitId && { unitId }),
      ...(residentId && { residentId }),
      ...(type && { type }),
      ...(active !== undefined && (active ? { endDate: null } : { endDate: { not: null } })),
    };

    const [data, total] = await Promise.all([
      this.prisma.occupancy.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.occupancySelect(),
      }),
      this.prisma.occupancy.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(tenantId: string, id: string) {
    const occupancy = await this.prisma.occupancy.findFirst({
      where: {
        id,
        tenantId,
      },
      select: this.occupancySelect(),
    });

    if (!occupancy) {
      throw new NotFoundException(`Ocupación ${id} no encontrada`);
    }

    return occupancy;
  }

  async create(tenantId: string, dto: CreateOccupancyDto, ctx: CallerCtx) {
    // Validate unit exists and belongs to tenant
    const unit = await this.prisma.unit.findFirst({
      where: {
        id: dto.unitId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!unit) {
      throw new NotFoundException(`Unidad ${dto.unitId} no encontrada o no pertenece al tenant`);
    }

    // Validate resident exists and belongs to tenant
    const resident = await this.prisma.resident.findFirst({
      where: {
        id: dto.residentId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!resident) {
      throw new NotFoundException(
        `Residente ${dto.residentId} no encontrado o no pertenece al tenant`,
      );
    }

    // Check NO overlapping: same unit + same resident + both active
    const activeOccupancy = await this.prisma.occupancy.findFirst({
      where: {
        tenantId,
        unitId: dto.unitId,
        residentId: dto.residentId,
        endDate: null,
      },
    });

    if (activeOccupancy) {
      throw new ConflictException(
        'El residente ya tiene una ocupación activa en esta unidad',
      );
    }

    // Create occupancy
    const occupancy = await this.prisma.occupancy.create({
      data: {
        tenantId,
        unitId: dto.unitId,
        residentId: dto.residentId,
        type: dto.type as OccupancyType,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        notes: dto.notes,
        documents: dto.documents ? dto.documents as unknown as Prisma.InputJsonValue : Prisma.JsonNull,
      },
      select: this.occupancySelect(),
    });

    // Update unit status to OCCUPIED
    await this.prisma.unit.update({
      where: { id: dto.unitId },
      data: { status: UnitStatus.OCCUPIED, updatedAt: new Date() },
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.occupancy,
      entityId: occupancy.id,
      action: AuditAction.CREATE,
      snapshot: {
        unitId: occupancy.unitId,
        residentId: occupancy.residentId,
        type: occupancy.type,
        startDate: occupancy.startDate,
        unitStatusAfter: 'OCCUPIED',
      },
      ipAddress: ctx.ipAddress,
    });

    return occupancy;
  }

  async close(tenantId: string, id: string, dto: CloseOccupancyDto, ctx: CallerCtx) {
    const occupancy = await this.findById(tenantId, id);

    // Check if already closed
    if (occupancy.endDate) {
      throw new BadRequestException('La ocupación ya está cerrada');
    }

    // Update with endDate
    const updated = await this.prisma.occupancy.update({
      where: { id },
      data: {
        endDate: new Date(dto.endDate),
        updatedAt: new Date(),
      },
      select: this.occupancySelect(),
    });

    // Check if there are other active occupancies on this unit
    const activeCount = await this.prisma.occupancy.count({
      where: {
        unitId: occupancy.unitId,
        tenantId,
        endDate: null,
      },
    });

    // If no other active occupancies, set unit back to AVAILABLE
    if (activeCount === 0) {
      await this.prisma.unit.update({
        where: { id: occupancy.unitId },
        data: { status: UnitStatus.AVAILABLE, updatedAt: new Date() },
      });
    }

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.occupancy,
      entityId: id,
      action: AuditAction.STATUS_CHANGE,
      snapshot: {
        before: { endDate: null },
        after: { endDate: updated.endDate },
        unitStatusAfter: activeCount === 0 ? 'AVAILABLE' : 'OCCUPIED (still has other occupancies)',
      },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }

  private occupancySelect() {
    return {
      id: true,
      tenantId: true,
      unitId: true,
      residentId: true,
      type: true,
      startDate: true,
      endDate: true,
      notes: true,
      documents: true,
      createdAt: true,
      updatedAt: true,
      unit: {
        select: {
          id: true,
          identifier: true,
          status: true,
          property: {
            select: {
              name: true,
            },
          },
          tower: {
            select: {
              name: true,
            },
          },
        },
      },
      resident: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          documentNumber: true,
          email: true,
          phone: true,
        },
      },
    };
  }
}