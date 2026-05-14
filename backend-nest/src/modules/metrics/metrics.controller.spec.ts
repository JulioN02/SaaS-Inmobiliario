import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { JwtAuthGuard, TenantGuard } from '../../common/guards';
import { UserRole } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

describe('MetricsController', () => {
  let controller: MetricsController;
  let service: MetricsService;

  const mockMetricsService = {
    getPlatformMetrics: jest.fn(),
    getTenantMetrics: jest.fn(),
  };

  const mockPlatformMetrics = {
    totalTenants: 50,
    activeTenants: 45,
    totalUsers: 500,
    totalProperties: 120,
    totalUnits: 1500,
    occupiedUnits: 1200,
    availableUnits: 250,
    maintenanceUnits: 50,
  };

  const mockTenantMetrics = {
    totalTenants: 1,
    activeTenants: 1,
    totalUsers: 10,
    totalProperties: 2,
    totalUnits: 100,
    occupiedUnits: 80,
    availableUnits: 15,
    maintenanceUnits: 5,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(TenantGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<MetricsController>(MetricsController);
    service = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPlatformMetrics', () => {
    it('should return platform metrics for SUPER_ADMIN', async () => {
      mockMetricsService.getPlatformMetrics.mockResolvedValue(mockPlatformMetrics);

      const result = await controller.getPlatformMetrics(UserRole.SUPER_ADMIN);

      expect(result).toEqual(mockPlatformMetrics);
      expect(service.getPlatformMetrics).toHaveBeenCalledWith(
        UserRole.SUPER_ADMIN,
      );
    });

    it('should throw ForbiddenException for non-SUPER_ADMIN roles', async () => {
      mockMetricsService.getPlatformMetrics.mockRejectedValue(
        new ForbiddenException('Solo SUPER_ADMIN puede ver métricas de la plataforma'),
      );

      await expect(
        controller.getPlatformMetrics(UserRole.ADMIN_TENANT),
      ).rejects.toThrow(ForbiddenException);

      expect(service.getPlatformMetrics).toHaveBeenCalledWith(
        UserRole.ADMIN_TENANT,
      );
    });

    it('should throw ForbiddenException for ADMINISTRATIVA', async () => {
      mockMetricsService.getPlatformMetrics.mockRejectedValue(
        new ForbiddenException('Solo SUPER_ADMIN puede ver métricas de la plataforma'),
      );

      await expect(
        controller.getPlatformMetrics(UserRole.ADMINISTRATIVA),
      ).rejects.toThrow(ForbiddenException);

      expect(service.getPlatformMetrics).toHaveBeenCalledWith(
        UserRole.ADMINISTRATIVA,
      );
    });
  });

  describe('getTenantMetrics', () => {
    it('should return tenant metrics for SUPER_ADMIN', async () => {
      mockMetricsService.getTenantMetrics.mockResolvedValue(mockTenantMetrics);

      const result = await controller.getTenantMetrics(
        'tenant-123',
        UserRole.SUPER_ADMIN,
        'any-tenant',
      );

      expect(result).toEqual(mockTenantMetrics);
      expect(service.getTenantMetrics).toHaveBeenCalledWith(
        'tenant-123',
        UserRole.SUPER_ADMIN,
        'any-tenant',
      );
    });

    it('should return tenant metrics for ADMIN_TENANT of same tenant', async () => {
      mockMetricsService.getTenantMetrics.mockResolvedValue(mockTenantMetrics);

      const result = await controller.getTenantMetrics(
        'tenant-123',
        UserRole.ADMIN_TENANT,
        'tenant-123', // Same tenant
      );

      expect(result).toEqual(mockTenantMetrics);
      expect(service.getTenantMetrics).toHaveBeenCalledWith(
        'tenant-123',
        UserRole.ADMIN_TENANT,
        'tenant-123',
      );
    });

    it('should throw ForbiddenException for ADMIN_TENANT of different tenant', async () => {
      mockMetricsService.getTenantMetrics.mockRejectedValue(
        new ForbiddenException('No tienes permiso para ver las métricas de este tenant'),
      );

      await expect(
        controller.getTenantMetrics(
          'tenant-456',
          UserRole.ADMIN_TENANT,
          'tenant-123', // Different tenant
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(service.getTenantMetrics).toHaveBeenCalledWith(
        'tenant-456',
        UserRole.ADMIN_TENANT,
        'tenant-123',
      );
    });

    it('should throw ForbiddenException for other roles', async () => {
      mockMetricsService.getTenantMetrics.mockRejectedValue(
        new ForbiddenException('No tienes permiso para ver las métricas de este tenant'),
      );

      await expect(
        controller.getTenantMetrics(
          'tenant-123',
          UserRole.PORTERIA,
          'tenant-123',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(service.getTenantMetrics).toHaveBeenCalledWith(
        'tenant-123',
        UserRole.PORTERIA,
        'tenant-123',
      );
    });
  });
});
