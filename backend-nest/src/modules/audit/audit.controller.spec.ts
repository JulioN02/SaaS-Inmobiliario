import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { JwtAuthGuard, TenantGuard } from '../../common/guards';
import { UserRole } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

describe('AuditController', () => {
  let controller: AuditController;
  let service: AuditService;

  const mockAuditService = {
    findAll: jest.fn(),
    findById: jest.fn(),
  };

  const mockAuditLog = {
    id: 'log-123',
    tenantId: 'tenant-123',
    userId: 'user-123',
    userInfo: {
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@ejemplo.com',
    },
    entity: 'user',
    entityId: 'entity-123',
    action: 'CREATE',
    snapshot: { email: 'juan@ejemplo.com' },
    ipAddress: '127.0.0.1',
    createdAt: new Date('2026-05-05'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuditController>(AuditController);
    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return audit logs for SUPER_ADMIN', async () => {
      const mockResult = {
        data: [mockAuditLog],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      mockAuditService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(
        {},
        'any-tenant-id',
        UserRole.SUPER_ADMIN,
      );

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(
        {},
        'any-tenant-id',
        UserRole.SUPER_ADMIN,
      );
    });

    it('should return audit logs for ADMIN_TENANT (only their tenant)', async () => {
      const mockResult = {
        data: [mockAuditLog],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      mockAuditService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(
        {},
        'tenant-123',
        UserRole.ADMIN_TENANT,
      );

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(
        {},
        'tenant-123',
        UserRole.ADMIN_TENANT,
      );
    });

    it('should throw ForbiddenException for non-admin roles', async () => {
      await expect(
        controller.findAll({}, 'tenant-123', UserRole.ADMINISTRATIVA),
      ).rejects.toThrow(ForbiddenException);

      expect(service.findAll).not.toHaveBeenCalled();
    });

    it('should apply filters correctly', async () => {
      const filters = {
        entity: 'user' as any,
        action: 'CREATE' as any,
        page: 2,
        limit: 10,
      };
      const mockResult = {
        data: [mockAuditLog],
        total: 1,
        page: 2,
        limit: 10,
        totalPages: 1,
      };
      mockAuditService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(
        filters,
        'tenant-123',
        UserRole.SUPER_ADMIN,
      );

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(
        filters,
        'tenant-123',
        UserRole.SUPER_ADMIN,
      );
    });
  });

  describe('findById', () => {
    it('should return audit log by id for SUPER_ADMIN', async () => {
      mockAuditService.findById.mockResolvedValue(mockAuditLog);

      const result = await controller.findById(
        'log-123',
        'any-tenant-id',
        UserRole.SUPER_ADMIN,
      );

      expect(result).toEqual(mockAuditLog);
      expect(service.findById).toHaveBeenCalledWith(
        'log-123',
        'any-tenant-id',
        UserRole.SUPER_ADMIN,
      );
    });

    it('should return audit log by id for ADMIN_TENANT', async () => {
      mockAuditService.findById.mockResolvedValue(mockAuditLog);

      const result = await controller.findById(
        'log-123',
        'tenant-123',
        UserRole.ADMIN_TENANT,
      );

      expect(result).toEqual(mockAuditLog);
      expect(service.findById).toHaveBeenCalledWith(
        'log-123',
        'tenant-123',
        UserRole.ADMIN_TENANT,
      );
    });

    it('should throw ForbiddenException for non-admin roles', async () => {
      await expect(
        controller.findById('log-123', 'tenant-123', UserRole.PORTERIA),
      ).rejects.toThrow(ForbiddenException);

      expect(service.findById).not.toHaveBeenCalled();
    });
  });
});
