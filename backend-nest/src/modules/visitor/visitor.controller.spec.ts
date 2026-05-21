import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VisitorController } from './visitor.controller';
import { VisitorService } from './visitor.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from '../../common/testing/mock-guards';
import { PrismaService } from '../../config/prisma.service';

describe('VisitorController', () => {
  let controller: VisitorController;
  let service: jest.Mocked<VisitorService>;

  const mockTenantId = 'tenant-123';
  const mockUser = { userId: 'user-123', ipAddress: '127.0.0.1' };
  const mockVisitor = {
    id: 'visitor-1',
    tenantId: mockTenantId,
    unitId: 'unit-1',
    visitorName: 'Juan Pérez',
    documentNumber: null as unknown as string | null,
    entryDate: new Date(),
    exitDate: null as unknown as Date | null,
    notes: null as unknown as string | null,
    registeredBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    unitNumber: '101' as const,
    towerName: 'Torre A',
  };

  const mockPrismaService = {
    rolePermission: {
      findFirst: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VisitorController],
      providers: [
        {
          provide: VisitorService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            checkout: jest.fn(),
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

    controller = module.get<VisitorController>(VisitorController);
    service = module.get(VisitorService);
  });

  describe('findAll', () => {
    it('should return paginated visitors', async () => {
      const mockResult = {
        data: [mockVisitor] as any,
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

    it('should filter by unitId', async () => {
      const filters = { unitId: 'unit-1', page: 1, limit: 20 };
      service.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });

      await controller.findAll(mockTenantId, filters as any);

      expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
    });
  });

  describe('findOne', () => {
    it('should return a visitor by id', async () => {
      service.findById.mockResolvedValue(mockVisitor as any);

      const result = await controller.findOne(mockTenantId, 'visitor-1');

      expect(result).toEqual(mockVisitor);
      expect(service.findById).toHaveBeenCalledWith(mockTenantId, 'visitor-1');
    });

    it('should throw NotFoundException if not found', async () => {
      service.findById.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(mockTenantId, 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      unitId: 'unit-1',
      visitorName: 'Juan Pérez',
      documentNumber: '12345678',
    };

    it('should register a new visitor', async () => {
      service.create.mockResolvedValue(mockVisitor);

      const result = await controller.create(mockTenantId, mockUser.userId, mockUser.ipAddress, createDto as any);

      expect(result).toEqual(mockVisitor);
      expect(service.create).toHaveBeenCalledWith(mockTenantId, createDto, {
        userId: mockUser.userId,
        tenantId: mockTenantId,
        ipAddress: mockUser.ipAddress,
      });
    });

    it('should throw NotFoundException if unit not found', async () => {
      service.create.mockRejectedValue(new NotFoundException('Unidad no encontrada'));

      await expect(
        controller.create(mockTenantId, mockUser.userId, mockUser.ipAddress, createDto as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkout', () => {
    const checkoutDto = { exitDate: new Date().toISOString() };

    it('should process visitor checkout', async () => {
      const checkedOut = { ...mockVisitor, exitDate: new Date(checkoutDto.exitDate) };
      service.checkout.mockResolvedValue(checkedOut as any);

      const result = await controller.checkout(mockTenantId, 'visitor-1', mockUser.userId, mockUser.ipAddress, checkoutDto as any);

      expect(result.exitDate).toEqual(new Date(checkoutDto.exitDate));
      expect(service.checkout).toHaveBeenCalledWith(
        mockTenantId,
        'visitor-1',
        checkoutDto,
        {
          userId: mockUser.userId,
          tenantId: mockTenantId,
          ipAddress: mockUser.ipAddress,
        },
      );
    });

    it('should throw BadRequestException if already checked out', async () => {
      service.checkout.mockRejectedValue(
        new BadRequestException('El visitante ya ha salido'),
      );

      await expect(
        controller.checkout(mockTenantId, 'visitor-1', mockUser.userId, mockUser.ipAddress, checkoutDto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if visitor not found', async () => {
      service.checkout.mockRejectedValue(new NotFoundException());

      await expect(
        controller.checkout(mockTenantId, 'invalid-id', mockUser.userId, mockUser.ipAddress, checkoutDto as any),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
