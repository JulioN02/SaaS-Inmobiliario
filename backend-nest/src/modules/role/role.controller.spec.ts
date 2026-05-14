import { Test, TestingModule } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from '../../common/testing/mock-guards';
import { PrismaService } from '../../config/prisma.service';

describe('RoleController', () => {
  let controller: RoleController;
  let service: RoleService;

  const mockRoleService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    updatePermissions: jest.fn(),
  };

  const mockPrismaService = {
    rolePermission: {
      findFirst: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [
        {
          provide: RoleService,
          useValue: mockRoleService,
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

    controller = module.get<RoleController>(RoleController);
    service = module.get<RoleService>(RoleService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return array of roles', async () => {
      const expectedResult = [
        {
          id: 'role-1',
          name: UserRole.SUPER_ADMIN,
          description: 'Super admin role',
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockRoleService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findById', () => {
    it('should return a role by id', async () => {
      const roleId = 'role-uuid';
      const expectedResult = {
        id: roleId,
        name: UserRole.ADMIN_TENANT,
        description: 'Tenant admin',
        permissions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRoleService.findById.mockResolvedValue(expectedResult);

      const result = await controller.findById(roleId);

      expect(service.findById).toHaveBeenCalledWith(roleId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updatePermissions', () => {
    it('should update permissions for a role', async () => {
      const roleId = 'role-uuid';
      const permissionIds = ['perm-1', 'perm-2'];
      const userId = 'user-uuid';
      const tenantId = 'tenant-uuid';
      const ipAddress = '127.0.0.1';
      const expectedResult = {
        id: roleId,
        name: UserRole.ADMIN_TENANT,
        description: 'Tenant admin',
        permissions: [
          { id: 'perm-1', resource: 'users', action: 'read' },
          { id: 'perm-2', resource: 'users', action: 'create' },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRoleService.updatePermissions.mockResolvedValue(expectedResult);

      const result = await controller.updatePermissions(
        roleId,
        permissionIds,
        userId,
        tenantId,
        ipAddress,
      );

      expect(service.updatePermissions).toHaveBeenCalledWith(
        roleId,
        permissionIds,
        { userId, tenantId, ipAddress },
      );
      expect(result).toEqual(expectedResult);
    });
  });
});