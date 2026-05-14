import { Test, TestingModule } from '@nestjs/testing';
import { TowerController } from './tower.controller';
import { TowerService } from './tower.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from '../../common/testing/mock-guards';
import { PrismaService } from '../../config/prisma.service';

describe('TowerController', () => {
  let controller: TowerController;
  let service: TowerService;

  const mockTowerService = {
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

  const mockTower = {
    id: 'tower-uuid',
    tenantId: 'tenant-uuid',
    propertyId: 'property-uuid',
    name: 'Torre A',
    floorsCount: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TowerController],
      providers: [
        {
          provide: TowerService,
          useValue: mockTowerService,
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

    controller = module.get<TowerController>(TowerController);
    service = module.get<TowerService>(TowerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated towers for a property', async () => {
      const propertyId = 'property-uuid';
      const tenantId = 'tenant-uuid';
      const filters = { propertyId, page: 1, limit: 10 };
      const expectedResult = {
        data: [mockTower],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockTowerService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(propertyId, filters, tenantId);

      expect(service.findAll).toHaveBeenCalledWith(tenantId, filters);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('create', () => {
    it('should create a new tower under a property', async () => {
      const propertyId = 'property-uuid';
      const tenantId = 'tenant-uuid';
      const userId = 'creator-uuid';
      const ipAddress = '127.0.0.1';
      const createDto = {
        name: 'Torre A',
        floorsCount: 10,
        propertyId,
      };

      mockTowerService.create.mockResolvedValue(mockTower);

      const result = await controller.create(
        propertyId,
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
      expect(result).toEqual(mockTower);
    });
  });

  describe('update', () => {
    it('should update a tower', async () => {
      const towerId = 'tower-uuid';
      const tenantId = 'tenant-uuid';
      const creatorId = 'creator-uuid';
      const ipAddress = '127.0.0.1';
      const updateDto = { name: 'Updated Tower' };

      mockTowerService.update.mockResolvedValue({
        ...mockTower,
        name: 'Updated Tower',
      });

      const result = await controller.update(
        towerId,
        updateDto,
        creatorId,
        tenantId,
        ipAddress,
      );

      expect(service.update).toHaveBeenCalledWith(tenantId, towerId, updateDto, {
        userId: creatorId,
        tenantId,
        ipAddress,
      });
      expect(result.name).toBe('Updated Tower');
    });
  });

  describe('softDelete', () => {
    it('should soft delete a tower', async () => {
      const towerId = 'tower-uuid';
      const tenantId = 'tenant-uuid';
      const creatorId = 'creator-uuid';
      const ipAddress = '127.0.0.1';

      mockTowerService.softDelete.mockResolvedValue({
        ...mockTower,
        deletedAt: new Date(),
      });

      const result = await controller.softDelete(towerId, creatorId, tenantId, ipAddress);

      expect(service.softDelete).toHaveBeenCalledWith(tenantId, towerId, {
        userId: creatorId,
        tenantId,
        ipAddress,
      });
      expect(result.deletedAt).toBeDefined();
    });
  });
});