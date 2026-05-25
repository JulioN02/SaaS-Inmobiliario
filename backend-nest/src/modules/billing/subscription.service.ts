import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import {
  UpdateSubscriptionDto,
  SubscriptionResponseDto,
} from './dto';
import { AuditAction, AuditEntity, SubscriptionStatus, BillingCycle, Prisma } from '@prisma/client';

interface CallerCtx {
  userId: string;
  ipAddress?: string;
}

// Allowed status transitions
const STATUS_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  [SubscriptionStatus.TRIALING]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELED, SubscriptionStatus.EXPIRED],
  [SubscriptionStatus.ACTIVE]: [SubscriptionStatus.PAST_DUE, SubscriptionStatus.CANCELED, SubscriptionStatus.EXPIRED],
  [SubscriptionStatus.PAST_DUE]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELED, SubscriptionStatus.EXPIRED],
  [SubscriptionStatus.CANCELED]: [SubscriptionStatus.ACTIVE],
  [SubscriptionStatus.EXPIRED]: [],
};

@Injectable()
export class SubscriptionService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(filters: { status?: SubscriptionStatus; planId?: string; page?: number; limit?: number }) {
    const { status, planId, page = 1, limit = 10 } = filters;

    const where: Prisma.SubscriptionWhereInput = {
      ...(status && { status }),
      ...(planId && { planId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: { select: { id: true, name: true, slug: true } },
          tenant: { select: { id: true, name: true, status: true } },
        },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      data: data.map((sub) => this.mapToResponse(sub)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<SubscriptionResponseDto> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: { select: { id: true, name: true, slug: true } },
        tenant: { select: { id: true, name: true, status: true } },
        invoices: {
          select: { id: true, amount: true, status: true, dueDate: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Suscripción ${id} no encontrada`);
    }

    return this.mapToResponse(subscription);
  }

  async update(id: string, dto: UpdateSubscriptionDto, ctx: CallerCtx): Promise<SubscriptionResponseDto> {
    const subscription = await this.findByIdInternal(id);

    // Validate status transition if status is being changed
    if (dto.status && dto.status !== subscription.status) {
      const allowed = STATUS_TRANSITIONS[subscription.status] || [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Transición de estado no válida: ${subscription.status} → ${dto.status}`,
        );
      }
    }

    // If planId changes, validate plan exists and recalculate period
    if (dto.planId && dto.planId !== subscription.planId) {
      const plan = await this.prisma.plan.findUnique({
        where: { id: dto.planId },
      });
      if (!plan) {
        throw new NotFoundException(`Plan ${dto.planId} no encontrado`);
      }

      // Also update the tenant's plan
      await this.prisma.tenant.update({
        where: { id: subscription.tenantId },
        data: { planId: dto.planId },
      });
    }

    const updateData: Prisma.SubscriptionUpdateInput = {};
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.planId !== undefined) updateData.plan = { connect: { id: dto.planId } };
    if (dto.periodStart !== undefined) updateData.periodStart = new Date(dto.periodStart);
    if (dto.periodEnd !== undefined) updateData.periodEnd = new Date(dto.periodEnd);
    if (dto.cancelAtPeriodEnd !== undefined) updateData.cancelAtPeriodEnd = dto.cancelAtPeriodEnd;

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        plan: { select: { id: true, name: true, slug: true } },
        tenant: { select: { id: true, name: true, status: true } },
      },
    });

    // Audit log
    const snapshot: Record<string, unknown> = {
      before: {
        status: subscription.status,
        planId: subscription.planId,
      },
      after: {
        status: updated.status,
        planId: updated.planId,
      },
    };

    const auditAction = dto.status && dto.status !== subscription.status
      ? AuditAction.STATUS_CHANGE
      : AuditAction.UPDATE;

    await this.auditService.log({
      tenantId: updated.tenantId,
      userId: ctx.userId,
      entity: AuditEntity.subscription,
      entityId: id,
      action: auditAction,
      snapshot,
      ipAddress: ctx.ipAddress,
    });

    return this.mapToResponse(updated);
  }

  /**
   * Calculate period dates based on billing cycle.
   */
  calculatePeriod(cycle: BillingCycle): { periodStart: Date; periodEnd: Date } {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let periodEnd: Date;
    if (cycle === BillingCycle.MONTHLY) {
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      periodEnd = new Date(now.getFullYear() + 1, now.getMonth(), 0);
    }

    return { periodStart, periodEnd };
  }

  private async findByIdInternal(id: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      throw new NotFoundException(`Suscripción ${id} no encontrada`);
    }

    return subscription;
  }

  private mapToResponse(sub: any): SubscriptionResponseDto {
    return {
      id: sub.id,
      tenantId: sub.tenantId,
      planId: sub.planId,
      status: sub.status,
      periodStart: sub.periodStart,
      periodEnd: sub.periodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      trialEndsAt: sub.trialEndsAt ?? undefined,
      stripeCustomerId: sub.stripeCustomerId ?? undefined,
      stripeSubscriptionId: sub.stripeSubscriptionId ?? undefined,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
      planName: sub.plan?.name,
      tenantName: sub.tenant?.name,
      tenantStatus: sub.tenant?.status,
      invoices: sub.invoices?.map((inv: any) => ({
        id: inv.id,
        amount: Number(inv.amount),
        status: inv.status,
        dueDate: inv.dueDate,
      })),
    };
  }
}
