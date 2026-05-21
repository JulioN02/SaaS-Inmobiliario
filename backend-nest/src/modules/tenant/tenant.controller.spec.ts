import { Test, TestingModule } from '@nestjs/testing';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';
import { TenantPlan, TenantStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from '../../common/testing/mock-guards';
import { PrismaService } from '../../config/prisma.service';

describe('TenantController', () => {
  let controller: TenantController;
  let service: TenantService;

  const mockTenantService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    suspend: jest.fn(),
    activate: jest.fn(),
    changePlan: jest.fn(),
    remove: jest.fn(),
  };

  const mockPrismaService = {
    rolePermission: {
      findFirst: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantController],
      providers: [
        {
          provide: TenantService,
          useValue: mockTenantService,
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

    controller = module.get<TenantController>(TenantController);
    service = module.get<TenantService>(TenantService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated tenants', async () => {
      const filters = { page: 1, limit: 10 };
      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockTenantService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findById', () => {
    it('should return a tenant by id', async () => {
      const tenantId = 'tenant-uuid';
      const expectedResult = {
        id: tenantId,
        name: 'Test Tenant',
        subdomain: 'test',
        plan: TenantPlan.BASIC,
        status: TenantStatus.ACTIVE,
      };

      mockTenantService.findById.mockResolvedValue(expectedResult);

      const result = await controller.findById(tenantId);

      expect(service.findById).toHaveBeenCalledWith(tenantId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('create', () => {
    it('should create a new tenant with admin user and website config', async () => {
      const createDto = {
        name: 'New Tenant',
        subdomain: 'newtenant',
        plan: TenantPlan.PREMIUM,
      };
      const userId = 'user-uuid';
      const expectedResult = {
        id: 'new-tenant-uuid',
        ...createDto,
        status: TenantStatus.ACTIVE,
        contactEmail: null,
        contactPhone: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        adminEmail: 'admin@newtenant.com',
        adminPassword: 'a1b2c3d4',
      };

      mockTenantService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, userId);

      expect(service.create).toHaveBeenCalledWith(createDto, { userId });
      expect(result).toEqual(expectedResult);
    });

    it('should use contactEmail as admin email if provided', async () => {
      const createDto = {
        name: 'New Tenant',
        subdomain: 'newtenant',
        plan: TenantPlan.PREMIUM,
        contactEmail: 'custom@example.com',
      };
      const userId = 'user-uuid';
      const expectedResult = {
        id: 'new-tenant-uuid-2',
        name: 'New Tenant',
        subdomain: 'newtenant',
        plan: TenantPlan.PREMIUM,
        status: TenantStatus.ACTIVE,
        contactEmail: 'custom@example.com',
        contactPhone: null,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        adminEmail: 'custom@example.com',
        adminPassword: 'x9y8z7w6',
      };

      mockTenantService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto, userId);

      expect(service.create).toHaveBeenCalledWith(createDto, { userId });
      expect(result.adminEmail).toBe('custom@example.com');
      expect(result.adminPassword).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update a tenant', async () => {
      const tenantId = 'tenant-uuid';
      const updateDto = { name: 'Updated Name' };
      const userId = 'user-uuid';
      const expectedResult = {
        id: tenantId,
        name: 'Updated Name',
        subdomain: 'test',
      };

      mockTenantService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(tenantId, updateDto, userId);

      expect(service.update).toHaveBeenCalledWith(tenantId, updateDto, { userId });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('suspend', () => {
    it('should suspend a tenant', async () => {
      const tenantId = 'tenant-uuid';
      const userId = 'user-uuid';
      const expectedResult = { id: tenantId, status: TenantStatus.SUSPENDED };

      mockTenantService.suspend.mockResolvedValue(expectedResult);

      const result = await controller.suspend(tenantId, userId);

      expect(service.suspend).toHaveBeenCalledWith(tenantId, { userId });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('activate', () => {
    it('should activate a tenant', async () => {
      const tenantId = 'tenant-uuid';
      const userId = 'user-uuid';
      const expectedResult = { id: tenantId, status: TenantStatus.ACTIVE };

      mockTenantService.activate.mockResolvedValue(expectedResult);

      const result = await controller.activate(tenantId, userId);

      expect(service.activate).toHaveBeenCalledWith(tenantId, { userId });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('changePlan', () => {
    it('should change tenant plan', async () => {
      const tenantId = 'tenant-uuid';
      const newPlan = TenantPlan.ENTERPRISE;
      const userId = 'user-uuid';
      const expectedResult = { id: tenantId, plan: newPlan };

      mockTenantService.changePlan.mockResolvedValue(expectedResult);

      const result = await controller.changePlan(tenantId, newPlan, userId);

      expect(service.changePlan).toHaveBeenCalledWith(tenantId, newPlan, { userId });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should remove a tenant', async () => {
      const tenantId = 'tenant-uuid';
      const userId = 'user-uuid';
      const expectedResult = { id: tenantId, deletedAt: new Date() };

      mockTenantService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(tenantId, userId);

      expect(service.remove).toHaveBeenCalledWith(tenantId, { userId });
      expect(result).toEqual(expectedResult);
    });
  });
});
