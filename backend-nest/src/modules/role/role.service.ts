import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';
import { AuditAction, AuditEntity, Permission, Role, RolePermission, Prisma } from '@prisma/client';

interface CallerCtx {
  userId: string;
  tenantId: string;
  ipAddress?: string;
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