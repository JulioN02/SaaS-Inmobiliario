import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  FindAllPropertiesDto,
  PropertyResponseDto,
} from './dto';
import { AuditAction, AuditEntity, Prisma } from '@prisma/client';
import { PLAN_LIMITS } from '../../shared/constants/plan-limits';

interface CallerCtx {
  userId: string;
  tenantId: string;
  ipAddress?: string;
}

@Injectable()
export class PropertyService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(tenantId: string, filters: FindAllPropertiesDto) {
    const { page = 1, limit = 10, propertyType } = filters;

    const where: Prisma.PropertyWhereInput = {
      tenantId,
      deletedAt: null,
      ...(propertyType && { propertyType }),
    };

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.propertySelect(),
      }),
      this.prisma.property.count({ where }),
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
    const property = await this.prisma.property.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: this.propertySelect(),
    });

    if (!property) {
      throw new NotFoundException(`Propiedad ${id} no encontrada`);
    }

    return property;
  }

  async create(tenantId: string, dto: CreatePropertyDto, ctx: CallerCtx) {
    // Plan limit validation
    await this.validatePlanLimit(tenantId);

    const property = await this.prisma.property.create({
      data: {
        tenantId,
        name: dto.name,
        address: dto.address,
        propertyType: dto.propertyType,
        description: dto.description,
      },
      select: this.propertySelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.property,
      entityId: property.id,
      action: AuditAction.CREATE,
      snapshot: {
        name: property.name,
        address: property.address,
        propertyType: property.propertyType,
        description: property.description,
      },
      ipAddress: ctx.ipAddress,
    });

    return property;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdatePropertyDto,
    ctx: CallerCtx,
  ) {
    const property = await this.findById(tenantId, id);

    const updated = await this.prisma.property.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address,
        propertyType: dto.propertyType,
        description: dto.description,
        updatedAt: new Date(),
      },
      select: this.propertySelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.property,
      entityId: id,
      action: AuditAction.UPDATE,
      snapshot: {
        before: {
          name: property.name,
          address: property.address,
          propertyType: property.propertyType,
          description: property.description,
        },
        after: {
          name: updated.name,
          address: updated.address,
          propertyType: updated.propertyType,
          description: updated.description,
        },
      },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }

  async softDelete(tenantId: string, id: string, ctx: CallerCtx) {
    const property = await this.findById(tenantId, id);

    // Check for active units
    const activeUnitsCount = await this.prisma.unit.count({
      where: {
        propertyId: id,
        tenantId,
        deletedAt: null,
      },
    });

    if (activeUnitsCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar una propiedad con unidades activas',
      );
    }

    const deleted = await this.prisma.property.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
      select: this.propertySelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.property,
      entityId: id,
      action: AuditAction.DELETE,
      snapshot: {
        name: property.name,
        address: property.address,
        propertyType: property.propertyType,
      },
      ipAddress: ctx.ipAddress,
    });

    return deleted;
  }

  private async validatePlanLimit(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} no encontrado`);
    }

    const limit = PLAN_LIMITS[tenant.plan].properties;

    // Enterprise has no limit
    if (limit === Infinity) {
      return;
    }

    const currentCount = await this.prisma.property.count({
      where: {
        tenantId,
        deletedAt: null,
      },
    });

    if (currentCount >= limit) {
      throw new ForbiddenException(
        `Plan ${tenant.plan} permite máximo ${limit} propiedades. Actualmente tiene ${currentCount}.`,
      );
    }
  }

  private propertySelect() {
    return {
      id: true,
      tenantId: true,
      name: true,
      address: true,
      propertyType: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    };
  }
}