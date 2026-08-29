import { Test, TestingModule } from '@nestjs/testing';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from '../../common/testing/mock-guards';
import { PrismaService } from '../../config/prisma.service';

describe('PlanController', () => {
  let controller: PlanController;
  let service: PlanService;

  const mockPlanService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findActive: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    toggleActive: jest.fn(),
  };

  const mockPrismaService = {
    rolePermission: {
      findFirst: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanController],
      providers: [
        {
          provide: PlanService,
          useValue: mockPlanService,
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

    controller = module.get<PlanController>(PlanController);
    service = module.get<PlanService>(PlanService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated plans', async () => {
      const filters = { page: 1, limit: 10 };
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockPlanService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(expectedResult);
    });

    it('should pass isActive filter to service', async () => {
      const filters = { page: 1, limit: 10, isActive: true };
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockPlanService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findActive', () => {
    it('should return active plans', async () => {
      const expectedResult = [
        {
          id: 'plan-1',
          name: 'Básico',
          slug: 'basic',
          isActive: true,
          sortOrder: 1,
        },
      ];

      mockPlanService.findActive.mockResolvedValue(expectedResult);

      const result = await controller.findActive();

      expect(service.findActive).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findById', () => {
    it('should return a plan by id', async () => {
      const planId = 'plan-uuid';
      const expectedResult = {
        id: planId,
        name: 'Básico',
        slug: 'basic',
        isActive: true,
      };

      mockPlanService.findById.mockResolvedValue(expectedResult);

      const result = await controller.findById(planId);

      expect(service.findById).toHaveBeenCalledWith(planId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('create', () => {
    it('should create a new plan', async () => {
      const createDto = {
        name: 'Básico',
        slug: 'basic',
        limits: { properties: 1, units: 100, users: 5 },
        prices: { monthly: 0, yearly: 0 },
        features: ['Sitio web público'],
      };
      const userId = 'user-uuid';
      const tenantId = 'tenant-uuid';
      const ipAddress = '127.0.0.1';
      const expectedResult = {
        id: 'new-plan-uuid',
        ...createDto,
        isActive: true,
        sortOrder: 0,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        deletedAt: null,
      };

      mockPlanService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, userId, tenantId, ipAddress);

      expect(service.create).toHaveBeenCalledWith(createDto, { userId, tenantId, ipAddress });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should update a plan', async () => {
      const planId = 'plan-uuid';
      const updateDto = { name: 'Updated Name' };
      const userId = 'user-uuid';
      const tenantId = 'tenant-uuid';
      const ipAddress = '127.0.0.1';
      const expectedResult = {
        id: planId,
        name: 'Updated Name',
        slug: 'basic',
      };

      mockPlanService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(planId, updateDto, userId, tenantId, ipAddress);

      expect(service.update).toHaveBeenCalledWith(planId, updateDto, { userId, tenantId, ipAddress });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should soft-delete a plan', async () => {
      const planId = 'plan-uuid';
      const userId = 'user-uuid';
      const tenantId = 'tenant-uuid';
      const ipAddress = '127.0.0.1';
      const expectedResult = {
        id: planId,
        deletedAt: new Date(),
      };

      mockPlanService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(planId, userId, tenantId, ipAddress);

      expect(service.remove).toHaveBeenCalledWith(planId, { userId, tenantId, ipAddress });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('toggleActive', () => {
    it('should toggle plan active status', async () => {
      const planId = 'plan-uuid';
      const userId = 'user-uuid';
      const tenantId = 'tenant-uuid';
      const ipAddress = '127.0.0.1';
      const expectedResult = {
        id: planId,
        isActive: false,
      };

      mockPlanService.toggleActive.mockResolvedValue(expectedResult);

      const result = await controller.toggleActive(planId, userId, tenantId, ipAddress);

      expect(service.toggleActive).toHaveBeenCalledWith(planId, { userId, tenantId, ipAddress });
      expect(result).toEqual(expectedResult);
    });
  });
});
