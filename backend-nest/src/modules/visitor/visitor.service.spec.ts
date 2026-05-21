import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VisitorService } from './visitor.service';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import { AuditAction, AuditEntity } from '@prisma/client';

describe('VisitorService', () => {
  let service: VisitorService;
  let prisma: PrismaService;
  let auditService: AuditService;

  const mockPrisma = {
    visitor: {
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
        VisitorService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<VisitorService>(VisitorService);
    prisma = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a visitor with registeredBy from context', async () => {
      const dto = {
        unitId: 'unit-123',
        visitorName: 'John Doe',
        documentNumber: '12345678',
        notes: 'Test visit',
      };

      const unit = { id: 'unit-123', identifier: '101', tenantId: 'tenant-123' };
      const createdVisitor = {
        id: 'visitor-123',
        tenantId: 'tenant-123',
        unitId: 'unit-123',
        visitorName: 'John Doe',
        documentNumber: '12345678',
        entryDate: new Date(),
        exitDate: null,
        notes: 'Test visit',
        registeredBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.unit.findFirst.mockResolvedValue(unit);
      mockPrisma.visitor.create.mockResolvedValue(createdVisitor);

      const result = await service.create('tenant-123', dto, ctx);

      expect(mockPrisma.unit.findFirst).toHaveBeenCalledWith({
        where: { id: dto.unitId, tenantId: 'tenant-123', deletedAt: null },
      });
      expect(mockPrisma.visitor.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: 'tenant-123',
          unitId: dto.unitId,
          visitorName: dto.visitorName,
          documentNumber: dto.documentNumber,
          notes: dto.notes,
          registeredBy: ctx.userId,
        }),
        select: expect.anything(),
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          userId: ctx.userId,
          entity: AuditEntity.visitor,
          action: AuditAction.CREATE,
        }),
      );
      expect(result.visitorName).toBe('John Doe');
    });

    it('should throw NotFoundException if unit does not exist', async () => {
      mockPrisma.unit.findFirst.mockResolvedValue(null);

      await expect(
        service.create('tenant-123', { unitId: 'invalid', visitorName: 'Test' }, ctx),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return visitors with pagination and filters', async () => {
      const visitors = [
        {
          id: 'visitor-1',
          tenantId: 'tenant-123',
          unitId: 'unit-123',
          visitorName: 'Visitor 1',
          documentNumber: '111',
          entryDate: new Date(),
          exitDate: null,
          notes: null,
          registeredBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          unit: { unitNumber: '101', tower: { name: 'Tower A' } },
        },
      ];

      mockPrisma.visitor.findMany.mockResolvedValue(visitors);
      mockPrisma.visitor.count.mockResolvedValue(1);

      const result = await service.findAll('tenant-123', {
        page: 1,
        limit: 20,
        unitId: 'unit-123',
      });

      expect(mockPrisma.visitor.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenantId: 'tenant-123',
          unitId: 'unit-123',
        }),
        skip: 0,
        take: 20,
        orderBy: { entryDate: 'desc' },
        include: expect.any(Object),
      });
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });

    it('should filter by entryDateFrom and entryDateTo', async () => {
      const filters = {
        entryDateFrom: new Date('2024-01-01'),
        entryDateTo: new Date('2024-12-31'),
      };

      mockPrisma.visitor.findMany.mockResolvedValue([]);
      mockPrisma.visitor.count.mockResolvedValue(0);

      await service.findAll('tenant-123', filters);

      expect(mockPrisma.visitor.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return visitor if found', async () => {
      const visitor = {
        id: 'visitor-123',
        tenantId: 'tenant-123',
        unitId: 'unit-123',
        visitorName: 'John Doe',
        documentNumber: '12345678',
        entryDate: new Date(),
        exitDate: null,
        notes: null,
        registeredBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        unit: { unitNumber: '101', tower: { name: 'Tower A' } },
      };

      mockPrisma.visitor.findFirst.mockResolvedValue(visitor);

      const result = await service.findById('tenant-123', 'visitor-123');

      expect(result.id).toBe('visitor-123');
      expect(result.visitorName).toBe('John Doe');
    });

    it('should throw NotFoundException if visitor not found', async () => {
      mockPrisma.visitor.findFirst.mockResolvedValue(null);

      await expect(service.findById('tenant-123', 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('checkout', () => {
    it('should set exitDate correctly', async () => {
      const visitor = {
        id: 'visitor-123',
        tenantId: 'tenant-123',
        unitId: 'unit-123',
        visitorName: 'John Doe',
        documentNumber: '12345678',
        entryDate: new Date('2024-01-01T10:00:00Z'),
        exitDate: null,
        notes: null,
        registeredBy: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        unit: { unitNumber: '101', tower: { name: 'Tower A' } },
      };

      const updatedVisitor = {
        ...visitor,
        exitDate: new Date('2024-01-01T12:00:00Z'),
        updatedAt: new Date(),
      };

      mockPrisma.visitor.findFirst.mockResolvedValue(visitor);
      mockPrisma.visitor.update.mockResolvedValue(updatedVisitor);

      const exitDateValue = new Date('2024-01-01T12:00:00Z');
      const result = await service.checkout(
        'tenant-123',
        'visitor-123',
        { exitDate: exitDateValue },
        ctx,
      );

      expect(mockPrisma.visitor.update).toHaveBeenCalledWith({
        where: { id: 'visitor-123' },
        data: expect.objectContaining({
          exitDate: expect.any(Date),
        }),
        include: expect.any(Object),
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          entity: AuditEntity.visitor,
          action: AuditAction.STATUS_CHANGE,
        }),
      );
      expect(result.exitDate).toBeDefined();
    });

    it('should throw BadRequestException if already exited (double checkout)', async () => {
      const visitor = {
        id: 'visitor-123',
        entryDate: new Date('2024-01-01T10:00:00Z'),
        exitDate: new Date('2024-01-01T12:00:00Z'),
      };

      mockPrisma.visitor.findFirst.mockResolvedValue(visitor);

      const exitDateValue = new Date('2024-01-01T14:00:00Z');
      await expect(
        service.checkout(
          'tenant-123',
          'visitor-123',
          { exitDate: exitDateValue },
          ctx,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if exitDate < entryDate', async () => {
      const visitor = {
        id: 'visitor-123',
        entryDate: new Date('2024-01-01T12:00:00Z'),
        exitDate: null,
      };

      mockPrisma.visitor.findFirst.mockResolvedValue(visitor);

      const exitDateValue = new Date('2024-01-01T10:00:00Z');
      await expect(
        service.checkout(
          'tenant-123',
          'visitor-123',
          { exitDate: exitDateValue },
          ctx,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});