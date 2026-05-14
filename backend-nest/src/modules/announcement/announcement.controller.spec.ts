import { Test, TestingModule } from '@nestjs/testing';
import { AnnouncementController } from './announcement.controller';
import { AnnouncementService } from './announcement.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from '../../common/testing/mock-guards';
import { PrismaService } from '../../config/prisma.service';
import { AnnouncementPriority } from '@prisma/client';

describe('AnnouncementController', () => {
  let controller: AnnouncementController;
  let service: AnnouncementService;

  const mockAnnouncementService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockPrismaService = {
    rolePermission: {
      findFirst: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnnouncementController],
      providers: [
        {
          provide: AnnouncementService,
          useValue: mockAnnouncementService,
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

    controller = module.get<AnnouncementController>(AnnouncementController);
    service = module.get<AnnouncementService>(AnnouncementService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an announcement', async () => {
      const createDto = {
        title: 'Test Announcement',
        content: 'Test Content',
        priority: AnnouncementPriority.NORMAL,
      };
      const mockResult = { id: 'uuid', title: 'Test Announcement' };
      mockAnnouncementService.create.mockResolvedValue(mockResult);

      const result = await controller.create(createDto, 'user-id', 'tenant-id', '127.0.0.1');
      expect(result).toEqual(mockResult);
      expect(service.create).toHaveBeenCalledWith(createDto, 'user-id', 'tenant-id', {
        userId: 'user-id',
        tenantId: 'tenant-id',
        ipAddress: '127.0.0.1',
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated announcements with role filter', async () => {
      const filters = { page: 1, limit: 20 };
      const mockResult = {
        data: [{ id: 'uuid', title: 'Test' }],
        total: 1,
        page: 1,
        limit: 20,
      };
      mockAnnouncementService.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(filters, 'tenant-id', 'ADMINISTRATIVA');
      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(filters, 'tenant-id', 'ADMINISTRATIVA');
    });
  });

  describe('findById', () => {
    it('should return an announcement by id', async () => {
      const mockResult = { id: 'uuid', title: 'Test' };
      mockAnnouncementService.findById.mockResolvedValue(mockResult);

      const result = await controller.findById('uuid', 'tenant-id');
      expect(result).toEqual(mockResult);
      expect(service.findById).toHaveBeenCalledWith('uuid', 'tenant-id');
    });
  });

  describe('update', () => {
    it('should update an announcement', async () => {
      const updateDto = { title: 'Updated Title' };
      const mockResult = { id: 'uuid', title: 'Updated Title' };
      mockAnnouncementService.update.mockResolvedValue(mockResult);

      const result = await controller.update('uuid', updateDto, 'user-id', 'tenant-id', '127.0.0.1');
      expect(result).toEqual(mockResult);
      expect(service.update).toHaveBeenCalledWith('uuid', updateDto, 'tenant-id', {
        userId: 'user-id',
        tenantId: 'tenant-id',
        ipAddress: '127.0.0.1',
      });
    });
  });

  describe('remove', () => {
    it('should soft delete an announcement', async () => {
      const mockResult = { message: 'Anuncio eliminado correctamente' };
      mockAnnouncementService.softDelete.mockResolvedValue(mockResult);

      const result = await controller.remove('uuid', 'user-id', 'tenant-id', '127.0.0.1');
      expect(result).toEqual(mockResult);
      expect(service.softDelete).toHaveBeenCalledWith('uuid', 'tenant-id', {
        userId: 'user-id',
        tenantId: 'tenant-id',
        ipAddress: '127.0.0.1',
      });
    });
  });
});
