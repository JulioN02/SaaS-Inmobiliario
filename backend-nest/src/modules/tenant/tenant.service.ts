import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import { CreateTenantDto, UpdateTenantDto, FindAllTenantsDto, CreateTenantResponseDto } from './dto';
import { TenantPlan, TenantStatus, UserRole, Prisma, AuditAction, AuditEntity } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// Plan limits — enforced in Service
const PLAN_LIMITS: Record<TenantPlan, { properties: number; users: number }> = {
  BASIC: { properties: 1, users: 5 },
  PREMIUM: { properties: 10, users: 15 },
  ENTERPRISE: { properties: Infinity, users: Infinity },
};

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
    const { status, plan, page = 1, limit = 10 } = filters;

    const where: Prisma.TenantWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(plan && { plan }),
    };

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
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

    // ── 2. Crear tenant ──────────────────────────────────────────────────
    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        subdomain: dto.subdomain,
        plan: dto.plan || TenantPlan.BASIC,
        status: dto.status || TenantStatus.ACTIVE,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
      },
    });

    // ── 3. Crear usuario AdminTenant automáticamente ─────────────────────
    const adminRole = await this.prisma.role.findUnique({
      where: { name: 'ADMIN_TENANT' },
    });

    if (!adminRole) {
      throw new NotFoundException('El rol ADMIN_TENANT no existe. Ejecuta el seed primero.');
    }

    const adminEmail = dto.contactEmail || `admin@${dto.subdomain}.com`;
    const adminPassword = crypto.randomBytes(4).toString('hex'); // 8 chars
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        roleId: adminRole.id,
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.ADMIN_TENANT,
        firstName: 'Admin',
        lastName: dto.name,
        isActive: true,
      },
    });

    // ── 4. Crear WebsiteConfig por defecto ───────────────────────────────
    await this.prisma.websiteConfig.create({
      data: {
        tenantId: tenant.id,
        siteTitle: dto.name,
        welcomeMessage: `Bienvenido al portal de ${dto.name}`,
        isPublic: true,
        isMaintenanceMode: false,
      },
    });

    // ── 5. Auditoría ────────────────────────────────────────────────────
    await this.auditService.log({
      tenantId: tenant.id,
      userId: ctx.userId,
      entity: AuditEntity.tenant,
      entityId: tenant.id,
      action: AuditAction.CREATE,
      snapshot: {
        name: tenant.name,
        subdomain: tenant.subdomain,
        plan: tenant.plan,
        adminEmail,
      },
      ipAddress: ctx.ipAddress,
    });

    return {
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain,
      plan: tenant.plan,
      status: tenant.status,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
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

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
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
          plan: tenant.plan,
          contactEmail: tenant.contactEmail,
        },
        after: {
          name: updated.name,
          subdomain: updated.subdomain,
          plan: updated.plan,
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

  async changePlan(id: string, plan: TenantPlan, ctx: CallerCtx) {
    const tenant = await this.findById(id);

    if (tenant.plan === plan) {
      throw new ConflictException(`El tenant ya tiene el plan ${plan}`);
    }

    const newLimits = PLAN_LIMITS[plan];

    // Verificar límites antes de hacer downgrade
    const [currentUsers, currentProperties] = await Promise.all([
      this.prisma.user.count({
        where: { tenantId: id, deletedAt: null },
      }),
      this.prisma.property.count({
        where: { tenantId: id, deletedAt: null },
      }),
    ]);

    if (currentUsers > newLimits.users) {
      throw new ForbiddenException(
        `No se puede hacer downgrade: el tenant tiene ${currentUsers} usuarios pero el plan '${plan}' permite ${newLimits.users}`,
      );
    }

    if (currentProperties > newLimits.properties) {
      throw new ForbiddenException(
        `No se puede hacer downgrade: el tenant tiene ${currentProperties} propiedades pero el plan '${plan}' permite ${newLimits.properties}`,
      );
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: { plan },
    });

    // Auditoría
    await this.auditService.log({
      tenantId: id,
      userId: ctx.userId,
      entity: AuditEntity.tenant,
      entityId: id,
      action: AuditAction.UPDATE,
      snapshot: {
        before: { plan: tenant.plan },
        after: { plan: updated.plan },
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
        plan: tenant.plan,
      },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }
}
