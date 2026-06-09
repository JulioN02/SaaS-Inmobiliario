import { Injectable, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import { AuditAction, AuditEntity, SubscriptionStatus, TenantStatus } from '@prisma/client';

@Injectable()
export class AutoSuspensionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    @Inject('AUTO_SUSPENSION_ENABLED')
    private readonly enabled: boolean,
  ) {}

  @Cron('0 6 * * *', { name: 'autoSuspensionJob' })
  async handleAutoSuspension() {
    if (!this.enabled) return;

    const subscriptions = await this.prisma.subscription.findMany({
      where: { status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] } },
      include: {
        tenant: true,
        billingConfig: true,
        invoices: {
          where: { status: { in: ['PENDING', 'OVERDUE'] } },
          orderBy: { dueDate: 'asc' },
          take: 1,
        },
      },
    });

    for (const sub of subscriptions) {
      const s = sub as any;

      // Skip platform tenant
      if (s.tenant.subdomain === 'platform') continue;

      const gracePeriodDays = s.billingConfig?.gracePeriodDays ?? 5;
      const overdueInvoice = s.invoices[0];

      if (!overdueInvoice) continue;

      const dueDate = new Date(overdueInvoice.dueDate);
      const graceEnd = new Date(dueDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000);
      const now = new Date();

      if (now <= graceEnd) continue; // Still in grace period

      if (s.status === SubscriptionStatus.ACTIVE) {
        // Phase 1: ACTIVE → PAST_DUE
        await this.prisma.subscription.update({
          where: { id: s.id },
          data: { status: SubscriptionStatus.PAST_DUE },
        });
        await this.auditService.log({
          entity: AuditEntity.subscription,
          action: AuditAction.STATUS_CHANGE,
          entityId: s.id,
          tenantId: s.tenantId,
          userId: 'system',
          snapshot: {
            from: 'ACTIVE',
            to: 'PAST_DUE',
            reason: 'grace_period_expired',
          },
        });
      } else if (s.status === SubscriptionStatus.PAST_DUE) {
        // Phase 2: PAST_DUE → CANCELED + SUSPEND
        await this.prisma.$transaction([
          this.prisma.subscription.update({
            where: { id: s.id },
            data: { status: SubscriptionStatus.CANCELED },
          }),
          this.prisma.tenant.update({
            where: { id: s.tenantId },
            data: { status: TenantStatus.SUSPENDED },
          }),
        ]);
        await this.auditService.log({
          entity: AuditEntity.subscription,
          action: AuditAction.SUSPEND,
          entityId: s.id,
          tenantId: s.tenantId,
          userId: 'system',
          snapshot: {
            from: 'PAST_DUE',
            to: 'CANCELED',
            tenantSuspended: true,
          },
        });
      }
    }
  }
}
