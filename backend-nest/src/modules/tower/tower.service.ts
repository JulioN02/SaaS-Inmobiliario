import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import {
  CreateTowerDto,
  UpdateTowerDto,
  FindAllTowersDto,
  TowerResponseDto,
} from './dto';
import { AuditAction, AuditEntity, Prisma } from '@prisma/client';

interface CallerCtx {
  userId: string;
  tenantId: string;
  ipAddress?: string;
}

@Injectable()
export class TowerService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(tenantId: string, filters: FindAllTowersDto) {
    const { propertyId, page = 1, limit = 10 } = filters;

    // Validate property belongs to tenant
    await this.validatePropertyTenant(propertyId, tenantId);

    const where: Prisma.TowerWhereInput = {
      tenantId,
      propertyId,
      deletedAt: null,
    };

    const [data, total] = await Promise.all([
      this.prisma.tower.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.towerSelect(),
      }),
      this.prisma.tower.count({ where }),
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
    const tower = await this.prisma.tower.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: this.towerSelect(),
    });

    if (!tower) {
      throw new NotFoundException(`Torre ${id} no encontrada`);
    }

    return tower;
  }

  async create(tenantId: string, dto: CreateTowerDto, ctx: CallerCtx) {
    // Validate property exists and belongs to tenant
    await this.validatePropertyTenant(dto.propertyId, tenantId);

    const tower = await this.prisma.tower.create({
      data: {
        tenantId,
        propertyId: dto.propertyId,
        name: dto.name,
        floorsCount: dto.floorsCount,
      },
      select: this.towerSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.tower,
      entityId: tower.id,
      action: AuditAction.CREATE,
      snapshot: {
        name: tower.name,
        floorsCount: tower.floorsCount,
        propertyId: tower.propertyId,
      },
      ipAddress: ctx.ipAddress,
    });

    return tower;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateTowerDto,
    ctx: CallerCtx,
  ) {
    const tower = await this.findById(tenantId, id);

    // If propertyId is being changed, validate new property belongs to tenant
    if (dto.propertyId && dto.propertyId !== tower.propertyId) {
      await this.validatePropertyTenant(dto.propertyId, tenantId);
    }

    const updated = await this.prisma.tower.update({
      where: { id },
      data: {
        name: dto.name,
        floorsCount: dto.floorsCount,
        propertyId: dto.propertyId,
        updatedAt: new Date(),
      },
      select: this.towerSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.tower,
      entityId: id,
      action: AuditAction.UPDATE,
      snapshot: {
        before: {
          name: tower.name,
          floorsCount: tower.floorsCount,
          propertyId: tower.propertyId,
        },
        after: {
          name: updated.name,
          floorsCount: updated.floorsCount,
          propertyId: updated.propertyId,
        },
      },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }

  async softDelete(tenantId: string, id: string, ctx: CallerCtx) {
    const tower = await this.findById(tenantId, id);

    const deleted = await this.prisma.tower.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
      select: this.towerSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.tower,
      entityId: id,
      action: AuditAction.DELETE,
      snapshot: {
        name: tower.name,
        floorsCount: tower.floorsCount,
        propertyId: tower.propertyId,
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

  private towerSelect() {
    return {
      id: true,
      tenantId: true,
      propertyId: true,
      name: true,
      floorsCount: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    };
  }
}