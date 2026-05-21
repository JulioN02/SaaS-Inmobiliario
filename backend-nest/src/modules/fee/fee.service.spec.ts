import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FeeService } from './fee.service';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import { AuditAction, AuditEntity, FeeStatus, FeeType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('FeeService', () => {
  let service: FeeService;
  let prisma: PrismaService;
  let auditService: AuditService;

  const mockPrisma = {
    fee: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    unit: {
      findFirst: jest.fn(),
    },
    feeStatusHistory: {
      create: jest.fn(),
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
        FeeService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<FeeService>(FeeService);
    prisma = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a fee with status=PENDING', async () => {
      const dto = {
        unitId: 'unit-123',
        amount: 500000,
        description: 'Monthly fee',
        period: '2024-01',
        dueDate: '2024-01-31',
        feeType: FeeType.PERIODIC,
      };

      const unit = { id: 'unit-123', identifier: '101', tenantId: 'tenant-123' };
      const createdFee = {
        id: 'fee-123',
        tenantId: 'tenant-123',
        unitId: 'unit-123',
        amount: new Decimal(500000),
        description: 'Monthly fee',
        period: '2024-01',
        dueDate: new Date('2024-01-31'),
        type: FeeType.PERIODIC,
        status: FeeStatus.PENDING,
        paidAmount: null,
        paidAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        unit: { identifier: '101', tower: { name: 'Tower A' }, property: { name: 'Property A' } },
      };

      mockPrisma.unit.findFirst.mockResolvedValue(unit);
      mockPrisma.fee.findFirst.mockResolvedValue(null);
      mockPrisma.fee.create.mockResolvedValue(createdFee);

      const result = await service.create('tenant-123', dto, ctx);

      expect(mockPrisma.unit.findFirst).toHaveBeenCalledWith({
        where: { id: dto.unitId, tenantId: 'tenant-123', deletedAt: null },
      });
      expect(mockPrisma.fee.create).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          entity: AuditEntity.fee,
          action: AuditAction.CREATE,
        }),
      );
      expect(result.status).toBe(FeeStatus.PENDING);
    });

    it('should throw NotFoundException if unit does not exist', async () => {
      mockPrisma.unit.findFirst.mockResolvedValue(null);

      await expect(
        service.create('tenant-123', { unitId: 'invalid', amount: 100, period: '2024-01', dueDate: '2024-01-31', feeType: FeeType.PERIODIC }, ctx),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if duplicate fee (unitId + period)', async () => {
      const dto = {
        unitId: 'unit-123',
        amount: 500000,
        period: '2024-01',
        dueDate: '2024-01-31',
        feeType: FeeType.PERIODIC,
      };

      const unit = { id: 'unit-123', identifier: '101', tenantId: 'tenant-123' };
      const existingFee = { id: 'fee-existing', unitId: 'unit-123', period: '2024-01' };

      mockPrisma.unit.findFirst.mockResolvedValue(unit);
      mockPrisma.fee.findFirst.mockResolvedValue(existingFee);

      await expect(service.create('tenant-123', dto, ctx)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return fees with pagination and filters', async () => {
      const fees = [
        {
          id: 'fee-1',
          tenantId: 'tenant-123',
          unitId: 'unit-123',
          amount: new Decimal(500000),
          description: 'Fee 1',
          period: '2024-01',
          dueDate: new Date(),
          status: FeeStatus.PENDING,
          paidAmount: null,
          paidAt: null,
          type: FeeType.PERIODIC,
          createdAt: new Date(),
          updatedAt: new Date(),
          unit: { identifier: '101', tower: { name: 'Tower A' }, property: { name: 'Property A' } },
        },
      ];

      mockPrisma.fee.findMany.mockResolvedValue(fees);
      mockPrisma.fee.count.mockResolvedValue(1);

      const result = await service.findAll('tenant-123', {
        page: 1,
        limit: 20,
        status: FeeStatus.PENDING,
      });

      expect(mockPrisma.fee.findMany).toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by unitId', async () => {
      mockPrisma.fee.findMany.mockResolvedValue([]);
      mockPrisma.fee.count.mockResolvedValue(0);

      await service.findAll('tenant-123', { unitId: 'unit-123' });

      expect(mockPrisma.fee.findMany).toHaveBeenCalled();
    });

    it('should filter by period', async () => {
      mockPrisma.fee.findMany.mockResolvedValue([]);
      mockPrisma.fee.count.mockResolvedValue(0);

      await service.findAll('tenant-123', { period: '2024-01' });

      expect(mockPrisma.fee.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return fee if found', async () => {
      const fee = {
        id: 'fee-123',
        tenantId: 'tenant-123',
        unitId: 'unit-123',
        amount: new Decimal(500000),
        description: 'Monthly fee',
        period: '2024-01',
        dueDate: new Date(),
        status: FeeStatus.PENDING,
        paidAmount: null,
        paidAt: null,
        type: FeeType.PERIODIC,
        createdAt: new Date(),
        updatedAt: new Date(),
        unit: { identifier: '101', tower: { name: 'Tower A' }, property: { name: 'Property A' } },
      };

      mockPrisma.fee.findFirst.mockResolvedValue(fee);

      const result = await service.findById('tenant-123', 'fee-123');

      expect(result.id).toBe('fee-123');
      expect(result.status).toBe(FeeStatus.PENDING);
    });

    it('should throw NotFoundException if fee not found', async () => {
      mockPrisma.fee.findFirst.mockResolvedValue(null);

      await expect(service.findById('tenant-123', 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const existingFee = {
      id: 'fee-123',
      tenantId: 'tenant-123',
      unitId: 'unit-123',
      amount: new Decimal(500000),
      description: 'Monthly fee',
      period: '2024-01',
      dueDate: new Date('2024-01-31'),
      status: FeeStatus.PENDING,
      paidAmount: null,
      paidAt: null,
      type: FeeType.PERIODIC,
      createdAt: new Date(),
      updatedAt: new Date(),
      unit: { identifier: '101', tower: { name: 'Tower A' }, property: { name: 'Property A' } },
    };

    it('should update amount, description, dueDate', async () => {
      const updatedFee = {
        ...existingFee,
        amount: new Decimal(600000),
        description: 'Updated fee',
        dueDate: new Date('2024-02-28'),
        updatedAt: new Date(),
      };

      mockPrisma.fee.findFirst.mockResolvedValue(existingFee);
      mockPrisma.fee.update.mockResolvedValue(updatedFee);

      const result = await service.update(
        'tenant-123',
        'fee-123',
        { amount: 600000, description: 'Updated fee', dueDate: '2024-02-28' },
        ctx,
      );

      expect(mockPrisma.fee.update).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          entity: AuditEntity.fee,
          action: AuditAction.UPDATE,
        }),
      );
      expect(result.amount).toBe(600000);
    });

    it('should NOT allow update if status=PAID (inmutable)', async () => {
      const paidFee = {
        ...existingFee,
        id: 'fee-paid',
        status: FeeStatus.PAID,
        paidAmount: new Decimal(500000),
        paidAt: new Date(),
      };

      mockPrisma.fee.findFirst.mockResolvedValue(paidFee);

      await expect(
        service.update(
          'tenant-123',
          'fee-paid',
          { amount: 600000 },
          ctx,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    const baseFee = {
      id: 'fee-123',
      tenantId: 'tenant-123',
      unitId: 'unit-123',
      amount: new Decimal(500000),
      description: 'Monthly fee',
      period: '2024-01',
      dueDate: new Date(),
      status: FeeStatus.PENDING,
      paidAmount: null,
      paidAt: null,
      type: FeeType.PERIODIC,
      createdAt: new Date(),
      updatedAt: new Date(),
      unit: { identifier: '101', tower: { name: 'Tower A' }, property: { name: 'Property A' } },
    };

    it('should transition PENDING -> PAID (valid, set paidAt)', async () => {
      const pendingFee = { ...baseFee, status: FeeStatus.PENDING };
      const paidFee = {
        ...pendingFee,
        status: FeeStatus.PAID,
        paidAmount: new Decimal(500000),
        paidAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.fee.findFirst.mockResolvedValue(pendingFee);
      mockPrisma.fee.update.mockResolvedValue(paidFee);
      mockPrisma.feeStatusHistory.create.mockResolvedValue({});

      const result = await service.updateStatus(
        'tenant-123',
        'fee-123',
        { status: FeeStatus.PAID },
        ctx,
      );

      expect(mockPrisma.fee.update).toHaveBeenCalled();
      expect(mockPrisma.feeStatusHistory.create).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-123',
          entity: AuditEntity.fee,
          action: AuditAction.STATUS_CHANGE,
        }),
      );
      expect(result.status).toBe(FeeStatus.PAID);
    });

    it('should transition PENDING -> PARTIAL (valid)', async () => {
      const pendingFee = { ...baseFee, status: FeeStatus.PENDING };
      const partialFee = {
        ...pendingFee,
        status: FeeStatus.PARTIAL,
        paidAmount: new Decimal(0),
        updatedAt: new Date(),
      };

      mockPrisma.fee.findFirst.mockResolvedValue(pendingFee);
      mockPrisma.fee.update.mockResolvedValue(partialFee);
      mockPrisma.feeStatusHistory.create.mockResolvedValue({});

      const result = await service.updateStatus(
        'tenant-123',
        'fee-123',
        { status: FeeStatus.PARTIAL },
        ctx,
      );

      expect(result.status).toBe(FeeStatus.PARTIAL);
    });

    it('should transition PARTIAL -> PAID (valid, completes payment)', async () => {
      const partialFee = {
        ...baseFee,
        id: 'fee-partial',
        status: FeeStatus.PARTIAL,
        paidAmount: new Decimal(250000),
      };
      const paidFee = {
        ...partialFee,
        status: FeeStatus.PAID,
        paidAmount: new Decimal(500000),
        paidAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.fee.findFirst.mockResolvedValue(partialFee);
      mockPrisma.fee.update.mockResolvedValue(paidFee);
      mockPrisma.feeStatusHistory.create.mockResolvedValue({});

      const result = await service.updateStatus(
        'tenant-123',
        'fee-partial',
        { status: FeeStatus.PAID },
        ctx,
      );

      expect(result.status).toBe(FeeStatus.PAID);
      expect(result.paidAmount).toBe(500000);
    });

    it('should throw BadRequestException for transition PAID -> * (invalid)', async () => {
      const paidFee = {
        ...baseFee,
        id: 'fee-paid',
        status: FeeStatus.PAID,
        paidAmount: new Decimal(500000),
        paidAt: new Date(),
      };

      mockPrisma.fee.findFirst.mockResolvedValue(paidFee);

      await expect(
        service.updateStatus(
          'tenant-123',
          'fee-paid',
          { status: FeeStatus.PENDING },
          ctx,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});