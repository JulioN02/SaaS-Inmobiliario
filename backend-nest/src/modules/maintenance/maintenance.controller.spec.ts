import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from '../../common/testing/mock-guards';
import { PrismaService } from '../../config/prisma.service';

describe('MaintenanceController', () => {
  let controller: MaintenanceController;
  let service: jest.Mocked<MaintenanceService>;

  const mockTenantId = 'tenant-123';
  const mockUser = { userId: 'user-123', ipAddress: '127.0.0.1' };
  const mockMaintenance = {
    id: 'maintenance-1',
    tenantId: mockTenantId,
    unitId: 'unit-1',
    title: 'Fuga en el baño',
    description: 'Hay una fuga de agua en el baño principal',
    status: MaintenanceStatus.PENDING,
    assignedTo: null,
    resolvedAt: null,
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    unitNumber: '101',
    towerName: 'Torre A',
  };

  const mockPrismaService = {
    rolePermission: {
      findFirst: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MaintenanceController],
      providers: [
        {
          provide: MaintenanceService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
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

    controller = module.get<MaintenanceController>(MaintenanceController);
    service = module.get(MaintenanceService);
  });

  describe('findAll', () => {
    it('should return paginated maintenance requests', async () => {
      const mockResult = {
        data: [mockMaintenance],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(mockTenantId, { page: 1, limit: 20 });

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(mockTenantId, { page: 1, limit: 20 });
    });

    it('should filter by unitId and status', async () => {
      const filters = { unitId: 'unit-1', status: MaintenanceStatus.PENDING, page: 1, limit: 20 };
      service.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });

      await controller.findAll(mockTenantId, filters as any);

      expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
    });
  });

  describe('findOne', () => {
    it('should return a maintenance request by id', async () => {
      service.findById.mockResolvedValue(mockMaintenance);

      const result = await controller.findOne(mockTenantId, 'maintenance-1');

      expect(result).toEqual(mockMaintenance);
      expect(service.findById).toHaveBeenCalledWith(mockTenantId, 'maintenance-1');
    });

    it('should throw NotFoundException if not found', async () => {
      service.findById.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(mockTenantId, 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      unitId: 'unit-1',
      title: 'Fuga en el baño',
      description: 'Hay una fuga de agua en el baño principal',
    };

    it('should create a maintenance request', async () => {
      service.create.mockResolvedValue(mockMaintenance);

      const result = await controller.create(mockTenantId, mockUser.userId, mockUser.ipAddress, createDto as any);

      expect(result).toEqual(mockMaintenance);
      expect(service.create).toHaveBeenCalledWith(mockTenantId, createDto, {
        userId: mockUser.userId,
        tenantId: mockTenantId,
        ipAddress: mockUser.ipAddress,
      });
    });

    it('should throw NotFoundException if unit not found', async () => {
      service.create.mockRejectedValue(new NotFoundException('Unidad no encontrada'));

      await expect(controller.create(mockTenantId, mockUser.userId, mockUser.ipAddress, createDto as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a maintenance request', async () => {
      const updated = { ...mockMaintenance, status: MaintenanceStatus.IN_PROGRESS };
      service.update.mockResolvedValue(updated);

      const result = await controller.update(
        mockTenantId,
        'maintenance-1',
        mockUser.userId,
        mockUser.ipAddress,
        { status: MaintenanceStatus.IN_PROGRESS } as any,
      );

      expect(result.status).toEqual(MaintenanceStatus.IN_PROGRESS);
      expect(service.update).toHaveBeenCalledWith(
        mockTenantId,
        'maintenance-1',
        { status: MaintenanceStatus.IN_PROGRESS },
        {
          userId: mockUser.userId,
          tenantId: mockTenantId,
          ipAddress: mockUser.ipAddress,
        },
      );
    });

    it('should allow valid state transitions', async () => {
      // PENDING -> IN_PROGRESS (valid)
      const inProgress = { ...mockMaintenance, status: MaintenanceStatus.IN_PROGRESS };
      service.update.mockResolvedValue(inProgress);

      const result = await controller.update(
        mockTenantId,
        'maintenance-1',
        mockUser.userId,
        mockUser.ipAddress,
        { status: MaintenanceStatus.IN_PROGRESS } as any,
      );

      expect(result.status).toEqual(MaintenanceStatus.IN_PROGRESS);
    });

    it('should reject invalid state transitions', async () => {
      // Try to go from PENDING directly to RESOLVED (invalid, must go through IN_PROGRESS)
      service.update.mockRejectedValue(
        new BadRequestException('Transición de estado inválida: PENDING → RESOLVED'),
      );

      await expect(
        controller.update(
          mockTenantId,
          'maintenance-1',
          mockUser.userId,
          mockUser.ipAddress,
          { status: MaintenanceStatus.RESOLVED } as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject transitions from CANCELLED', async () => {
      // Try to go from CANCELLED to anything (inmutable)
      service.update.mockRejectedValue(
        new BadRequestException('Estado actual es inmutable'),
      );

      await expect(
        controller.update(
          mockTenantId,
          'maintenance-1',
          mockUser.userId,
          mockUser.ipAddress,
          { status: MaintenanceStatus.IN_PROGRESS } as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject transitions from RESOLVED', async () => {
      // Try to go from RESOLVED to anything (inmutable)
      service.update.mockRejectedValue(
        new BadRequestException('Estado actual es inmutable'),
      );

      await expect(
        controller.update(
          mockTenantId,
          'maintenance-1',
          mockUser.userId,
          mockUser.ipAddress,
          { status: MaintenanceStatus.CANCELLED } as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow cancel from IN_PROGRESS', async () => {
      const inProgress = { ...mockMaintenance, status: MaintenanceStatus.IN_PROGRESS };
      const cancelled = { ...inProgress, status: MaintenanceStatus.CANCELLED };
      service.update.mockResolvedValue(cancelled);

      const result = await controller.update(
        mockTenantId,
        'maintenance-1',
        mockUser.userId,
        mockUser.ipAddress,
        { status: MaintenanceStatus.CANCELLED } as any,
      );

      expect(result.status).toEqual(MaintenanceStatus.CANCELLED);
    });
  });
});