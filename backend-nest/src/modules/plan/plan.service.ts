import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import { CreatePlanDto, UpdatePlanDto, FindAllPlansDto } from './dto';
import { AuditAction, AuditEntity, Prisma } from '@prisma/client';

interface CallerCtx {
  userId: string;
  tenantId: string;
  ipAddress?: string;
}

@Injectable()
export class PlanService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(filters: FindAllPlansDto) {
    const { isActive, page = 1, limit = 10 } = filters;

    const where: Prisma.PlanWhereInput = {
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
    };

    const [data, total] = await Promise.all([
      this.prisma.plan.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.plan.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id, deletedAt: null },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${id} no encontrado`);
    }

    return plan;
  }

  async findActive() {
    return this.prisma.plan.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(dto: CreatePlanDto, ctx: CallerCtx) {
    // Validate slug uniqueness
    const existing = await this.prisma.plan.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`El slug '${dto.slug}' ya está en uso`);
    }

    const plan = await this.prisma.plan.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        limits: dto.limits as unknown as Prisma.InputJsonValue,
        prices: dto.prices as unknown as Prisma.InputJsonValue,
        features: (dto.features ?? []) as unknown as Prisma.InputJsonValue,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });

    // Audit log
    await this.auditService.log({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      entity: AuditEntity.plan,
      entityId: plan.id,
      action: AuditAction.CREATE,
      snapshot: {
        name: plan.name,
        slug: plan.slug,
        limits: plan.limits,
        prices: plan.prices,
      },
      ipAddress: ctx.ipAddress,
    });

    return plan;
  }

  async update(id: string, dto: UpdatePlanDto, ctx: CallerCtx) {
    const plan = await this.findById(id);

    // If slug is being changed, validate uniqueness (exclude self)
    if (dto.slug && dto.slug !== plan.slug) {
      const existing = await this.prisma.plan.findUnique({
        where: { slug: dto.slug },
      });

      if (existing) {
        throw new ConflictException(`El slug '${dto.slug}' ya está en uso`);
      }
    }

    const updateData: Record<string, unknown> = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.slug !== undefined) updateData.slug = dto.slug;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.limits !== undefined) updateData.limits = dto.limits as unknown as Prisma.InputJsonValue;
    if (dto.prices !== undefined) updateData.prices = dto.prices as unknown as Prisma.InputJsonValue;
    if (dto.features !== undefined) updateData.features = dto.features as unknown as Prisma.InputJsonValue;
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;

    const updated = await this.prisma.plan.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    await this.auditService.log({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      entity: AuditEntity.plan,
      entityId: id,
      action: AuditAction.UPDATE,
      snapshot: {
        before: { name: plan.name, slug: plan.slug },
        after: { name: updated.name, slug: updated.slug },
      },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }

  /**
   * Count active tenants using this plan via the FK relation.
   */
  private async countActiveTenantsForSlug(slug: string): Promise<number> {
    const plan = await this.prisma.plan.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!plan) return 0;

    return this.prisma.tenant.count({
      where: {
        planId: plan.id,
        deletedAt: null,
        status: 'ACTIVE' as any,
      },
    });
  }

  async remove(id: string, ctx: CallerCtx) {
    const plan = await this.findById(id);

    // BLOCK if any active tenant references this plan
    const activeTenantsCount = await this.countActiveTenantsForSlug(plan.slug);

    if (activeTenantsCount > 0) {
      throw new ForbiddenException(
        `No se puede eliminar el plan '${plan.name}': ${activeTenantsCount} tenant(s) activo(s) lo están usando`,
      );
    }

    // Soft delete
    const deleted = await this.prisma.plan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Audit log
    await this.auditService.log({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      entity: AuditEntity.plan,
      entityId: id,
      action: AuditAction.DELETE,
      snapshot: { name: plan.name, slug: plan.slug },
      ipAddress: ctx.ipAddress,
    });

    return deleted;
  }

  async toggleActive(id: string, ctx: CallerCtx) {
    const plan = await this.findById(id);
    const newActiveState = !plan.isActive;

    // Guard: if deactivating, check active tenants
    if (!newActiveState) {
      const activeTenantsCount = await this.countActiveTenantsForSlug(plan.slug);

      if (activeTenantsCount > 0) {
        throw new ForbiddenException(
          `No se puede desactivar el plan '${plan.name}': ${activeTenantsCount} tenant(s) activo(s) lo están usando`,
        );
      }
    }

    const updated = await this.prisma.plan.update({
      where: { id },
      data: { isActive: newActiveState },
    });

    // Audit log
    await this.auditService.log({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      entity: AuditEntity.plan,
      entityId: id,
      action: AuditAction.STATUS_CHANGE,
      snapshot: {
        before: { isActive: plan.isActive },
        after: { isActive: updated.isActive },
      },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }
}
