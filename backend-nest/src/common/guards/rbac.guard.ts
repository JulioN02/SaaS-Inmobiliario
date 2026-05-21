import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../config/prisma.service';
import { UserRole } from '../../shared/types/enums';

// =============================================================================
// Guard factory for RBAC — creates a guard class that checks permissions
// from the database via PrismaService injection.
// =============================================================================

export function RbacGuard(
  resource: string,
  action: 'read' | 'create' | 'update' | 'delete',
): new (prisma: PrismaService) => CanActivate {
  @Injectable()
  class RbacGuardImpl implements CanActivate {
    constructor(public prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();
      const user = request['user'] as { id: string; role: UserRole; tenantId: string } | undefined;

      if (!user) {
        throw new ForbiddenException('Autenticación requerida para RBAC');
      }

      if (user.role === 'SUPER_ADMIN') {
        return true;
      }

      const hasPermission = await this.prisma.rolePermission.findFirst({
        where: {
          role: { name: user.role },
          permission: { resource, action },
        },
      });

      if (!hasPermission) {
        throw new ForbiddenException(
          `Permisos insuficientes para ${action} en ${resource}`,
        );
      }

      return true;
    }
  }

  return RbacGuardImpl;
}
