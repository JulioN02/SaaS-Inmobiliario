import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // 1. Obtener tenantId del JWT (si está autenticado)
    const user = request['user'];
    if (user?.clientId) {
      request['tenantId'] = user.clientId;
      return this.validateTenant(user.clientId);
    }

    // 2. Resolver desde header x-tenant-id (para login, APIs públicas)
    // Acepta tanto UUID como subdominio
    const headerTenantId = request.headers['x-tenant-id'] as string | undefined;
    if (headerTenantId) {
      const tenant = await this.prisma.tenant.findFirst({
        where: {
          OR: [
            { id: headerTenantId },
            { subdomain: headerTenantId },
          ],
          deletedAt: null,
        },
        select: { id: true, status: true },
      });

      if (!tenant) {
        throw new ForbiddenException('Tenant no encontrado');
      }

      if (tenant.status !== 'ACTIVE') {
        throw new ForbiddenException(`Tenant está ${tenant.status}`);
      }

      request['tenantId'] = tenant.id;
      return true;
    }

    // 3. Resolver desde subdominio
    const host = request.headers.host || '';
    const subdomain = host.split('.')[0];

    if (subdomain && subdomain !== 'api' && subdomain !== 'localhost' && subdomain !== 'www') {
      const tenant = await this.prisma.tenant.findUnique({
        where: { subdomain, deletedAt: null },
        select: { id: true, status: true },
      });

      if (!tenant) {
        throw new ForbiddenException('Tenant no encontrado');
      }

      if (tenant.status !== 'ACTIVE') {
        throw new ForbiddenException(`Tenant está ${tenant.status}`);
      }

      request['tenantId'] = tenant.id;
      return true;
    }

    throw new ForbiddenException('No se pudo resolver el tenant');
  }

  private async validateTenant(tenantId: string): Promise<boolean> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId, deletedAt: null },
      select: { status: true },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant no encontrado');
    }

    if (tenant.status !== 'ACTIVE') {
      throw new ForbiddenException(`Tenant está ${tenant.status}`);
    }

    return true;
  }
}
