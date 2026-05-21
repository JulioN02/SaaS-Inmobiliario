import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import {
  CreateResidentDto,
  UpdateResidentDto,
  FindAllResidentsDto,
  ResidentResponseDto,
} from './dto';
import { AuditAction, AuditEntity, Prisma } from '@prisma/client';

interface CallerCtx {
  userId: string;
  tenantId: string;
  ipAddress?: string;
}

@Injectable()
export class ResidentService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(tenantId: string, filters: FindAllResidentsDto) {
    const { page = 1, limit = 10, documentType, documentNumber } = filters;

    const where: Prisma.ResidentWhereInput = {
      tenantId,
      deletedAt: null,
      ...(documentType && { documentType }),
      ...(documentNumber && {
        documentNumber: { contains: documentNumber, mode: 'insensitive' },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.resident.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.residentSelect(),
      }),
      this.prisma.resident.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(tenantId: string, id: string) {
    const resident = await this.prisma.resident.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: this.residentSelect(),
    });

    if (!resident) {
      throw new NotFoundException(`Residente ${id} no encontrado`);
    }

    return resident;
  }

  async create(tenantId: string, dto: CreateResidentDto, ctx: CallerCtx) {
    // Validate unique documentNumber per tenant
    await this.validateUniqueDocument(tenantId, dto.documentNumber);

    const resident = await this.prisma.resident.create({
      data: {
        tenantId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        email: dto.email,
        phone: dto.phone,
        emergencyContact: dto.emergencyContact,
      },
      select: this.residentSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.resident,
      entityId: resident.id,
      action: AuditAction.CREATE,
      snapshot: {
        firstName: resident.firstName,
        lastName: resident.lastName,
        documentType: resident.documentType,
        documentNumber: resident.documentNumber,
        email: resident.email,
      },
      ipAddress: ctx.ipAddress,
    });

    return resident;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateResidentDto,
    ctx: CallerCtx,
  ) {
    const resident = await this.findById(tenantId, id);

    // If documentNumber is being changed, validate uniqueness
    if (dto.documentNumber && dto.documentNumber !== resident.documentNumber) {
      await this.validateUniqueDocument(tenantId, dto.documentNumber, id);
    }

    const updated = await this.prisma.resident.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        email: dto.email,
        phone: dto.phone,
        emergencyContact: dto.emergencyContact,
        updatedAt: new Date(),
      },
      select: this.residentSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.resident,
      entityId: id,
      action: AuditAction.UPDATE,
      snapshot: {
        before: {
          firstName: resident.firstName,
          lastName: resident.lastName,
          documentNumber: resident.documentNumber,
        },
        after: {
          firstName: updated.firstName,
          lastName: updated.lastName,
          documentNumber: updated.documentNumber,
        },
      },
      ipAddress: ctx.ipAddress,
    });

    return updated;
  }

  async softDelete(tenantId: string, id: string, ctx: CallerCtx) {
    const resident = await this.findById(tenantId, id);

    // Check for active occupancies
    const activeOccupancyCount = await this.prisma.occupancy.count({
      where: {
        residentId: id,
        tenantId,
        endDate: null,
      },
    });

    if (activeOccupancyCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar un residente con ocupaciones activas',
      );
    }

    const deleted = await this.prisma.resident.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
      select: this.residentSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.resident,
      entityId: id,
      action: AuditAction.DELETE,
      snapshot: {
        firstName: resident.firstName,
        lastName: resident.lastName,
        documentNumber: resident.documentNumber,
      },
      ipAddress: ctx.ipAddress,
    });

    return deleted;
  }

  private async validateUniqueDocument(
    tenantId: string,
    documentNumber: string,
    excludeResidentId?: string,
  ) {
    const where: Prisma.ResidentWhereInput = {
      tenantId,
      documentNumber,
      deletedAt: null,
    };

    if (excludeResidentId) {
      where.id = { not: excludeResidentId };
    }

    const existing = await this.prisma.resident.findFirst({ where });

    if (existing) {
      throw new ConflictException(
        `Ya existe un residente con el documento ${documentNumber} en este tenant`,
      );
    }
  }

  private residentSelect() {
    return {
      id: true,
      tenantId: true,
      firstName: true,
      lastName: true,
      documentType: true,
      documentNumber: true,
      email: true,
      phone: true,
      emergencyContact: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    };
  }
}