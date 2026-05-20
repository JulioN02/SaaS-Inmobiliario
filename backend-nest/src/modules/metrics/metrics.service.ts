import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { MetricsResponseDto } from './dto/metrics-response.dto';
import { UserRole, Prisma, MaintenanceStatus, FeeStatus } from '@prisma/client';

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
      suspendedTenants,
      totalUsers,
      totalProperties,
      totalUnits,
      unitsByStatus,
      totalResidents,
      feeAggregation,
      visitorsToday,
      visitorsActive,
      visitorsThisWeek,
      maintenanceBreakdown,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.tenant.count({
        where: { status: 'ACTIVE', deletedAt: null },
      }),
      this.prisma.tenant.count({
        where: { status: 'SUSPENDED', deletedAt: null },
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.property.count({ where: { deletedAt: null } }),
      this.prisma.unit.count({ where: { deletedAt: null } }),
      this.prisma.unit.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { status: true },
      }),
      this.prisma.resident.count({ where: { deletedAt: null } }),
      this.getFeeMetrics(null),
      this.getVisitorCounts(null, 'today'),
      this.getVisitorCounts(null, 'active'),
      this.getVisitorCounts(null, 'thisWeek'),
      this.getMaintenanceBreakdown(null),
    ]);

    const statusMap = new Map(
      unitsByStatus.map((item) => [item.status, item._count.status]),
    );

    const occupiedUnits = statusMap.get('OCCUPIED') || 0;
    const availableUnits = statusMap.get('AVAILABLE') || 0;
    const maintenanceUnits = statusMap.get('MAINTENANCE') || 0;
    const totalUnitsCount = occupiedUnits + availableUnits + maintenanceUnits;
    const occupancyRate = totalUnitsCount > 0
      ? Math.round((occupiedUnits / totalUnitsCount) * 1000) / 10
      : 0;

    return {
      totalTenants,
      activeTenants,
      suspendedTenants,
      totalUsers,
      totalProperties,
      totalUnits: totalUnitsCount,
      occupiedUnits,
      availableUnits,
      maintenanceUnits,
      occupancyRate,
      totalResidents,
      fees: feeAggregation,
      visitors: {
        today: visitorsToday,
        active: visitorsActive,
        thisWeek: visitorsThisWeek,
      },
      maintenance: maintenanceBreakdown,
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
      totalResidents,
      feeAggregation,
      visitorsToday,
      visitorsActive,
      visitorsThisWeek,
      maintenanceBreakdown,
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
      this.prisma.resident.count({
        where: { tenantId, deletedAt: null },
      }),
      this.getFeeMetrics(tenantId),
      this.getVisitorCounts(tenantId, 'today'),
      this.getVisitorCounts(tenantId, 'active'),
      this.getVisitorCounts(tenantId, 'thisWeek'),
      this.getMaintenanceBreakdown(tenantId),
    ]);

    const statusMap = new Map(
      unitsByStatus.map((item) => [item.status, item._count.status]),
    );

    const occupiedUnits = statusMap.get('OCCUPIED') || 0;
    const availableUnits = statusMap.get('AVAILABLE') || 0;
    const maintenanceUnits = statusMap.get('MAINTENANCE') || 0;
    const totalUnitsCount = occupiedUnits + availableUnits + maintenanceUnits;
    const occupancyRate = totalUnitsCount > 0
      ? Math.round((occupiedUnits / totalUnitsCount) * 1000) / 10
      : 0;

    return {
      totalTenants: 1,
      activeTenants: tenant.status === 'ACTIVE' ? 1 : 0,
      suspendedTenants: 0,
      totalUsers,
      totalProperties,
      totalUnits: totalUnitsCount,
      occupiedUnits,
      availableUnits,
      maintenanceUnits,
      occupancyRate,
      totalResidents,
      fees: feeAggregation,
      visitors: {
        today: visitorsToday,
        active: visitorsActive,
        thisWeek: visitorsThisWeek,
      },
      maintenance: maintenanceBreakdown,
    };
  }

  // ── Fee metrics helper ───────────────────────────────────────────────────────

  private async getFeeMetrics(tenantId: string | null) {
    const where = tenantId
      ? { tenantId }
      : {};

    const [byStatus, overdueCount, totalCollectedResult] = await Promise.all([
      this.prisma.fee.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
        _sum: { paidAmount: true },
      }),
      this.prisma.fee.count({
        where: {
          ...where,
          status: FeeStatus.PENDING,
          dueDate: { lt: new Date() },
        },
      }),
      this.prisma.fee.aggregate({
        where: {
          ...where,
          status: FeeStatus.PAID,
        },
        _sum: { paidAmount: true, amount: true },
      }),
    ]);

    const statusMap = new Map(
      byStatus.map((item) => [item.status, { count: item._count.status, sum: item._sum.paidAmount || 0 }]),
    );

    const pending = statusMap.get('PENDING')?.count || 0;
    const paid = statusMap.get('PAID')?.count || 0;
    const partial = statusMap.get('PARTIAL')?.count || 0;
    const total = pending + paid + partial;

    return {
      pending,
      paid,
      partial,
      overdue: overdueCount,
      totalCollected: totalCollectedResult._sum.paidAmount
        ? Number(totalCollectedResult._sum.paidAmount)
        : 0,
      collectionRate: total > 0
        ? Math.round((paid / total) * 1000) / 10
        : 0,
    };
  }

  // ── Visitor counts helper ────────────────────────────────────────────────────

  private async getVisitorCounts(tenantId: string | null, type: 'today' | 'active' | 'thisWeek') {
    const baseWhere = tenantId
      ? { tenantId }
      : {};

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    switch (type) {
      case 'today':
        return this.prisma.visitor.count({
          where: {
            ...baseWhere,
            entryDate: { gte: startOfDay },
          },
        });
      case 'active':
        return this.prisma.visitor.count({
          where: {
            ...baseWhere,
            exitDate: null,
          },
        });
      case 'thisWeek':
        return this.prisma.visitor.count({
          where: {
            ...baseWhere,
            entryDate: { gte: startOfWeek },
          },
        });
    }
  }

  // ── Maintenance breakdown helper ─────────────────────────────────────────────

  private async getMaintenanceBreakdown(tenantId: string | null) {
    const where = tenantId
      ? { tenantId }
      : {};

    const byStatus = await this.prisma.maintenanceRequest.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    const statusMap = new Map(
      byStatus.map((item) => [item.status, item._count.status]),
    );

    return {
      pending: statusMap.get('PENDING') || 0,
      inProgress: statusMap.get('IN_PROGRESS') || 0,
      resolved: statusMap.get('RESOLVED') || 0,
      cancelled: statusMap.get('CANCELLED') || 0,
    };
  }

  // ── Extended dashboard queries ─────────────────────────────────────────────

  async getPendingMaintenance(tenantId: string) {
    const requests = await this.prisma.maintenanceRequest.findMany({
      where: {
        tenantId,
        status: { in: [MaintenanceStatus.PENDING, MaintenanceStatus.IN_PROGRESS] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        unit: { select: { identifier: true } },
      },
    });

    return requests.map(r => ({
      id: r.id,
      title: r.title,
      status: r.status,
      unitNumber: r.unit?.identifier || '—',
      createdAt: r.createdAt,
      assignedTo: r.assignedTo,
    }));
  }

  async getUpcomingFees(tenantId: string) {
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    const fees = await this.prisma.fee.findMany({
      where: {
        tenantId,
        status: 'PENDING',
        dueDate: {
          gte: today,
          lte: thirtyDaysLater,
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: {
        unit: { select: { identifier: true } },
      },
    });

    return fees.map(f => ({
      id: f.id,
      amount: f.amount,
      dueDate: f.dueDate,
      period: f.period,
      unitNumber: f.unit?.identifier || '—',
      daysLeft: Math.ceil((f.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
    }));
  }

  async getActiveAnnouncements(tenantId: string) {
    const announcements = await this.prisma.announcement.findMany({
      where: {
        tenantId,
        isActive: true,
        startsAt: { lte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return announcements.map(a => ({
      id: a.id,
      title: a.title,
      priority: a.priority,
      createdAt: a.createdAt,
      content: a.content?.substring(0, 200),
    }));
  }
}
