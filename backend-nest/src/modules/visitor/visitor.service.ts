import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import {
  CreateVisitorDto,
  CheckoutVisitorDto,
  FindAllVisitorsDto,
  VisitorResponseDto,
} from './dto';
import { AuditAction, AuditEntity, Prisma } from '@prisma/client';

interface CallerCtx {
  userId: string;
  tenantId: string;
  ipAddress?: string;
}

@Injectable()
export class VisitorService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(tenantId: string, filters: FindAllVisitorsDto) {
    const { page = 1, limit = 20, unitId, entryDateFrom, entryDateTo } = filters;

    const where: Prisma.VisitorWhereInput = {
      tenantId,
      ...(unitId && { unitId }),
      ...(entryDateFrom && {
        entryDate: { gte: entryDateFrom },
      }),
      ...(entryDateTo && {
        entryDate: { lte: entryDateTo },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.visitor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { entryDate: 'desc' },
        include: {
          unit: {
            select: {
              identifier: true,
              tower: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.visitor.count({ where }),
    ]);

    // Transform data to include unit info in flat structure
    const transformedData = data.map((visitor) => ({
      id: visitor.id,
      tenantId: visitor.tenantId,
      unitId: visitor.unitId,
      visitorName: visitor.visitorName,
      documentNumber: visitor.documentNumber,
      entryDate: visitor.entryDate,
      exitDate: visitor.exitDate,
      notes: visitor.notes,
      registeredBy: visitor.registeredBy,
      createdAt: visitor.createdAt,
      updatedAt: visitor.updatedAt,
      unitNumber: visitor.unit?.identifier || null,
      towerName: visitor.unit?.tower?.name || null,
    }));

    return {
      data: transformedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(tenantId: string, id: string) {
    const visitor = await this.prisma.visitor.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        unit: {
          select: {
                         identifier: true,
            tower: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!visitor) {
      throw new NotFoundException(`Visitante ${id} no encontrado`);
    }

    return {
      id: visitor.id,
      tenantId: visitor.tenantId,
      unitId: visitor.unitId,
      visitorName: visitor.visitorName,
      documentNumber: visitor.documentNumber,
      entryDate: visitor.entryDate,
      exitDate: visitor.exitDate,
      notes: visitor.notes,
      registeredBy: visitor.registeredBy,
      createdAt: visitor.createdAt,
      updatedAt: visitor.updatedAt,
      unitNumber: visitor.unit?.identifier || null,
      towerName: visitor.unit?.tower?.name || null,
    };
  }

  async create(tenantId: string, dto: CreateVisitorDto, ctx: CallerCtx) {
    // Validate unit exists and belongs to tenant
    const unit = await this.prisma.unit.findFirst({
      where: {
        id: dto.unitId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!unit) {
      throw new NotFoundException(
        `Unidad ${dto.unitId} no encontrada o no pertenece al tenant`,
      );
    }

    const visitor = await this.prisma.visitor.create({
      data: {
        tenantId,
        unitId: dto.unitId,
        visitorName: dto.visitorName,
        documentNumber: dto.documentNumber,
        entryDate: dto.entryDate ? new Date(dto.entryDate) : new Date(),
        notes: dto.notes,
        registeredBy: ctx.userId, // From JWT, NOT from frontend
      },
      select: this.visitorSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.visitor,
      entityId: visitor.id,
      action: AuditAction.CREATE,
      snapshot: {
        visitorName: visitor.visitorName,
        documentNumber: visitor.documentNumber,
        unitId: visitor.unitId,
        entryDate: visitor.entryDate,
      },
      ipAddress: ctx.ipAddress,
    });

    return {
      ...visitor,
      unitNumber: unit.identifier,
      towerName: null, // Will be populated if tower exists
    };
  }

  async checkout(
    tenantId: string,
    id: string,
    dto: CheckoutVisitorDto,
    ctx: CallerCtx,
  ) {
    const visitor = await this.findById(tenantId, id);

    // Check if already exited
    if (visitor.exitDate) {
      throw new BadRequestException('El visitante ya ha salido');
    }

    // Validate exitDate >= entryDate
    const exitDate = new Date(dto.exitDate);
    const entryDate = new Date(visitor.entryDate);

    if (exitDate < entryDate) {
      throw new BadRequestException(
        'La fecha de salida no puede ser anterior a la fecha de entrada',
      );
    }

    const updated = await this.prisma.visitor.update({
      where: { id },
      data: {
        exitDate,
        updatedAt: new Date(),
      },
      include: {
        unit: {
          select: {
            identifier: true,
            tower: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.visitor,
      entityId: id,
      action: AuditAction.STATUS_CHANGE,
      snapshot: {
        before: { exitDate: null },
        after: { exitDate: updated.exitDate },
      },
      ipAddress: ctx.ipAddress,
    });

    return {
      id: updated.id,
      tenantId: updated.tenantId,
      unitId: updated.unitId,
      visitorName: updated.visitorName,
      documentNumber: updated.documentNumber,
      entryDate: updated.entryDate,
      exitDate: updated.exitDate,
      notes: updated.notes,
      registeredBy: updated.registeredBy,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      unitNumber: updated.unit?.identifier || null,
      towerName: updated.unit?.tower?.name || null,
    };
  }

  private visitorSelect() {
    return {
      id: true,
      tenantId: true,
      unitId: true,
      visitorName: true,
      documentNumber: true,
      entryDate: true,
      exitDate: true,
      notes: true,
      registeredBy: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}