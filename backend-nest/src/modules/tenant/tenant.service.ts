import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import { CreateTenantDto, UpdateTenantDto, FindAllTenantsDto, CreateTenantResponseDto } from './dto';
import { TenantStatus, Prisma, AuditAction, AuditEntity } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

interface CallerCtx {
  userId: string;
  ipAddress?: string;
}

@Injectable()
export class TenantService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(filters: FindAllTenantsDto) {
    const { status, planId, page = 1, limit = 10 } = filters;

    const where: Prisma.TenantWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(planId && { planId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: { select: { id: true, name: true, slug: true, limits: true } },
        },
      }),
      this.prisma.tenant.count({ where }),
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
    const tenant = await this.prisma.tenant.findUnique({
      where: { id, deletedAt: null },
      include: {
        plan: { select: { id: true, name: true, slug: true, limits: true } },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${id} no encontrado`);
    }

    return tenant;
  }

  async create(dto: CreateTenantDto, ctx: CallerCtx): Promise<CreateTenantResponseDto> {
    // ── 1. Validar subdominio único ──────────────────────────────────────
    const existing = await this.prisma.tenant.findUnique({
      where: { subdomain: dto.subdomain },
    });

    if (existing) {
      throw new ConflictException(`El subdominio '${dto.subdomain}' ya está en uso`);
    }

    // ── 2. Validar planId existe ──────────────────────────────────────────
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan ${dto.planId} no encontrado`);
    }

    // ── 3. Obtener rol AdminTenant ──────────────────────────────────────
    const adminRole = await this.prisma.role.findUnique({
      where: { name: 'ADMIN_TENANT' },
    });

    if (!adminRole) {
      throw new NotFoundException('El rol ADMIN_TENANT no existe. Ejecuta el seed primero.');
    }

    const adminEmail = dto.contactEmail || `admin@${dto.subdomain}.com`;
    const adminPassword = crypto.randomBytes(4).toString('hex'); // 8 chars
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // ── 4. Crear tenant + adminUser + websiteConfig + subscription + billingConfig en transacción ──
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      // 4a. Crear tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          subdomain: dto.subdomain,
          planId: dto.planId,
          status: dto.status || TenantStatus.ACTIVE,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone,
        },
      });

      // 4b. Crear usuario AdminTenant
      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          roleId: adminRole.id,
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN_TENANT' as any,
          firstName: 'Admin',
          lastName: dto.name,
          isActive: true,
        },
      });

      // 4c. Crear WebsiteConfig por defecto
      await tx.websiteConfig.create({
        data: {
          tenantId: tenant.id,
          siteTitle: dto.name,
          welcomeMessage: `Bienvenido al portal de ${dto.name}`,
          isPublic: true,
          isMaintenanceMode: false,
        },
      });

      // 4d. Crear Subscription con trial de 14 días
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          planId: dto.planId,
          status: 'TRIALING' as any,
          periodStart,
          periodEnd,
          trialEndsAt,
        },
      });

      // 4e. Crear BillingConfig con defaults
      await tx.billingConfig.create({
        data: {
          tenantId: tenant.id,
          billingCycle: 'MONTHLY' as any,
          currency: 'COP',
          gracePeriodDays: 5,
        },
      });

      return { tenant, adminUser };
    });

    // ── 5. Auditoría ────────────────────────────────────────────────────
    await this.auditService.log({
      tenantId: result.tenant.id,
      userId: ctx.userId,
      entity: AuditEntity.tenant,
      entityId: result.tenant.id,
      action: AuditAction.CREATE,
      snapshot: {
        name: result.tenant.name,
        subdomain: result.tenant.subdomain,
        planId: result.tenant.planId,
        adminEmail,
      },
      ipAddress: ctx.ipAddress,
    });

    return {
      id: result.tenant.id,
      name: result.tenant.name,
      subdomain: result.tenant.subdomain,
      planId: result.tenant.planId,
      status: result.tenant.status,
      contactEmail: result.tenant.contactEmail,
      contactPhone: result.tenant.contactPhone,
      createdAt: result.tenant.createdAt,
      updatedAt: result.tenant.updatedAt,
      adminEmail,
      adminPassword,
    };
  }

  async update(id: string, dto: UpdateTenantDto, ctx: CallerCtx) {
    const tenant = await this.findById(id); // Verifica que existe

    // Si cambia el subdominio, validar que no exista
    if (dto.subdomain) {
      const existing = await this.prisma.tenant.findUnique({
        where: { subdomain: dto.subdomain },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`El subdominio '${dto.subdomain}' ya está en uso`);
      }
    }

    // If planId is being changed, validate it exists
    if (dto.planId) {
      const plan = await this.prisma.plan.findUnique({
        where: { id: dto.planId },
      });

      if (!plan) {
        throw new NotFoundException(`Plan ${dto.planId} no encontrado`);
      }
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
      include: {
        plan: { select: { id: true, name: true, slug: true, limits: true } },
      },
    });

    // Auditoría
    await this.auditService.log({
      tenantId: id,
      userId: ctx.userId,
      entity: AuditEntity.tenant,
      entityId: id,
      action: AuditAction.UPDATE,
      snapshot: {
        before: {
          name: tenant.name,
          subdomain: tenant.subdomain,
          planId: tenant.planId,
          contactEmail: tenant.contactEmail,
        },
        after: {
          name: updated.name,
          subdomain: updated.subdomain,
          planId: updated.planId,
          contactEmail: updated.contactEmail,
        },
      },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }

  async suspend(id: string, ctx: CallerCtx) {
    const tenant = await this.findById(id);

    if (tenant.status === TenantStatus.SUSPENDED) {
      throw new ConflictException('El tenant ya está suspendido');
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.SUSPENDED },
      include: {
        plan: { select: { id: true, name: true, slug: true, limits: true } },
      },
    });

    // Auditoría
    await this.auditService.log({
      tenantId: id,
      userId: ctx.userId,
      entity: AuditEntity.tenant,
      entityId: id,
      action: AuditAction.SUSPEND,
      snapshot: {
        previousStatus: tenant.status,
        newStatus: TenantStatus.SUSPENDED,
      },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }

  async activate(id: string, ctx: CallerCtx) {
    const tenant = await this.findById(id);

    if (tenant.status === TenantStatus.ACTIVE) {
      throw new ConflictException('El tenant ya está activo');
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { status: TenantStatus.ACTIVE },
      include: {
        plan: { select: { id: true, name: true, slug: true, limits: true } },
      },
    });

    // Auditoría
    await this.auditService.log({
      tenantId: id,
      userId: ctx.userId,
      entity: AuditEntity.tenant,
      entityId: id,
      action: AuditAction.ACTIVATE,
      snapshot: {
        previousStatus: tenant.status,
        newStatus: TenantStatus.ACTIVE,
      },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }

  async changePlan(id: string, planId: string, ctx: CallerCtx) {
    const tenant = await this.findById(id);

    if (tenant.planId === planId) {
      throw new ConflictException(`El tenant ya tiene el plan asignado`);
    }

    // Validate target plan exists and read its limits
    const targetPlan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });

    if (!targetPlan) {
      throw new NotFoundException(`Plan ${planId} no encontrado`);
    }

    const newLimits = targetPlan.limits as { properties: number; users: number; units: number };

    // Verificar límites antes de hacer downgrade
    const [currentUsers, currentProperties] = await Promise.all([
      this.prisma.user.count({
        where: { tenantId: id, deletedAt: null },
      }),
      this.prisma.property.count({
        where: { tenantId: id, deletedAt: null },
      }),
    ]);

    if (currentUsers > this.parseLimit(newLimits.users)) {
      throw new ForbiddenException(
        `No se puede cambiar de plan: el tenant tiene ${currentUsers} usuarios pero el plan permite ${newLimits.users}`,
      );
    }

    if (currentProperties > this.parseLimit(newLimits.properties)) {
      throw new ForbiddenException(
        `No se puede cambiar de plan: el tenant tiene ${currentProperties} propiedades pero el plan permite ${newLimits.properties}`,
      );
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { planId },
      include: {
        plan: { select: { id: true, name: true, slug: true, limits: true } },
      },
    });

    // Auditoría
    await this.auditService.log({
      tenantId: id,
      userId: ctx.userId,
      entity: AuditEntity.tenant,
      entityId: id,
      action: AuditAction.UPDATE,
      snapshot: {
        before: { planId: tenant.planId, planName: tenant.plan.name },
        after: { planId: updated.planId, planName: updated.plan.name },
      },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }

  async remove(id: string, ctx: CallerCtx) {
    const tenant = await this.findById(id);

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date() },
      include: {
        plan: { select: { id: true, name: true, slug: true, limits: true } },
      },
    });

    // Auditoría
    await this.auditService.log({
      tenantId: id,
      userId: ctx.userId,
      entity: AuditEntity.tenant,
      entityId: id,
      action: AuditAction.DELETE,
      snapshot: {
        name: tenant.name,
        subdomain: tenant.subdomain,
        planId: tenant.planId,
      },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }

  private parseLimit(value: number): number {
    return value === -1 ? Infinity : value;
  }
}
