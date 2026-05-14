import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { MetricsResponseDto } from './dto/metrics-response.dto';
import { UserRole, Prisma } from '@prisma/client';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async getPlatformMetrics(userRole: UserRole): Promise<MetricsResponseDto> {
    // Only SUPER_ADMIN can access platform-wide metrics
    if (userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Solo SUPER_ADMIN puede ver métricas de la plataforma',
      );
    }

    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalProperties,
      totalUnits,
      unitsByStatus,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.tenant.count({
        where: { status: 'ACTIVE', deletedAt: null },
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.property.count({ where: { deletedAt: null } }),
      this.prisma.unit.count({ where: { deletedAt: null } }),
      this.prisma.unit.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { status: true },
      }),
    ]);

    const statusMap = new Map(
      unitsByStatus.map((item) => [item.status, item._count.status]),
    );

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      totalProperties,
      totalUnits,
      occupiedUnits: statusMap.get('OCCUPIED') || 0,
      availableUnits: statusMap.get('AVAILABLE') || 0,
      maintenanceUnits: statusMap.get('MAINTENANCE') || 0,
    };
  }

  async getTenantMetrics(
    tenantId: string,
    userRole: UserRole,
    requestorTenantId?: string,
  ): Promise<MetricsResponseDto> {
    // SUPER_ADMIN can view any tenant's metrics
    // ADMIN_TENANT can only view their own tenant's metrics
    if (
      userRole !== UserRole.SUPER_ADMIN &&
      (userRole !== UserRole.ADMIN_TENANT || requestorTenantId !== tenantId)
    ) {
      throw new ForbiddenException(
        'No tienes permiso para ver las métricas de este tenant',
      );
    }

    // Verify tenant exists and is active
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!tenant) {
      throw new ForbiddenException('Tenant no encontrado');
    }

    if (tenant.status !== 'ACTIVE') {
      throw new ForbiddenException(`Tenant está ${tenant.status}`);
    }

    const [
      totalUsers,
      totalProperties,
      totalUnits,
      unitsByStatus,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.property.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.unit.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.unit.groupBy({
        by: ['status'],
        where: { tenantId, deletedAt: null },
        _count: { status: true },
      }),
    ]);

    const statusMap = new Map(
      unitsByStatus.map((item) => [item.status, item._count.status]),
    );

    return {
      totalTenants: 1, // Only this tenant
      activeTenants: tenant.status === 'ACTIVE' ? 1 : 0,
      totalUsers,
      totalProperties,
      totalUnits,
      occupiedUnits: statusMap.get('OCCUPIED') || 0,
      availableUnits: statusMap.get('AVAILABLE') || 0,
      maintenanceUnits: statusMap.get('MAINTENANCE') || 0,
    };
  }
}
