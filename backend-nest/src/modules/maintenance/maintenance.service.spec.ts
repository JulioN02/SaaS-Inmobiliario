import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import { AuditAction, AuditEntity, MaintenanceStatus } from '@prisma/client';

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let prisma: PrismaService;
  let auditService: AuditService;

  const mockPrisma = {
    maintenanceRequest: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    unit: {
      findFirst: jest.fn(),
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
        MaintenanceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<MaintenanceService>(MaintenanceService);
    prisma = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a maintenance request with status=PENDING', async () => {
      const dto = {
        unitId: 'unit-123',
        title: 'Leaking faucet',
        description: 'Kitchen faucet is leaking',
      };

      const unit = { id: 'unit-123', identifier: '101', tenantId: 'tenant-123' };
      const createdRequest = {
        id: 'maintenance-123',
        tenantId: 'tenant-123',
        unitId: 'unit-123',
        title: 'Leaking faucet',
        description: 'Kitchen faucet is leaking',
        status: MaintenanceStatus.PENDING,
        assignedTo: null,
        resolvedAt: null,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.unit.findFirst.mockResolvedValue(unit);
      mockPrisma.maintenanceRequest.create.mockResolvedValue(createdRequest);

      const result = await service.create('tenant-123', dto, ctx);

      expect(mockPrisma.unit.findFirst).toHaveBeenCalledWith({
        where: { id: dto.unitId, tenantId: 'tenant-123', deletedAt: null },
      });
      expect(mockPrisma.maintenanceRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-123',
          unitId: dto.unitId,
          title: dto.title,
          description: dto.description,
          status: MaintenanceStatus.PENDING,
          createdBy: ctx.userId,
        }),
        select: expect.any(Object),
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          entity: AuditEntity.maintenance,
          action: AuditAction.CREATE,
        }),
      );
      expect(result.status).toBe(MaintenanceStatus.PENDING);
    });

    it('should throw NotFoundException if unit does not exist', async () => {
      mockPrisma.unit.findFirst.mockResolvedValue(null);

      await expect(
        service.create('tenant-123', { unitId: 'invalid', title: 'Test' }, ctx),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return maintenance requests with pagination and filters', async () => {
      const requests = [
        {
          id: 'maintenance-1',
          tenantId: 'tenant-123',
          unitId: 'unit-123',
          title: 'Repair 1',
          description: 'Desc 1',
          status: MaintenanceStatus.PENDING,
          assignedTo: null,
          resolvedAt: null,
          createdBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          unit: { identifier: '101', tower: { name: 'Tower A' } },
        },
      ];

      mockPrisma.maintenanceRequest.findMany.mockResolvedValue(requests);
      mockPrisma.maintenanceRequest.count.mockResolvedValue(1);

      const result = await service.findAll('tenant-123', {
        page: 1,
        limit: 20,
        status: MaintenanceStatus.PENDING,
      });

      expect(mockPrisma.maintenanceRequest.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenantId: 'tenant-123',
          status: MaintenanceStatus.PENDING,
        }),
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by unitId', async () => {
      mockPrisma.maintenanceRequest.findMany.mockResolvedValue([]);
      mockPrisma.maintenanceRequest.count.mockResolvedValue(0);

      await service.findAll('tenant-123', { unitId: 'unit-123' });

      expect(mockPrisma.maintenanceRequest.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return maintenance request if found', async () => {
      const request = {
        id: 'maintenance-123',
        tenantId: 'tenant-123',
        unitId: 'unit-123',
        title: 'Leaking faucet',
        description: 'Kitchen faucet is leaking',
        status: MaintenanceStatus.PENDING,
        assignedTo: null,
        resolvedAt: null,
        createdBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        unit: { identifier: '101', tower: { name: 'Tower A' } },
      };

      mockPrisma.maintenanceRequest.findFirst.mockResolvedValue(request);

      const result = await service.findById('tenant-123', 'maintenance-123');

      expect(result.id).toBe('maintenance-123');
      expect(result.title).toBe('Leaking faucet');
    });

    it('should throw NotFoundException if maintenance request not found', async () => {
      mockPrisma.maintenanceRequest.findFirst.mockResolvedValue(null);

      await expect(service.findById('tenant-123', 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const existingRequest = {
      id: 'maintenance-123',
      tenantId: 'tenant-123',
      unitId: 'unit-123',
      title: 'Leaking faucet',
      description: 'Kitchen faucet is leaking',
      status: MaintenanceStatus.PENDING,
      assignedTo: null,
      resolvedAt: null,
      createdBy: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should transition PENDING -> IN_PROGRESS (valid)', async () => {
      const updatedRequest = {
        ...existingRequest,
        status: MaintenanceStatus.IN_PROGRESS,
        assignedTo: 'technician-1',
        updatedAt: new Date(),
      };

      mockPrisma.maintenanceRequest.findFirst.mockResolvedValue(existingRequest);
      mockPrisma.maintenanceRequest.update.mockResolvedValue(updatedRequest);

      const result = await service.update(
        'tenant-123',
        'maintenance-123',
        { status: MaintenanceStatus.IN_PROGRESS, assignedTo: 'technician-1' },
        ctx,
      );

      expect(mockPrisma.maintenanceRequest.update).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          entity: AuditEntity.maintenance,
          action: AuditAction.STATUS_CHANGE,
        }),
      );
      expect(result.status).toBe(MaintenanceStatus.IN_PROGRESS);
    });

    it('should transition PENDING -> CANCELLED (valid)', async () => {
      const updatedRequest = {
        ...existingRequest,
        status: MaintenanceStatus.CANCELLED,
        updatedAt: new Date(),
      };

      mockPrisma.maintenanceRequest.findFirst.mockResolvedValue(existingRequest);
      mockPrisma.maintenanceRequest.update.mockResolvedValue(updatedRequest);

      const result = await service.update(
        'tenant-123',
        'maintenance-123',
        { status: MaintenanceStatus.CANCELLED },
        ctx,
      );

      expect(result.status).toBe(MaintenanceStatus.CANCELLED);
    });

    it('should transition IN_PROGRESS -> RESOLVED (valid, set resolvedAt)', async () => {
      const inProgressRequest = {
        ...existingRequest,
        status: MaintenanceStatus.IN_PROGRESS,
      };

      const resolvedRequest = {
        ...inProgressRequest,
        status: MaintenanceStatus.RESOLVED,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.maintenanceRequest.findFirst.mockResolvedValue(inProgressRequest);
      mockPrisma.maintenanceRequest.update.mockResolvedValue(resolvedRequest);

      const result = await service.update(
        'tenant-123',
        'maintenance-123',
        { status: MaintenanceStatus.RESOLVED },
        ctx,
      );

      expect(mockPrisma.maintenanceRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'maintenance-123' },
          data: expect.objectContaining({
            status: MaintenanceStatus.RESOLVED,
            resolvedAt: expect.any(Date),
          }),
        }),
      );
      expect(result.status).toBe(MaintenanceStatus.RESOLVED);
      expect(result.resolvedAt).toBeDefined();
    });

    it('should transition IN_PROGRESS -> CANCELLED (valid)', async () => {
      const inProgressRequest = {
        ...existingRequest,
        status: MaintenanceStatus.IN_PROGRESS,
      };

      const cancelledRequest = {
        ...inProgressRequest,
        status: MaintenanceStatus.CANCELLED,
        updatedAt: new Date(),
      };

      mockPrisma.maintenanceRequest.findFirst.mockResolvedValue(inProgressRequest);
      mockPrisma.maintenanceRequest.update.mockResolvedValue(cancelledRequest);

      const result = await service.update(
        'tenant-123',
        'maintenance-123',
        { status: MaintenanceStatus.CANCELLED },
        ctx,
      );

      expect(result.status).toBe(MaintenanceStatus.CANCELLED);
    });

    it('should throw BadRequestException for transition RESOLVED -> * (invalid)', async () => {
      const resolvedRequest = {
        ...existingRequest,
        status: MaintenanceStatus.RESOLVED,
        resolvedAt: new Date(),
      };

      mockPrisma.maintenanceRequest.findFirst.mockResolvedValue(resolvedRequest);

      await expect(
        service.update(
          'tenant-123',
          'maintenance-123',
          { status: MaintenanceStatus.PENDING },
          ctx,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for transition CANCELLED -> * (invalid)', async () => {
      const cancelledRequest = {
        ...existingRequest,
        status: MaintenanceStatus.CANCELLED,
      };

      mockPrisma.maintenanceRequest.findFirst.mockResolvedValue(cancelledRequest);

      await expect(
        service.update(
          'tenant-123',
          'maintenance-123',
          { status: MaintenanceStatus.IN_PROGRESS },
          ctx,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});