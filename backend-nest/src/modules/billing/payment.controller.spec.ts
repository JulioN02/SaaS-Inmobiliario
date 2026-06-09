import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentMethod } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from '../../common/testing/mock-guards';
import { PrismaService } from '../../config/prisma.service';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: jest.Mocked<PaymentService>;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockIpAddress = '127.0.0.1';
  const mockPayment = {
    id: 'pay-1',
    invoiceId: 'inv-1',
    tenantId: mockTenantId,
    amount: 150000,
    currency: 'COP',
    method: PaymentMethod.transfer,
    reference: 'REF-001',
    receivedBy: mockUserId,
    receivedAt: new Date(),
    metadata: null,
    createdAt: new Date(),
    invoiceStatus: 'PAID',
  };

  const mockPrismaService = {
    rolePermission: {
      findFirst: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
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

    controller = module.get<PaymentController>(PaymentController);
    service = module.get(PaymentService);
  });

  describe('create', () => {
    const createDto = {
      invoiceId: 'inv-1',
      tenantId: mockTenantId,
      amount: 150000,
      method: PaymentMethod.transfer,
      reference: 'REF-001',
    };

    it('should register a payment', async () => {
      service.create.mockResolvedValue(mockPayment);

      const result = await controller.create(createDto as any, mockUserId, mockIpAddress);

      expect(result).toEqual(mockPayment);
      expect(service.create).toHaveBeenCalledWith(
        createDto,
        { userId: mockUserId, ipAddress: mockIpAddress },
      );
    });

    it('should throw BadRequestException if amount exceeds invoice', async () => {
      service.create.mockRejectedValue(
        new BadRequestException('El monto del pago excede el valor de la factura'),
      );

      await expect(
        controller.create(
          { ...createDto, amount: 999999 } as any,
          mockUserId,
          mockIpAddress,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for partial payments', async () => {
      service.create.mockRejectedValue(
        new BadRequestException('No se permiten pagos parciales en v1'),
      );

      await expect(
        controller.create(
          { ...createDto, amount: 50000 } as any,
          mockUserId,
          mockIpAddress,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if invoice not found', async () => {
      service.create.mockRejectedValue(new NotFoundException('Factura no encontrada'));

      await expect(
        controller.create(createDto as any, mockUserId, mockIpAddress),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findById', () => {
    it('should return a payment by id', async () => {
      service.findById.mockResolvedValue(mockPayment);

      const result = await controller.findById('pay-1');

      expect(result).toEqual(mockPayment);
      expect(service.findById).toHaveBeenCalledWith('pay-1');
    });

    it('should throw NotFoundException if not found', async () => {
      service.findById.mockRejectedValue(new NotFoundException());

      await expect(controller.findById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
