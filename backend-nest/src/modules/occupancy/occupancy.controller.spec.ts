import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException, NotFoundException, MethodNotAllowedException } from '@nestjs/common';
import { OccupancyController } from './occupancy.controller';
import { OccupancyService } from './occupancy.service';
import { OccupancyType } from '../../shared/types/enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from '../../common/testing/mock-guards';
import { PrismaService } from '../../config/prisma.service';

describe('OccupancyController', () => {
  let controller: OccupancyController;
  let service: jest.Mocked<OccupancyService>;

  const mockTenantId = 'tenant-123';
  const mockUser = { userId: 'user-123', ipAddress: '127.0.0.1' };
  const mockOccupancy = {
    id: 'occupancy-1',
    tenantId: mockTenantId,
    unitId: 'unit-1',
    residentId: 'resident-1',
    type: OccupancyType.OWNER,
    startDate: new Date('2024-01-01'),
    endDate: null,
    notes: 'Test note',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    rolePermission: {
      findFirst: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OccupancyController],
      providers: [
        {
          provide: OccupancyService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            close: jest.fn(),
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

    controller = module.get<OccupancyController>(OccupancyController);
    service = module.get(OccupancyService);
  });

  describe('findAll', () => {
    it('should return paginated occupancies', async () => {
      const mockResult = {
        data: [mockOccupancy],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(mockTenantId, { page: 1, limit: 10 });

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(mockTenantId, { page: 1, limit: 10 });
    });

    it('should filter by unitId, residentId, type, active', async () => {
      const filters = { unitId: 'unit-1', active: true, page: 1, limit: 10 };
      service.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });

      await controller.findAll(mockTenantId, filters as any);

      expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
    });
  });

  describe('findOne', () => {
    it('should return an occupancy by id', async () => {
      service.findById.mockResolvedValue(mockOccupancy);

      const result = await controller.findOne(mockTenantId, 'occupancy-1');

      expect(result).toEqual(mockOccupancy);
      expect(service.findById).toHaveBeenCalledWith(mockTenantId, 'occupancy-1');
    });

    it('should throw NotFoundException if not found', async () => {
      service.findById.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(mockTenantId, 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      unitId: 'unit-1',
      residentId: 'resident-1',
      type: OccupancyType.OWNER,
      startDate: '2024-01-01',
    };

    it('should create an occupancy', async () => {
      service.create.mockResolvedValue(mockOccupancy);

      const result = await controller.create(mockTenantId, mockUser, createDto as any);

      expect(result).toEqual(mockOccupancy);
      expect(service.create).toHaveBeenCalledWith(mockTenantId, createDto, {
        userId: mockUser.userId,
        tenantId: mockTenantId,
        ipAddress: mockUser.ipAddress,
      });
    });

    it('should throw ConflictException on overlapping', async () => {
      service.create.mockRejectedValue(new ConflictException('El residente ya tiene una ocupación activa'));

      await expect(controller.create(mockTenantId, mockUser, createDto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('close', () => {
    const closeDto = { endDate: '2024-12-31' };

    it('should close an occupancy', async () => {
      const closed = { ...mockOccupancy, endDate: new Date('2024-12-31') };
      service.close.mockResolvedValue(closed);

      const result = await controller.close(mockTenantId, 'occupancy-1', mockUser, closeDto as any);

      expect(result.endDate).toEqual(new Date('2024-12-31'));
      expect(service.close).toHaveBeenCalledWith(mockTenantId, 'occupancy-1', closeDto, {
        userId: mockUser.userId,
        tenantId: mockTenantId,
        ipAddress: mockUser.ipAddress,
      });
    });

    it('should throw BadRequestException if already closed', async () => {
      service.close.mockRejectedValue(new BadRequestException('La ocupación ya está cerrada'));

      await expect(controller.close(mockTenantId, 'occupancy-1', mockUser, closeDto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove (DELETE)', () => {
    it('should throw MethodNotAllowedException', async () => {
      await expect(controller.remove()).rejects.toThrow(MethodNotAllowedException);
    });
  });
});