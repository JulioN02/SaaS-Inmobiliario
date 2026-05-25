import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { SubscriptionStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from '../../common/testing/mock-guards';
import { PrismaService } from '../../config/prisma.service';

describe('SubscriptionController', () => {
  let controller: SubscriptionController;
  let service: jest.Mocked<SubscriptionService>;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockIpAddress = '127.0.0.1';
  const mockSubscription = {
    id: 'sub-1',
    tenantId: mockTenantId,
    planId: 'plan-1',
    status: SubscriptionStatus.ACTIVE,
    periodStart: new Date(),
    periodEnd: new Date(),
    cancelAtPeriodEnd: false,
    trialEndsAt: undefined,
    stripeCustomerId: undefined,
    stripeSubscriptionId: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    planName: 'Premium',
    tenantName: 'Test Tenant',
    tenantStatus: 'ACTIVE',
  };

  const mockPrismaService = {
    rolePermission: {
      findFirst: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        {
          provide: SubscriptionService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(TenantGuard)
      .useClass(MockTenantGuard)
      .overrideGuard(RbacGuard)
      .useClass(MockRbacGuard)
      .compile();

    controller = module.get<SubscriptionController>(SubscriptionController);
    service = module.get(SubscriptionService);
  });

  describe('findAll', () => {
    it('should return paginated subscriptions', async () => {
      const mockResult = {
        data: [mockSubscription],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      service.findAll.mockResolvedValue(mockResult);

      // Controller uses @Query('name') individual params
      const result = await controller.findAll(undefined, undefined, 1, 10);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith({ status: undefined, planId: undefined, page: 1, limit: 10 });
    });
  });

  describe('findById', () => {
    it('should return a subscription by id', async () => {
      service.findById.mockResolvedValue(mockSubscription);

      const result = await controller.findById('sub-1');

      expect(result).toEqual(mockSubscription);
      expect(service.findById).toHaveBeenCalledWith('sub-1');
    });

    it('should throw NotFoundException if not found', async () => {
      service.findById.mockRejectedValue(new NotFoundException());

      await expect(controller.findById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = { status: SubscriptionStatus.PAST_DUE };

    it('should update a subscription', async () => {
      const updated = { ...mockSubscription, status: SubscriptionStatus.PAST_DUE };
      service.update.mockResolvedValue(updated);

      const result = await controller.update('sub-1', updateDto as any, mockUserId, mockIpAddress);

      expect(result.status).toEqual(SubscriptionStatus.PAST_DUE);
      expect(service.update).toHaveBeenCalledWith(
        'sub-1',
        updateDto,
        { userId: mockUserId, ipAddress: mockIpAddress },
      );
    });

    it('should throw NotFoundException if not found', async () => {
      service.update.mockRejectedValue(new NotFoundException());

      await expect(
        controller.update('invalid-id', updateDto as any, mockUserId, mockIpAddress),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject invalid status transitions', async () => {
      service.update.mockRejectedValue(
        new BadRequestException('Transición de estado no válida'),
      );

      await expect(
        controller.update('sub-1', { status: SubscriptionStatus.TRIALING } as any, mockUserId, mockIpAddress),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
