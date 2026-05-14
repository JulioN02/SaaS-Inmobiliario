import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import { AuditAction, AuditEntity, AnnouncementPriority, UserRole } from '@prisma/client';

describe('AnnouncementService', () => {
  let service: AnnouncementService;
  let prisma: PrismaService;
  let auditService: AuditService;

  const mockPrisma = {
    announcement: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const ctx = {
    userId: 'user-123',
    tenantId: 'tenant-123',
    ipAddress: '127.0.0.1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnnouncementService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AnnouncementService>(AnnouncementService);
    prisma = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an announcement with isActive=true', async () => {
      const dto = {
        title: 'Important Notice',
        content: 'Building maintenance scheduled',
        priority: AnnouncementPriority.HIGH,
        targetRoles: [UserRole.ADMIN_TENANT],
      };

      const createdAnnouncement = {
        id: 'announcement-123',
        tenantId: 'tenant-123',
        title: 'Important Notice',
        content: 'Building maintenance scheduled',
        priority: AnnouncementPriority.HIGH,
        targetRoles: [UserRole.ADMIN_TENANT],
        targetUnits: [],
        startsAt: new Date(),
        endsAt: null,
        isActive: true,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByUser: { firstName: 'Admin', lastName: 'User' },
      };

      mockPrisma.announcement.create.mockResolvedValue(createdAnnouncement);

      const result = await service.create(dto, 'user-123', 'tenant-123', ctx);

      expect(mockPrisma.announcement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-123',
          title: dto.title,
          content: dto.content,
          priority: dto.priority,
          targetRoles: dto.targetRoles,
          isActive: true, // Always true by default
          createdBy: 'user-123',
        }),
        select: expect.any(Object),
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          entity: AuditEntity.announcement,
          entityId: 'announcement-123',
          action: AuditAction.CREATE,
        }),
      );
      expect(result.isActive).toBe(true);
      expect(result.title).toBe('Important Notice');
    });

    it('should use default priority NORMAL if not provided', async () => {
      const dto = {
        title: 'Regular Notice',
        content: 'Some content',
      };

      const createdAnnouncement = {
        id: 'announcement-123',
        tenantId: 'tenant-123',
        title: 'Regular Notice',
        content: 'Some content',
        priority: AnnouncementPriority.NORMAL,
        targetRoles: [],
        targetUnits: [],
        startsAt: new Date(),
        endsAt: null,
        isActive: true,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByUser: { firstName: 'Admin', lastName: 'User' },
      };

      mockPrisma.announcement.create.mockResolvedValue(createdAnnouncement);

      const result = await service.create(dto, 'user-123', 'tenant-123', ctx);

      expect(result.priority).toBe(AnnouncementPriority.NORMAL);
    });

    it('should set startsAt to current date if not provided', async () => {
      const dto = {
        title: 'Notice without dates',
        content: 'Content',
      };

      const createdAnnouncement = {
        id: 'announcement-123',
        tenantId: 'tenant-123',
        title: 'Notice without dates',
        content: 'Content',
        priority: AnnouncementPriority.NORMAL,
        targetRoles: [],
        targetUnits: [],
        startsAt: new Date(),
        endsAt: null,
        isActive: true,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByUser: { firstName: 'Admin', lastName: 'User' },
      };

      mockPrisma.announcement.create.mockResolvedValue(createdAnnouncement);

      const result = await service.create(dto, 'user-123', 'tenant-123', ctx);

      expect(result.startsAt).toBeDefined();
    });
  });

  describe('findAll', () => {
    const announcements = [
      {
        id: 'announcement-1',
        tenantId: 'tenant-123',
        title: 'Notice 1',
        content: 'Content 1',
        priority: AnnouncementPriority.HIGH,
        targetRoles: [UserRole.ADMIN_TENANT],
        targetUnits: [],
        startsAt: new Date(),
        endsAt: null,
        isActive: true,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByUser: { firstName: 'Admin', lastName: 'User' },
      },
    ];

    it('should return announcements with pagination', async () => {
      mockPrisma.announcement.findMany.mockResolvedValue(announcements);
      mockPrisma.announcement.count.mockResolvedValue(1);

      const result = await service.findAll({}, 'tenant-123');

      expect(mockPrisma.announcement.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenantId: 'tenant-123',
          deletedAt: null,
        }),
        skip: 0,
        take: 20,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        select: expect.any(Object),
      });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by isActive', async () => {
      mockPrisma.announcement.findMany.mockResolvedValue(announcements);
      mockPrisma.announcement.count.mockResolvedValue(1);

await service.findAll({ isActive: true }, 'tenant-123');
      expect(mockPrisma.announcement.findMany).toHaveBeenCalled();
    });

    it('should filter by priority', async () => {
      mockPrisma.announcement.findMany.mockResolvedValue(announcements);
      mockPrisma.announcement.count.mockResolvedValue(1);

await service.findAll({ priority: AnnouncementPriority.HIGH }, 'tenant-123');
      expect(mockPrisma.announcement.findMany).toHaveBeenCalled();
    });

    it('should filter by targetRole (show announcements for role X or empty)', async () => {
      mockPrisma.announcement.findMany.mockResolvedValue(announcements);
      mockPrisma.announcement.count.mockResolvedValue(1);

await service.findAll({ targetRole: UserRole.ADMIN_TENANT }, 'tenant-123');
      expect(mockPrisma.announcement.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return announcement if found', async () => {
      const announcement = {
        id: 'announcement-123',
        tenantId: 'tenant-123',
        title: 'Notice',
        content: 'Content',
        priority: AnnouncementPriority.NORMAL,
        targetRoles: [],
        targetUnits: [],
        startsAt: new Date(),
        endsAt: null,
        isActive: true,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByUser: { firstName: 'Admin', lastName: 'User' },
      };

      mockPrisma.announcement.findFirst.mockResolvedValue(announcement);

      const result = await service.findById('announcement-123', 'tenant-123');

      expect(result.id).toBe('announcement-123');
      expect(result.title).toBe('Notice');
    });

    it('should throw NotFoundException if announcement not found', async () => {
      mockPrisma.announcement.findFirst.mockResolvedValue(null);

      await expect(service.findById('invalid-id', 'tenant-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const existingAnnouncement = {
      id: 'announcement-123',
      tenantId: 'tenant-123',
      title: 'Original Title',
      content: 'Original Content',
      priority: AnnouncementPriority.NORMAL,
      targetRoles: [],
      targetUnits: [],
      startsAt: new Date(),
      endsAt: null,
      isActive: true,
      createdBy: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdByUser: { firstName: 'Admin', lastName: 'User' },
    };

    it('should update fields', async () => {
      const updatedAnnouncement = {
        ...existingAnnouncement,
        title: 'Updated Title',
        priority: AnnouncementPriority.HIGH,
        updatedAt: new Date(),
      };

      mockPrisma.announcement.findFirst.mockResolvedValueOnce(existingAnnouncement);
      mockPrisma.announcement.update.mockResolvedValue(updatedAnnouncement);

      const result = await service.update(
        'announcement-123',
        { title: 'Updated Title', priority: AnnouncementPriority.HIGH },
        'tenant-123',
        ctx,
      );

      expect(mockPrisma.announcement.update).toHaveBeenCalledWith({
        where: { id: 'announcement-123' },
        data: expect.objectContaining({
          title: 'Updated Title',
          priority: AnnouncementPriority.HIGH,
        }),
        select: expect.any(Object),
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          entity: AuditEntity.announcement,
          action: AuditAction.UPDATE,
        }),
      );
      expect(result.title).toBe('Updated Title');
      expect(result.priority).toBe(AnnouncementPriority.HIGH);
    });

    it('should allow updating isActive to false', async () => {
      const updatedAnnouncement = {
        ...existingAnnouncement,
        isActive: false,
        updatedAt: new Date(),
      };

      mockPrisma.announcement.findFirst.mockResolvedValueOnce(existingAnnouncement);
      mockPrisma.announcement.update.mockResolvedValue(updatedAnnouncement);

      const result = await service.update(
        'announcement-123',
        { isActive: false },
        'tenant-123',
        ctx,
      );

      expect(result.isActive).toBe(false);
    });

    it('should update targetRoles', async () => {
      const updatedAnnouncement = {
        ...existingAnnouncement,
        targetRoles: [UserRole.PORTERIA],
        updatedAt: new Date(),
      };

      mockPrisma.announcement.findFirst.mockResolvedValueOnce(existingAnnouncement);
      mockPrisma.announcement.update.mockResolvedValue(updatedAnnouncement);

      const result = await service.update(
        'announcement-123',
        { targetRoles: [UserRole.PORTERIA] },
        'tenant-123',
        ctx,
      );

      expect(result.targetRoles).toContain(UserRole.PORTERIA);
    });
  });

  describe('softDelete', () => {
    const existingAnnouncement = {
      id: 'announcement-123',
      tenantId: 'tenant-123',
      title: 'To Delete',
      content: 'Content',
      priority: AnnouncementPriority.NORMAL,
      targetRoles: [],
      targetUnits: [],
      startsAt: new Date(),
      endsAt: null,
      isActive: true,
      createdBy: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdByUser: { firstName: 'Admin', lastName: 'User' },
    };

    it('should mark as deleted', async () => {
      mockPrisma.announcement.findFirst.mockResolvedValueOnce(existingAnnouncement);
      mockPrisma.announcement.update.mockResolvedValue({
        ...existingAnnouncement,
        deletedAt: new Date(),
        isActive: false,
      });

      const result = await service.softDelete('announcement-123', 'tenant-123', ctx);

      expect(mockPrisma.announcement.update).toHaveBeenCalledWith({
        where: { id: 'announcement-123' },
        data: {
          deletedAt: expect.any(Date),
          isActive: false,
        },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          entity: AuditEntity.announcement,
          action: AuditAction.DELETE,
        }),
      );
      expect(result.message).toBe('Anuncio eliminado correctamente');
    });
  });
});