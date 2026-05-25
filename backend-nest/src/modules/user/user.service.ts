import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import {
  CreateUserDto,
  UpdateUserDto,
  FindAllUsersDto,
  UserResponseDto,
} from './dto';
import { AuditAction, AuditEntity, Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

interface CallerCtx {
  userId: string;
  tenantId: string;
  ipAddress?: string;
}

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(tenantId: string, filters: FindAllUsersDto) {
    const { page = 1, limit = 10, isActive, role } = filters;

    const where: Prisma.UserWhereInput = {
      tenantId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(role && { role }),
    };

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.userSelect(),
      }),
      this.prisma.user.count({ where }),
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
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: {
        ...this.userSelect(),
        roleRef: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }

    return user;
  }

  async create(tenantId: string, dto: CreateUserDto, ctx: CallerCtx) {
    // Check email uniqueness within tenant
    const existing = await this.prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: dto.email,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `El email '${dto.email}' ya está en uso en este tenant`,
      );
    }

    // Plan limit validation
    await this.validatePlanLimit(tenantId);

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Get role to include in audit
    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new NotFoundException(`Rol ${dto.roleId} no encontrado`);
    }

    // Create user
    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        password: hashedPassword,
        roleId: dto.roleId,
        role: role.name,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      select: this.userSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.user,
      entityId: user.id,
      action: AuditAction.CREATE,
      snapshot: {
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ipAddress: ctx.ipAddress,
    });

    return user;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateUserDto,
    ctx: CallerCtx,
  ) {
    const user = await this.findById(tenantId, id);

    // If email is being changed, check uniqueness
    if (dto.email && dto.email !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId,
            email: dto.email,
          },
        },
      });

      if (existing) {
        throw new ConflictException(
          `El email '${dto.email}' ya está en uso en este tenant`,
        );
      }
    }

    // If role is being changed, get new role info
    let newRoleName: string | undefined;
    if (dto.roleId) {
      const newRole = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });

      if (!newRole) {
        throw new NotFoundException(`Rol ${dto.roleId} no encontrado`);
      }
      newRoleName = newRole.name;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        ...(newRoleName && { role: newRoleName as UserRole }),
        updatedAt: new Date(),
      },
      select: this.userSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.user,
      entityId: id,
      action: AuditAction.UPDATE,
      snapshot: {
        before: {
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        after: {
          email: updated.email,
          role: updated.role,
          firstName: updated.firstName,
          lastName: updated.lastName,
        },
      },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }

  async suspend(tenantId: string, id: string, ctx: CallerCtx) {
    const user = await this.findById(tenantId, id);

    if (!user.isActive) {
      throw new ConflictException('El usuario ya está suspendido');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
      select: this.userSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.user,
      entityId: id,
      action: AuditAction.SUSPEND,
      snapshot: {
        email: user.email,
        role: user.role,
      },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }

  async activate(tenantId: string, id: string, ctx: CallerCtx) {
    const user = await this.findById(tenantId, id);

    if (user.isActive) {
      throw new ConflictException('El usuario ya está activo');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isActive: true,
        updatedAt: new Date(),
      },
      select: this.userSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.user,
      entityId: id,
      action: AuditAction.ACTIVATE,
      snapshot: {
        email: user.email,
        role: user.role,
      },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }

  async assignRole(
    tenantId: string,
    id: string,
    roleId: string,
    ctx: CallerCtx,
  ) {
    const user = await this.findById(tenantId, id);

    // Verify role exists
    const newRole = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!newRole) {
      throw new NotFoundException(`Rol ${roleId} no encontrado`);
    }

    if (user.role === newRole.name) {
      throw new ConflictException(
        `El usuario ya tiene el rol '${newRole.name}'`,
      );
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        roleId,
        role: newRole.name,
        updatedAt: new Date(),
      },
      select: this.userSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.user,
      entityId: id,
      action: AuditAction.ROLE_CHANGE,
      snapshot: {
        email: user.email,
        previousRole: user.role,
        newRole: newRole.name,
      },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }

  private async validatePlanLimit(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { plan: { select: { limits: true } } },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} no encontrado`);
    }

    const limitValue = (tenant.plan.limits as any).users;
    const maxLimit = limitValue === -1 ? Infinity : limitValue;

    // No limit
    if (maxLimit === Infinity) {
      return;
    }

    const currentCount = await this.prisma.user.count({
      where: {
        tenantId,
        deletedAt: null,
      },
    });

    if (currentCount >= maxLimit) {
      throw new ForbiddenException(
        `Límite del plan excedido: máximo ${maxLimit} usuarios. Actualmente tiene ${currentCount}.`,
      );
    }
  }

  private userSelect() {
    return {
      id: true,
      tenantId: true,
      roleId: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    };
  }
}