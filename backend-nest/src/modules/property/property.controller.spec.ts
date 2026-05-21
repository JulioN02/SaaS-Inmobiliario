import { Test, TestingModule } from '@nestjs/testing';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';
import { PropertyType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from '../../common/testing/mock-guards';
import { PrismaService } from '../../config/prisma.service';

describe('PropertyController', () => {
  let controller: PropertyController;
  let service: PropertyService;

  const mockPropertyService = {
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

  const mockProperty = {
    id: 'property-uuid',
    tenantId: 'tenant-uuid',
    name: 'Conjunto Residencial Las Palmas',
    address: 'Calle 123 #45-67',
    propertyType: PropertyType.CONJUNTO,
    description: 'Conjunto residencial con áreas comunes',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyController],
      providers: [
        {
          provide: PropertyService,
          useValue: mockPropertyService,
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

    controller = module.get<PropertyController>(PropertyController);
    service = module.get<PropertyService>(PropertyService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated properties', async () => {
      const tenantId = 'tenant-uuid';
      const filters = { page: 1, limit: 10 };
      const expectedResult = {
        data: [mockProperty],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockPropertyService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(filters, tenantId);

      expect(service.findAll).toHaveBeenCalledWith(tenantId, filters);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findById', () => {
    it('should return a property by id', async () => {
      const propertyId = 'property-uuid';
      const tenantId = 'tenant-uuid';

      mockPropertyService.findById.mockResolvedValue(mockProperty);

      const result = await controller.findById(propertyId, tenantId);

      expect(service.findById).toHaveBeenCalledWith(tenantId, propertyId);
      expect(result).toEqual(mockProperty);
    });
  });

  describe('create', () => {
    it('should create a new property', async () => {
      const tenantId = 'tenant-uuid';
      const userId = 'creator-uuid';
      const ipAddress = '127.0.0.1';
      const createDto = {
        name: 'Conjunto Residencial Las Palmas',
        address: 'Calle 123 #45-67',
        propertyType: PropertyType.CONJUNTO,
        description: 'Conjunto residencial con áreas comunes',
      };

      mockPropertyService.create.mockResolvedValue(mockProperty);

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
      expect(result).toEqual(mockProperty);
    });
  });

  describe('update', () => {
    it('should update a property', async () => {
      const propertyId = 'property-uuid';
      const tenantId = 'tenant-uuid';
      const creatorId = 'creator-uuid';
      const ipAddress = '127.0.0.1';
      const updateDto = { name: 'Updated Name' };

      mockPropertyService.update.mockResolvedValue({
        ...mockProperty,
        name: 'Updated Name',
      });

      const result = await controller.update(
        propertyId,
        updateDto,
        creatorId,
        tenantId,
        ipAddress,
      );

      expect(service.update).toHaveBeenCalledWith(tenantId, propertyId, updateDto, {
        userId: creatorId,
        tenantId,
        ipAddress,
      });
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('softDelete', () => {
    it('should soft delete a property', async () => {
      const propertyId = 'property-uuid';
      const tenantId = 'tenant-uuid';
      const creatorId = 'creator-uuid';
      const ipAddress = '127.0.0.1';

      mockPropertyService.softDelete.mockResolvedValue({
        ...mockProperty,
        deletedAt: new Date(),
      });

      const result = await controller.softDelete(propertyId, creatorId, tenantId, ipAddress);

      expect(service.softDelete).toHaveBeenCalledWith(tenantId, propertyId, {
        userId: creatorId,
        tenantId,
        ipAddress,
      });
      expect(result.deletedAt).toBeDefined();
    });
  });
});