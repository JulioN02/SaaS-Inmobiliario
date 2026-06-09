import { Test, TestingModule } from '@nestjs/testing';
import { AutoSuspensionService } from './auto-suspension.service';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import { AuditAction, AuditEntity, SubscriptionStatus, TenantStatus } from '@prisma/client';

describe('AutoSuspensionService', () => {
  let service: AutoSuspensionService;

  const mockPrisma = {
    subscription: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    tenant: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const buildSub = (overrides: Record<string, unknown> = {}) => ({
    id: 'sub-1',
    tenantId: 'tenant-1',
    planId: 'plan-1',
    status: SubscriptionStatus.ACTIVE,
    periodStart: new Date(),
    periodEnd: new Date(),
    cancelAtPeriodEnd: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    tenant: {
      id: 'tenant-1',
      name: 'Customer',
      subdomain: 'customer',
      planId: 'plan-1',
      status: TenantStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    billingConfig: {
      id: 'bc-1',
      tenantId: 'tenant-1',
      billingCycle: 'MONTHLY',
      currency: 'COP',
      gracePeriodDays: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    invoices: [
      {
        id: 'inv-1',
        subscriptionId: 'sub-1',
        tenantId: 'tenant-1',
        planId: 'plan-1',
        amount: 150000,
        currency: 'COP',
        status: 'OVERDUE',
        periodStart: new Date(),
        periodEnd: new Date(),
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoSuspensionService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
        { provide: 'AUTO_SUSPENSION_ENABLED', useValue: true },
      ],
    }).compile();

    service = module.get<AutoSuspensionService>(AutoSuspensionService);
    jest.clearAllMocks();
  });

  describe('handleAutoSuspension', () => {
    it('should exit early if disabled', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AutoSuspensionService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: AuditService, useValue: mockAuditService },
          { provide: 'AUTO_SUSPENSION_ENABLED', useValue: false },
        ],
      }).compile();

      const disabledService = module.get<AutoSuspensionService>(AutoSuspensionService);
      await disabledService.handleAutoSuspension();

      expect(mockPrisma.subscription.findMany).not.toHaveBeenCalled();
    });

    it('should skip platform tenant', async () => {
      const subscriptions = [buildSub({
        tenant: {
          id: 'tenant-platform',
          name: 'Platform',
          subdomain: 'platform',
          planId: 'plan-1',
          status: TenantStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })];

      mockPrisma.subscription.findMany.mockResolvedValue(subscriptions);

      await service.handleAutoSuspension();

      expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
      expect(mockPrisma.tenant.update).not.toHaveBeenCalled();
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });

    it('should skip subscription if no overdue invoices', async () => {
      const subscriptions = [buildSub({ invoices: [] })];
      mockPrisma.subscription.findMany.mockResolvedValue(subscriptions);

      await service.handleAutoSuspension();

      expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });

    it('should not transition if invoice is still within grace period', async () => {
      const subscriptions = [buildSub({
        invoices: [
          {
            id: 'inv-1',
            subscriptionId: 'sub-1',
            tenantId: 'tenant-1',
            planId: 'plan-1',
            amount: 150000,
            currency: 'COP',
            status: 'PENDING',
            periodStart: new Date(),
            periodEnd: new Date(),
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days past due
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })];

      mockPrisma.subscription.findMany.mockResolvedValue(subscriptions);

      await service.handleAutoSuspension();

      expect(mockPrisma.subscription.update).not.toHaveBeenCalled();
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });

    it('should transition ACTIVE → PAST_DUE when grace period expired', async () => {
      const subscriptions = [buildSub()];
      const updatedSub = { ...subscriptions[0], status: SubscriptionStatus.PAST_DUE };

      mockPrisma.subscription.findMany.mockResolvedValue(subscriptions);
      mockPrisma.subscription.update.mockResolvedValue(updatedSub);

      await service.handleAutoSuspension();

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { status: SubscriptionStatus.PAST_DUE },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: AuditEntity.subscription,
          action: AuditAction.STATUS_CHANGE,
          entityId: 'sub-1',
          tenantId: 'tenant-1',
          userId: 'system',
          snapshot: {
            from: 'ACTIVE',
            to: 'PAST_DUE',
            reason: 'grace_period_expired',
          },
        }),
      );
    });

    it('should transition PAST_DUE → CANCELED + SUSPEND when grace period expired', async () => {
      const subscriptions = [buildSub({ status: SubscriptionStatus.PAST_DUE })];
      const subUpdateResult = { ...subscriptions[0], status: SubscriptionStatus.CANCELED };
      const tenantUpdateResult = { id: 'tenant-1', status: TenantStatus.SUSPENDED };

      mockPrisma.subscription.findMany.mockResolvedValue(subscriptions);
      mockPrisma.subscription.update.mockResolvedValue(subUpdateResult);
      mockPrisma.tenant.update.mockResolvedValue(tenantUpdateResult);
      mockPrisma.$transaction.mockImplementation(
        (queries: Array<Promise<unknown>>) => Promise.all(queries),
      );

      await service.handleAutoSuspension();

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
        data: { status: SubscriptionStatus.CANCELED },
      });
      expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { status: TenantStatus.SUSPENDED },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: AuditEntity.subscription,
          action: AuditAction.SUSPEND,
          entityId: 'sub-1',
          tenantId: 'tenant-1',
          userId: 'system',
          snapshot: {
            from: 'PAST_DUE',
            to: 'CANCELED',
            tenantSuspended: true,
          },
        }),
      );
    });

    it('should use default 5-day grace period when billingConfig is null', async () => {
      const subscriptions = [buildSub({ billingConfig: null })];

      mockPrisma.subscription.findMany.mockResolvedValue(subscriptions);
      mockPrisma.subscription.update.mockResolvedValue(subscriptions[0]);

      await service.handleAutoSuspension();

      expect(mockPrisma.subscription.update).toHaveBeenCalled();
    });
  });
});
