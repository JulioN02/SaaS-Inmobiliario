import { Test, TestingModule } from '@nestjs/testing';
import { UnitController } from './unit.controller';
import { UnitService } from './unit.service';
import { UnitType, UnitStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from '../../common/testing/mock-guards';
import { PrismaService } from '../../config/prisma.service';

describe('UnitController', () => {
  let controller: UnitController;
  let service: UnitService;

  const mockUnitService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockPrismaService = {
    rolePermission: {
      findFirst: jest.fn().mockResolvedValue({}),
    },
  };

  const mockUnit = {
    id: 'unit-uuid',
    tenantId: 'tenant-uuid',
    propertyId: 'property-uuid',
    towerId: 'tower-uuid',
    identifier: 'Apt-101',
    unitType: UnitType.APARTMENT,
    floor: 1,
    status: UnitStatus.AVAILABLE,
    monthlyFeeAmount: 150000.00,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnitController],
      providers: [
        {
          provide: UnitService,
          useValue: mockUnitService,
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

    controller = module.get<UnitController>(UnitController);
    service = module.get<UnitService>(UnitService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated units', async () => {
      const tenantId = 'tenant-uuid';
      const filters = { page: 1, limit: 10 };
      const expectedResult = {
        data: [mockUnit],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockUnitService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(filters, tenantId);

      expect(service.findAll).toHaveBeenCalledWith(tenantId, filters);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findById', () => {
    it('should return a unit by id', async () => {
      const unitId = 'unit-uuid';
      const tenantId = 'tenant-uuid';

      mockUnitService.findById.mockResolvedValue(mockUnit);

      const result = await controller.findById(unitId, tenantId);

      expect(service.findById).toHaveBeenCalledWith(tenantId, unitId);
      expect(result).toEqual(mockUnit);
    });
  });

  describe('create', () => {
    it('should create a new unit', async () => {
      const tenantId = 'tenant-uuid';
      const userId = 'creator-uuid';
      const ipAddress = '127.0.0.1';
      const createDto = {
        identifier: 'Apt-101',
        unitType: UnitType.APARTMENT,
        floor: 1,
        propertyId: 'property-uuid',
        towerId: 'tower-uuid',
        monthlyFeeAmount: 150000.00,
      };

      mockUnitService.create.mockResolvedValue(mockUnit);

      const result = await controller.create(
        createDto,
        userId,
        tenantId,
        ipAddress,
      );

      expect(service.create).toHaveBeenCalledWith(tenantId, createDto, {
        userId,
        tenantId,
        ipAddress,
      });
      expect(result).toEqual(mockUnit);
    });
  });

  describe('update', () => {
    it('should update a unit', async () => {
      const unitId = 'unit-uuid';
      const tenantId = 'tenant-uuid';
      const creatorId = 'creator-uuid';
      const ipAddress = '127.0.0.1';
      const updateDto = { identifier: 'Apt-102' };

      mockUnitService.update.mockResolvedValue({
        ...mockUnit,
        identifier: 'Apt-102',
      });

      const result = await controller.update(
        unitId,
        updateDto,
        creatorId,
        tenantId,
        ipAddress,
      );

      expect(service.update).toHaveBeenCalledWith(tenantId, unitId, updateDto, {
        userId: creatorId,
        tenantId,
        ipAddress,
      });
      expect(result.identifier).toBe('Apt-102');
    });
  });

  describe('softDelete', () => {
    it('should soft delete a unit', async () => {
      const unitId = 'unit-uuid';
      const tenantId = 'tenant-uuid';
      const creatorId = 'creator-uuid';
      const ipAddress = '127.0.0.1';

      mockUnitService.softDelete.mockResolvedValue({
        ...mockUnit,
        deletedAt: new Date(),
      });

      const result = await controller.softDelete(unitId, creatorId, tenantId, ipAddress);

      expect(service.softDelete).toHaveBeenCalledWith(tenantId, unitId, {
        userId: creatorId,
        tenantId,
        ipAddress,
      });
      expect(result.deletedAt).toBeDefined();
    });
  });
});