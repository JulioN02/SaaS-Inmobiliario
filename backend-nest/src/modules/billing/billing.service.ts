import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { BillingMetricsDto, TenantBillingStatusDto } from './dto';
import { InvoiceStatus, SubscriptionStatus, Prisma } from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(): Promise<BillingMetricsDto> {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [
      activeCount,
      pastDueCount,
      pendingInvoices,
      paidInvoices,
      totalFinalizedInvoices,
      collectedYTD,
    ] = await Promise.all([
      // Active subscriptions (ACTIVE + TRIALING)
      this.prisma.subscription.count({
        where: {
          status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
        },
      }),

      // Past due subscriptions
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.PAST_DUE },
      }),

      // Pending invoices: SUM of amount
      this.prisma.invoice.aggregate({
        where: { status: InvoiceStatus.PENDING },
        _sum: { amount: true },
      }),

      // Paid invoices count
      this.prisma.invoice.count({
        where: { status: InvoiceStatus.PAID },
      }),

      // Total finalized invoices count (PENDING + PAID + OVERDUE)
      this.prisma.invoice.count({
        where: {
          status: {
            in: [InvoiceStatus.PENDING, InvoiceStatus.PAID, InvoiceStatus.OVERDUE],
          },
        },
      }),

      // Total collected YTD
      this.prisma.payment.aggregate({
        where: {
          receivedAt: { gte: yearStart },
        },
        _sum: { amount: true },
      }),
    ]);

    // MRR: SUM of plan prices for active/trialing subscriptions
    // We need to get all active subscriptions with their plans
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      },
      include: {
        plan: { select: { prices: true } },
      },
    });

    let mrr = 0;
    for (const sub of activeSubscriptions) {
      const prices = sub.plan.prices as { monthly?: number; yearly?: number };
      if (prices?.monthly) {
        mrr += prices.monthly;
      }
    }

    // Collection rate
    const collectionRate = totalFinalizedInvoices > 0
      ? Math.round((paidInvoices / totalFinalizedInvoices) * 100)
      : 0;

    return {
      activeSubscriptions: activeCount,
      pastDueSubscriptions: pastDueCount,
      mrr,
      collectionRate,
      totalCollectedYTD: collectedYTD._sum.amount ? Number(collectedYTD._sum.amount) : 0,
      pendingInvoicesAmount: pendingInvoices._sum.amount ? Number(pendingInvoices._sum.amount) : 0,
    };
  }

  async getTenantBillingStatus(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, page = 1, limit = 10 } = filters;

    const where: Prisma.TenantWhereInput = {
      deletedAt: null,
    };

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: { select: { id: true, name: true } },
          subscription: {
            select: {
              id: true,
              status: true,
              periodEnd: true,
            },
          },
          invoices: {
            where: {
              status: { in: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE] },
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              amount: true,
              status: true,
              dueDate: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    const data: TenantBillingStatusDto[] = tenants.map((tenant) => {
      const lastInvoice = tenant.invoices?.[0];
      const outstandingAmount = lastInvoice && (lastInvoice.status === InvoiceStatus.PENDING || lastInvoice.status === InvoiceStatus.OVERDUE)
        ? Number(lastInvoice.amount)
        : 0;

      return {
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSubdomain: tenant.subdomain,
        tenantStatus: tenant.status,
        planName: tenant.plan?.name ?? 'N/A',
        subscriptionStatus: tenant.subscription?.status ?? 'N/A',
        nextBillingDate: tenant.subscription?.periodEnd ?? undefined,
        lastInvoiceDate: lastInvoice?.createdAt ?? undefined,
        outstandingAmount,
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
