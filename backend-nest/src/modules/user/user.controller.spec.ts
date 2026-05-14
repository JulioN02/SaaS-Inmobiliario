import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from '../../common/testing/mock-guards';
import { PrismaService } from '../../config/prisma.service';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUserService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    suspend: jest.fn(),
    activate: jest.fn(),
    assignRole: jest.fn(),
  };

  const mockPrismaService = {
    rolePermission: {
      findFirst: jest.fn().mockResolvedValue({}),
    },
  };

  const mockUser = {
    id: 'user-uuid',
    tenantId: 'tenant-uuid',
    roleId: 'role-uuid',
    email: 'test@example.com',
    role: UserRole.ADMIN_TENANT,
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
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

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const tenantId = 'tenant-uuid';
      const filters = { page: 1, limit: 10 };
      const expectedResult = {
        data: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockUserService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(filters, tenantId);

      expect(service.findAll).toHaveBeenCalledWith(tenantId, filters);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findById', () => {
    it('should return a user by id', async () => {
      const userId = 'user-uuid';
      const tenantId = 'tenant-uuid';

      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await controller.findById(userId, tenantId);

      expect(service.findById).toHaveBeenCalledWith(tenantId, userId);
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const tenantId = 'tenant-uuid';
      const userId = 'creator-uuid';
      const ipAddress = '127.0.0.1';
      const createDto = {
        email: 'new@example.com',
        password: 'Password123!',
        roleId: 'role-uuid',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      mockUserService.create.mockResolvedValue(mockUser);

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
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = 'user-uuid';
      const tenantId = 'tenant-uuid';
      const creatorId = 'creator-uuid';
      const ipAddress = '127.0.0.1';
      const updateDto = { firstName: 'Updated' };

      mockUserService.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Updated',
      });

      const result = await controller.update(
        userId,
        updateDto,
        creatorId,
        tenantId,
        ipAddress,
      );

      expect(service.update).toHaveBeenCalledWith(tenantId, userId, updateDto, {
        userId: creatorId,
        tenantId,
        ipAddress,
      });
      expect(result.firstName).toBe('Updated');
    });
  });

  describe('suspend', () => {
    it('should suspend a user', async () => {
      const userId = 'user-uuid';
      const tenantId = 'tenant-uuid';
      const creatorId = 'creator-uuid';
      const ipAddress = '127.0.0.1';

      mockUserService.suspend.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await controller.suspend(userId, creatorId, tenantId, ipAddress);

      expect(service.suspend).toHaveBeenCalledWith(tenantId, userId, {
        userId: creatorId,
        tenantId,
        ipAddress,
      });
      expect(result.isActive).toBe(false);
    });
  });

  describe('activate', () => {
    it('should activate a user', async () => {
      const userId = 'user-uuid';
      const tenantId = 'tenant-uuid';
      const creatorId = 'creator-uuid';
      const ipAddress = '127.0.0.1';

      const suspendedUser = { ...mockUser, isActive: false };
      mockUserService.activate.mockResolvedValue({
        ...suspendedUser,
        isActive: true,
      });

      const result = await controller.activate(userId, creatorId, tenantId, ipAddress);

      expect(service.activate).toHaveBeenCalledWith(tenantId, userId, {
        userId: creatorId,
        tenantId,
        ipAddress,
      });
      expect(result.isActive).toBe(true);
    });
  });

  describe('assignRole', () => {
    it('should assign role to a user', async () => {
      const userId = 'user-uuid';
      const tenantId = 'tenant-uuid';
      const creatorId = 'creator-uuid';
      const ipAddress = '127.0.0.1';
      const roleId = 'new-role-uuid';

      mockUserService.assignRole.mockResolvedValue({
        ...mockUser,
        roleId,
      });

      const result = await controller.assignRole(
        userId,
        roleId,
        creatorId,
        tenantId,
        ipAddress,
      );

      expect(service.assignRole).toHaveBeenCalledWith(tenantId, userId, roleId, {
        userId: creatorId,
        tenantId,
        ipAddress,
      });
      expect(result.roleId).toBe(roleId);
    });
  });
});