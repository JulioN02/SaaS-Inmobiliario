import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import {
  CreateUnitDto,
  UpdateUnitDto,
  FindAllUnitsDto,
  UnitResponseDto,
} from './dto';
import { AuditAction, AuditEntity, Prisma, UnitStatus } from '@prisma/client';

interface CallerCtx {
  userId: string;
  tenantId: string;
  ipAddress?: string;
}

@Injectable()
export class UnitService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(tenantId: string, filters: FindAllUnitsDto) {
    const { propertyId, towerId, status, page = 1, limit = 10 } = filters;

    const where: Prisma.UnitWhereInput = {
      tenantId,
      deletedAt: null,
      ...(propertyId && { propertyId }),
      ...(towerId && { towerId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.unit.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.unitSelect(),
      }),
      this.prisma.unit.count({ where }),
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
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: this.unitSelect(),
    });

    if (!unit) {
      throw new NotFoundException(`Unidad ${id} no encontrada`);
    }

    return unit;
  }

  async create(tenantId: string, dto: CreateUnitDto, ctx: CallerCtx) {
    // Validate property belongs to tenant
    await this.validatePropertyTenant(dto.propertyId, tenantId);

    // If towerId provided, validate tower belongs to property and tenant
    if (dto.towerId) {
      await this.validateTowerPropertyTenant(dto.towerId, dto.propertyId, tenantId);
    }

    // Check unique identifier per property
    await this.validateUniqueIdentifier(dto.propertyId, dto.identifier);

    const unit = await this.prisma.unit.create({
      data: {
        tenantId,
        propertyId: dto.propertyId,
        towerId: dto.towerId,
        identifier: dto.identifier,
        unitType: dto.unitType,
        floor: dto.floor,
        status: UnitStatus.AVAILABLE,
        monthlyFeeAmount: dto.monthlyFeeAmount,
      },
      select: this.unitSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.unit,
      entityId: unit.id,
      action: AuditAction.CREATE,
      snapshot: {
        identifier: unit.identifier,
        unitType: unit.unitType,
        propertyId: unit.propertyId,
        towerId: unit.towerId,
        status: unit.status,
      },
      ipAddress: ctx.ipAddress,
    });

    return unit;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateUnitDto,
    ctx: CallerCtx,
  ) {
    const unit = await this.findById(tenantId, id);

    // If propertyId is being changed, validate new property belongs to tenant
    if (dto.propertyId && dto.propertyId !== unit.propertyId) {
      await this.validatePropertyTenant(dto.propertyId, tenantId);
    }

    // If towerId is being changed, validate tower belongs to property and tenant
    if (dto.towerId && dto.towerId !== unit.towerId) {
      const propertyId = dto.propertyId || unit.propertyId;
      await this.validateTowerPropertyTenant(dto.towerId, propertyId, tenantId);
    }

    // If identifier is being changed, check uniqueness within property
    if (dto.identifier && dto.identifier !== unit.identifier) {
      const propertyId = dto.propertyId || unit.propertyId;
      await this.validateUniqueIdentifier(propertyId, dto.identifier, id);
    }

    const data: any = {
      updatedAt: new Date(),
    };
    if (dto.propertyId !== undefined) data.propertyId = dto.propertyId;
    if (dto.towerId !== undefined) data.towerId = dto.towerId;
    if (dto.identifier !== undefined) data.identifier = dto.identifier;
    if (dto.unitType !== undefined) data.unitType = dto.unitType;
    if (dto.floor !== undefined) data.floor = dto.floor;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.monthlyFeeAmount !== undefined) data.monthlyFeeAmount = dto.monthlyFeeAmount;
    if (dto.isPublished !== undefined) data.isPublished = dto.isPublished;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;

    const updated = await this.prisma.unit.update({
      where: { id },
      data,
      select: this.unitSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.unit,
      entityId: id,
      action: AuditAction.UPDATE,
      snapshot: {
        before: {
          identifier: unit.identifier,
          unitType: unit.unitType,
          propertyId: unit.propertyId,
          towerId: unit.towerId,
          status: unit.status,
        },
        after: {
          identifier: updated.identifier,
          unitType: updated.unitType,
          propertyId: updated.propertyId,
          towerId: updated.towerId,
          status: updated.status,
        },
      },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }

  async softDelete(tenantId: string, id: string, ctx: CallerCtx) {
    const unit = await this.findById(tenantId, id);

    // Check for active occupancy
    const activeOccupancyCount = await this.prisma.occupancy.count({
      where: {
        unitId: id,
        tenantId,
        endDate: null,
      },
    });

    if (activeOccupancyCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar una unidad con ocupación activa',
      );
    }

    const deleted = await this.prisma.unit.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
      select: this.unitSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.unit,
      entityId: id,
      action: AuditAction.DELETE,
      snapshot: {
        identifier: unit.identifier,
        unitType: unit.unitType,
        propertyId: unit.propertyId,
        towerId: unit.towerId,
      },
      ipAddress: ctx.ipAddress,
    });

    return deleted;
  }

  private async validatePropertyTenant(propertyId: string, tenantId: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!property) {
      throw new NotFoundException(
        `Propiedad ${propertyId} no encontrada o no pertenece al tenant`,
      );
    }
  }

  private async validateTowerPropertyTenant(
    towerId: string,
    propertyId: string,
    tenantId: string,
  ) {
    const tower = await this.prisma.tower.findFirst({
      where: {
        id: towerId,
        tenantId,
        propertyId,
        deletedAt: null,
      },
    });

    if (!tower) {
      throw new NotFoundException(
        `Torre ${towerId} no encontrada o no pertenece a la propiedad ${propertyId}`,
      );
    }
  }

  private async validateUniqueIdentifier(
    propertyId: string,
    identifier: string,
    excludeUnitId?: string,
  ) {
    const where: Prisma.UnitWhereInput = {
      propertyId,
      identifier,
      deletedAt: null,
    };

    if (excludeUnitId) {
      where.id = { not: excludeUnitId };
    }

    const existing = await this.prisma.unit.findFirst({ where });

    if (existing) {
      throw new ConflictException(
        `La unidad con identificador '${identifier}' ya existe en esta propiedad`,
      );
    }
  }

  private unitSelect() {
    return {
      id: true,
      tenantId: true,
      propertyId: true,
      towerId: true,
      identifier: true,
      unitType: true,
      floor: true,
      status: true,
      monthlyFeeAmount: true,
      isPublished: true,
      imageUrl: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    };
  }
}