import { Test, TestingModule } from '@nestjs/testing';
import { WebsiteController } from './website.controller';
import { WebsiteService } from './website.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from '../../common/testing/mock-guards';
import { PrismaService } from '../../config/prisma.service';
import { UpdateWebsiteDto } from './dto';

describe('WebsiteController', () => {
  let controller: WebsiteController;
  let service: WebsiteService;

  const mockWebsiteService = {
    findOrCreateByTenantId: jest.fn(),
    update: jest.fn(),
    toggleMaintenance: jest.fn(),
  };

  const mockPrismaService = {
    rolePermission: {
      findFirst: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebsiteController],
      providers: [
        {
          provide: WebsiteService,
          useValue: mockWebsiteService,
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

    controller = module.get<WebsiteController>(WebsiteController);
    service = module.get<WebsiteService>(WebsiteService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getConfig', () => {
    it('should return website config (public endpoint)', async () => {
      const mockResult = {
        id: 'uuid-config',
        tenantId: 'tenant-id',
        siteTitle: 'Portal Inmobiliario',
        primaryColor: '#2563EB',
        secondaryColor: '#10B981',
        backgroundColor: '#FFFFFF',
        isMaintenanceMode: false,
        isPublic: true,
      };
      mockWebsiteService.findOrCreateByTenantId.mockResolvedValue(mockResult);

      const result = await controller.getConfig('tenant-id');
      expect(result).toEqual(mockResult);
      expect(service.findOrCreateByTenantId).toHaveBeenCalledWith('tenant-id');
    });

    it('should create config if it does not exist', async () => {
      const mockResult = {
        id: 'uuid-config',
        tenantId: 'tenant-id',
        siteTitle: 'Portal Inmobiliario',
        primaryColor: '#2563EB',
        secondaryColor: '#10B981',
        backgroundColor: '#FFFFFF',
        isMaintenanceMode: false,
        isPublic: true,
      };
      mockWebsiteService.findOrCreateByTenantId.mockResolvedValue(mockResult);

      const result = await controller.getConfig('tenant-id');
      expect(result).toEqual(mockResult);
      expect(service.findOrCreateByTenantId).toHaveBeenCalledWith('tenant-id');
    });
  });

  describe('updateConfig', () => {
    it('should update website config', async () => {
      const updateDto: UpdateWebsiteDto = {
        siteTitle: 'Updated Title',
        primaryColor: '#000000',
      };
      const mockResult = {
        id: 'uuid-config',
        tenantId: 'tenant-id',
        siteTitle: 'Updated Title',
        primaryColor: '#000000',
        secondaryColor: '#10B981',
        backgroundColor: '#FFFFFF',
        isMaintenanceMode: false,
        isPublic: true,
      };
      mockWebsiteService.update.mockResolvedValue(mockResult);

      const result = await controller.updateConfig(
        'tenant-id',
        'user-id',
        updateDto,
        '127.0.0.1',
      );
      expect(result).toEqual(mockResult);
      expect(service.update).toHaveBeenCalledWith('tenant-id', updateDto, {
        userId: 'user-id',
        tenantId: 'tenant-id',
        ipAddress: '127.0.0.1',
      });
    });
  });

  describe('toggleMaintenance', () => {
    it('should toggle maintenance mode', async () => {
      const mockResult = {
        id: 'uuid-config',
        tenantId: 'tenant-id',
        siteTitle: 'Portal Inmobiliario',
        primaryColor: '#2563EB',
        secondaryColor: '#10B981',
        backgroundColor: '#FFFFFF',
        isMaintenanceMode: true,
        isPublic: true,
      };
      mockWebsiteService.toggleMaintenance.mockResolvedValue(mockResult);

      const result = await controller.toggleMaintenance(
        'tenant-id',
        'user-id',
        '127.0.0.1',
      );
      expect(result).toEqual(mockResult);
      expect(service.toggleMaintenance).toHaveBeenCalledWith('tenant-id', {
        userId: 'user-id',
        tenantId: 'tenant-id',
        ipAddress: '127.0.0.1',
      });
    });
  });
});
