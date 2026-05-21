import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { ResidentController } from './resident.controller';
import { ResidentService } from './resident.service';
import { DocumentType } from '../../shared/types/enums';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RbacGuard } from '../../common/guards/rbac.guard';
import { MockJwtAuthGuard, MockTenantGuard, MockRbacGuard } from '../../common/testing/mock-guards';
import { PrismaService } from '../../config/prisma.service';

describe('ResidentController', () => {
  let controller: ResidentController;
  let service: jest.Mocked<ResidentService>;

  const mockTenantId = 'tenant-123';
  const mockUser = { userId: 'user-123', ipAddress: '127.0.0.1' };
  const mockResident = {
    id: 'resident-1',
    tenantId: mockTenantId,
    firstName: 'John',
    lastName: 'Doe',
    documentType: DocumentType.CC,
    documentNumber: '12345678',
    email: 'john@example.com',
    phone: '3001234567',
    emergencyContact: 'Jane Doe',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockPrismaService = {
    rolePermission: {
      findFirst: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResidentController],
      providers: [
        {
          provide: ResidentService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
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

    controller = module.get<ResidentController>(ResidentController);
    service = module.get(ResidentService);
  });

  describe('findAll', () => {
    it('should return paginated residents', async () => {
      const mockResult = {
        data: [mockResident],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(mockTenantId, { page: 1, limit: 10 });

      expect(result).toEqual(mockResult);
      expect(service.findAll).toHaveBeenCalledWith(mockTenantId, { page: 1, limit: 10 });
    });

    it('should filter by documentType and documentNumber', async () => {
      const filters = { documentType: 'CC', documentNumber: '123', page: 1, limit: 10 };
      service.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });

      await controller.findAll(mockTenantId, filters as any);

      expect(service.findAll).toHaveBeenCalledWith(mockTenantId, filters);
    });
  });

  describe('findOne', () => {
    it('should return a resident by id', async () => {
      service.findById.mockResolvedValue(mockResident);

      const result = await controller.findOne(mockTenantId, 'resident-1');

      expect(result).toEqual(mockResident);
      expect(service.findById).toHaveBeenCalledWith(mockTenantId, 'resident-1');
    });

    it('should throw NotFoundException if resident not found', async () => {
      service.findById.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(mockTenantId, 'invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createDto = {
      firstName: 'John',
      lastName: 'Doe',
      documentType: 'CC',
      documentNumber: '12345678',
      email: 'john@example.com',
    };

    it('should create a resident', async () => {
      service.create.mockResolvedValue(mockResident);

      const result = await controller.create(mockTenantId, mockUser, createDto as any);

      expect(result).toEqual(mockResident);
      expect(service.create).toHaveBeenCalledWith(mockTenantId, createDto, {
        userId: mockUser.userId,
        tenantId: mockTenantId,
        ipAddress: mockUser.ipAddress,
      });
    });

    it('should throw ConflictException on duplicate document', async () => {
      service.create.mockRejectedValue(new ConflictException('Documento duplicado'));

      await expect(controller.create(mockTenantId, mockUser, createDto as any)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    const updateDto = { firstName: 'Jane' };

    it('should update a resident', async () => {
      const updated = { ...mockResident, firstName: 'Jane' };
      service.update.mockResolvedValue(updated);

      const result = await controller.update(mockTenantId, 'resident-1', mockUser, updateDto as any);

      expect(result.firstName).toBe('Jane');
      expect(service.update).toHaveBeenCalledWith(mockTenantId, 'resident-1', updateDto, {
        userId: mockUser.userId,
        tenantId: mockTenantId,
        ipAddress: mockUser.ipAddress,
      });
    });
  });

  describe('remove', () => {
    it('should soft delete a resident', async () => {
      service.softDelete.mockResolvedValue(mockResident);

      await controller.remove(mockTenantId, 'resident-1', mockUser);

      expect(service.softDelete).toHaveBeenCalledWith(mockTenantId, 'resident-1', {
        userId: mockUser.userId,
        tenantId: mockTenantId,
        ipAddress: mockUser.ipAddress,
      });
    });

    it('should throw BadRequestException if resident has active occupancies', async () => {
      service.softDelete.mockRejectedValue(
        new BadRequestException('No se puede eliminar un residente con ocupaciones activas'),
      );

      await expect(controller.remove(mockTenantId, 'resident-1', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});