import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { AuditAction, AuditEntity, Permission, Role, RolePermission, Prisma } from '@prisma/client';

interface CallerCtx {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userRole?: string;
}

@Injectable()
export class RoleService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Rol ${id} no encontrado`);
    }

    return role;
  }

  async updatePermissions(roleId: string, permissionIds: string[], ctx: CallerCtx) {
    // Verify role exists
    const role = await this.findById(roleId);

    // Delete existing permissions for this role
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Create new permissions
    const newPermissions = await Promise.all(
      permissionIds.map(async (permissionId) => {
        return this.prisma.rolePermission.create({
          data: {
            roleId,
            permissionId,
          },
          include: {
            permission: true,
          },
        });
      }),
    );

    // Audit log
    await this.auditService.log({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      entity: AuditEntity.user, // Using 'user' as entity since 'role' not in enum
      entityId: roleId,
      action: AuditAction.ROLE_CHANGE,
      snapshot: {
        roleId,
        roleName: role.name,
        previousPermissionIds: role.permissions.map(p => p.permissionId),
        newPermissionIds: permissionIds,
      },
      ipAddress: ctx.ipAddress,
    });

    // Return updated role with permissions
    return this.findById(roleId);
  }

  // Additional CRUD methods (optional, for completeness)
  async create(dto: CreateRoleDto, ctx: CallerCtx) {
    // Check if role name already exists
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(`El rol '${dto.name}' ya existe`);
    }

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    // Audit log
    await this.auditService.log({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      entity: AuditEntity.user,
      entityId: role.id,
      action: AuditAction.CREATE,
      snapshot: { role },
      ipAddress: ctx.ipAddress,
    });

    return role;
  }

  async update(id: string, dto: UpdateRoleDto, ctx: CallerCtx) {
    await this.findById(id);

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    // Audit log
    await this.auditService.log({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      entity: AuditEntity.user,
      entityId: id,
      action: AuditAction.UPDATE,
      snapshot: { before: await this.prisma.role.findUnique({ where: { id } }), after: updated },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }

  async removeUsers(
    roleId: string,
    userIds: string[],
    targetRoleId: string,
    ctx: CallerCtx,
  ) {
    // Verify current role exists
    await this.findById(roleId);

    // Verify target role exists
    const targetRole = await this.prisma.role.findUnique({
      where: { id: targetRoleId },
    });

    if (!targetRole) {
      throw new NotFoundException(`Rol destino ${targetRoleId} no encontrado`);
    }

    // Remove users from this role by reassigning to target role
    const results: Array<{ userId: string; success: boolean; error?: string }> = [];

    for (const userId of userIds) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, roleId: true, role: true, email: true, tenantId: true },
        });

        if (!user) {
          results.push({ userId, success: false, error: 'Usuario no encontrado' });
          continue;
        }

        if (user.roleId !== roleId) {
          results.push({ userId, success: false, error: 'El usuario no tiene este rol' });
          continue;
        }

        if (user.role === targetRole.name) {
          results.push({ userId, success: false, error: 'El usuario ya tiene el rol destino' });
          continue;
        }

        await this.prisma.user.update({
          where: { id: userId },
          data: {
            roleId: targetRoleId,
            role: targetRole.name,
            updatedAt: new Date(),
          },
        });

        // Audit log for each user
        await this.auditService.log({
          tenantId: ctx.tenantId,
          userId: ctx.userId,
          entity: AuditEntity.user,
          entityId: userId,
          action: AuditAction.ROLE_CHANGE,
          snapshot: {
            previousRoleId: roleId,
            newRoleId: targetRoleId,
            previousRoleName: user.role,
            newRoleName: targetRole.name,
            reason: 'Bulk role reassignment',
          },
          ipAddress: ctx.ipAddress,
        });

        results.push({ userId, success: true });
      } catch (err) {
        results.push({
          userId,
          success: false,
          error: err instanceof Error ? err.message : 'Error desconocido',
        });
      }
    }

    return {
      processed: results.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      details: results,
    };
  }

  async remove(id: string, ctx: CallerCtx) {
    await this.findById(id);

    // Delete role permissions first
    await this.prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    const deleted = await this.prisma.role.delete({
      where: { id },
    });

    // Audit log
    await this.auditService.log({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      entity: AuditEntity.user,
      entityId: id,
      action: AuditAction.DELETE,
      snapshot: { deleted },
      ipAddress: ctx.ipAddress,
    });

    return deleted;
  }
}