import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { InvoiceStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from '../../common/testing/mock-guards';
import { PrismaService } from '../../config/prisma.service';

describe('InvoiceController', () => {
  let controller: InvoiceController;
  let service: jest.Mocked<InvoiceService>;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockIpAddress = '127.0.0.1';
  const mockInvoice = {
    id: 'inv-1',
    subscriptionId: 'sub-1',
    tenantId: mockTenantId,
    planId: 'plan-1',
    amount: 150000,
    currency: 'COP',
    status: InvoiceStatus.DRAFT,
    periodStart: new Date(),
    periodEnd: new Date(),
    dueDate: new Date(),
    paidAt: undefined,
    paidAmount: undefined,
    paymentMethod: undefined,
    stripeInvoiceId: undefined,
    notes: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    planName: 'Premium',
    tenantName: 'Test Tenant',
  };

  const mockPrismaService = {
    rolePermission: {
      findFirst: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceController],
      providers: [
        {
          provide: InvoiceService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            finalize: jest.fn(),
            cancel: jest.fn(),
            findPaymentsByInvoice: jest.fn(),
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

    controller = module.get<InvoiceController>(InvoiceController);
    service = module.get(InvoiceService);
  });

  describe('findAll', () => {
    it('should return paginated invoices with filters', async () => {
      const mockResult = {
        data: [mockInvoice],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      service.findAll.mockResolvedValue(mockResult);

      // Controller uses @Query('name') individual params
      const result = await controller.findAll(mockTenantId, InvoiceStatus.DRAFT, 1, 20);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        status: InvoiceStatus.DRAFT,
        page: 1,
        limit: 20,
      });
    });
  });

  describe('findById', () => {
    it('should return an invoice by id', async () => {
      service.findById.mockResolvedValue(mockInvoice);

      const result = await controller.findById('inv-1');

      expect(result).toEqual(mockInvoice);
      expect(service.findById).toHaveBeenCalledWith('inv-1');
    });

    it('should throw NotFoundException if not found', async () => {
      service.findById.mockRejectedValue(new NotFoundException());

      await expect(controller.findById('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      subscriptionId: 'sub-1',
      tenantId: mockTenantId,
      planId: 'plan-1',
      amount: 150000,
      periodStart: '2026-05-01T00:00:00Z',
      periodEnd: '2026-06-01T00:00:00Z',
      notes: 'Factura mensual',
    };

    it('should create a draft invoice', async () => {
      service.create.mockResolvedValue(mockInvoice);

      const result = await controller.create(createDto as any, mockUserId, mockIpAddress);

      expect(result).toEqual(mockInvoice);
      expect(service.create).toHaveBeenCalledWith(
        createDto,
        { userId: mockUserId, ipAddress: mockIpAddress },
      );
    });

    it('should throw BadRequestException if amount is invalid', async () => {
      service.create.mockRejectedValue(
        new BadRequestException('El monto debe ser mayor a 0'),
      );

      await expect(
        controller.create({ ...createDto, amount: 0 } as any, mockUserId, mockIpAddress),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateDto = { amount: 200000, notes: 'Actualizado' };

    it('should update a draft invoice', async () => {
      const updated = { ...mockInvoice, amount: 200000, notes: 'Actualizado' };
      service.update.mockResolvedValue(updated);

      const result = await controller.update('inv-1', updateDto as any, mockUserId, mockIpAddress);

      expect(result.amount).toEqual(200000);
      expect(service.update).toHaveBeenCalledWith(
        'inv-1',
        updateDto,
        { userId: mockUserId, ipAddress: mockIpAddress },
      );
    });

    it('should throw BadRequestException if invoice is not DRAFT', async () => {
      service.update.mockRejectedValue(
        new BadRequestException('Solo se pueden editar facturas en estado DRAFT'),
      );

      await expect(
        controller.update('inv-1', updateDto as any, mockUserId, mockIpAddress),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('finalize', () => {
    it('should finalize a draft invoice', async () => {
      const finalized = { ...mockInvoice, status: InvoiceStatus.PENDING };
      service.finalize.mockResolvedValue(finalized);

      const result = await controller.finalize('inv-1', mockUserId, mockIpAddress);

      expect(result.status).toEqual(InvoiceStatus.PENDING);
      expect(service.finalize).toHaveBeenCalledWith(
        'inv-1',
        { userId: mockUserId, ipAddress: mockIpAddress },
      );
    });

    it('should throw BadRequestException if not DRAFT', async () => {
      service.finalize.mockRejectedValue(
        new BadRequestException('Solo se pueden finalizar facturas en estado DRAFT'),
      );

      await expect(controller.finalize('inv-1', mockUserId, mockIpAddress)).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel a PENDING invoice', async () => {
      const cancelled = { ...mockInvoice, status: InvoiceStatus.CANCELED };
      service.cancel.mockResolvedValue(cancelled);

      const result = await controller.cancel('inv-1', mockUserId, mockIpAddress);

      expect(result.status).toEqual(InvoiceStatus.CANCELED);
      expect(service.cancel).toHaveBeenCalledWith(
        'inv-1',
        { userId: mockUserId, ipAddress: mockIpAddress },
      );
    });

    it('should throw BadRequestException if not PENDING', async () => {
      service.cancel.mockRejectedValue(
        new BadRequestException('Solo se pueden cancelar facturas en estado PENDING'),
      );

      await expect(controller.cancel('inv-1', mockUserId, mockIpAddress)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findPaymentsByInvoice', () => {
    it('should return payments for an invoice', async () => {
      const payments = [
        { id: 'pay-1', amount: 150000, method: 'transfer', reference: null, receivedAt: new Date(), createdAt: new Date() },
      ];
      service.findPaymentsByInvoice.mockResolvedValue(payments as any);

      const result = await controller.findPaymentsByInvoice('inv-1');

      expect(result).toEqual(payments);
      expect(service.findPaymentsByInvoice).toHaveBeenCalledWith('inv-1');
    });

    it('should throw NotFoundException if invoice not found', async () => {
      service.findPaymentsByInvoice.mockRejectedValue(new NotFoundException());

      await expect(controller.findPaymentsByInvoice('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});
