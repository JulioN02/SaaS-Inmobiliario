import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FeeController } from './fee.controller';
import { FeeService } from './fee.service';
import { FeeStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from '../../common/testing/mock-guards';
import { PrismaService } from '../../config/prisma.service';

describe('FeeController', () => {
  let controller: FeeController;
  let service: jest.Mocked<FeeService>;

  const mockTenantId = 'tenant-123';
  const mockUserId = 'user-123';
  const mockIpAddress = '127.0.0.1';
  const mockFee = {
    id: 'fee-1',
    tenantId: mockTenantId,
    unitId: 'unit-1',
    amount: 200,
    paidAmount: null,
    paidAt: undefined,
    period: '2026-05',
    status: FeeStatus.PENDING,
    type: 'COMMON' as any,
    dueDate: new Date('2026-05-15'),
    description: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    unitIdentifier: '101',
    unitTowerName: 'Torre A',
    propertyName: 'Conjunto Example',
    history: [],
  };

  const mockPrismaService = {
    rolePermission: {
      findFirst: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeeController],
      providers: [
        {
          provide: FeeService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
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

    controller = module.get<FeeController>(FeeController);
    service = module.get(FeeService);
  });

  describe('findAll', () => {
    it('should return paginated fees', async () => {
      const mockResult = {
        data: [mockFee],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll({ page: 1, limit: 20 } as any, mockTenantId);

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(mockTenantId, { page: 1, limit: 20 });
    });

    it('should filter by period and status', async () => {
      const filters = { period: '2026-05', status: FeeStatus.PENDING, page: 1, limit: 20 };
      service.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });

      await controller.findAll(filters as any, mockTenantId);

      expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
    });
  });

  describe('findById', () => {
    it('should return a fee by id', async () => {
      service.findById.mockResolvedValue(mockFee);

      const result = await controller.findById('fee-1', mockTenantId);

      expect(result).toEqual(mockFee);
      expect(service.findById).toHaveBeenCalledWith(mockTenantId, 'fee-1');
    });

    it('should throw NotFoundException if not found', async () => {
      service.findById.mockRejectedValue(new NotFoundException());

      await expect(controller.findById('invalid-id', mockTenantId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      unitId: 'unit-1',
      amount: 200,
      period: '2026-05',
      feeType: 'COMMON',
      dueDate: '2026-05-15',
    };

    it('should create a new fee', async () => {
      service.create.mockResolvedValue(mockFee);

      const result = await controller.create(createDto as any, mockUserId, mockTenantId, mockIpAddress);

      expect(result).toEqual(mockFee);
      expect(service.create).toHaveBeenCalledWith(mockTenantId, createDto, {
        userId: mockUserId,
        tenantId: mockTenantId,
        ipAddress: mockIpAddress,
      });
    });

    it('should throw NotFoundException if unit not found', async () => {
      service.create.mockRejectedValue(new NotFoundException('Unidad no encontrada'));

      await expect(
        controller.create(createDto as any, mockUserId, mockTenantId, mockIpAddress),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if fee already exists for period', async () => {
      service.create.mockRejectedValue(
        new BadRequestException('Cuota ya existe para este periodo'),
      );

      await expect(
        controller.create(createDto as any, mockUserId, mockTenantId, mockIpAddress),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    const updateDto = { amount: 250, description: 'Cuota actualizada' };

    it('should update a fee', async () => {
      const updated = { ...mockFee, amount: 250 };
      service.update.mockResolvedValue(updated);

      const result = await controller.update('fee-1', updateDto as any, mockUserId, mockTenantId, mockIpAddress);

      expect(result.amount).toEqual(250);
      expect(service.update).toHaveBeenCalledWith(
        mockTenantId,
        'fee-1',
        updateDto,
        { userId: mockUserId, tenantId: mockTenantId, ipAddress: mockIpAddress },
      );
    });

    it('should throw BadRequestException if fee is already PAID', async () => {
      service.update.mockRejectedValue(
        new BadRequestException('No se puede modificar una cuota pagada'),
      );

      await expect(
        controller.update('fee-1', updateDto as any, mockUserId, mockTenantId, mockIpAddress),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    const statusDto = { toStatus: FeeStatus.PAID, paidAmount: 200 };

    it('should change fee status', async () => {
      const paid = { ...mockFee, status: FeeStatus.PAID, paidAmount: 200, paidAt: new Date(), unitIdentifier: '101', unitTowerName: 'Torre A', propertyName: 'Conjunto Example' };
      service.updateStatus.mockResolvedValue(paid);

      const result = await controller.updateStatus('fee-1', statusDto as any, mockUserId, mockTenantId, mockIpAddress);

      expect(result.status).toEqual(FeeStatus.PAID);
      expect(service.updateStatus).toHaveBeenCalledWith(
        mockTenantId,
        'fee-1',
        statusDto,
        { userId: mockUserId, tenantId: mockTenantId, ipAddress: mockIpAddress },
      );
    });

    it('should reject invalid status transitions', async () => {
      // Try to go from PAID back to PENDING (invalid)
      service.updateStatus.mockRejectedValue(
        new BadRequestException('Transición de estado no válida: PAID → PENDING'),
      );

      await expect(
        controller.updateStatus(
          'fee-1',
          { toStatus: FeeStatus.PENDING, paidAmount: 0 } as any,
          mockUserId,
          mockTenantId,
          mockIpAddress,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if fee not found', async () => {
      service.updateStatus.mockRejectedValue(new NotFoundException());

      await expect(
        controller.updateStatus('invalid-id', statusDto as any, mockUserId, mockTenantId, mockIpAddress),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
