import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import {
  CreateFeeDto,
  UpdateFeeDto,
  UpdateFeeStatusDto,
  FindAllFeesDto,
  FeeResponseDto,
} from './dto';
import { AuditAction, AuditEntity, FeeStatus, Prisma } from '@prisma/client';

interface CallerCtx {
  userId: string;
  tenantId: string;
  ipAddress?: string;
}

// Status transitions map (schema has: PENDING, PAID, PARTIAL - no CANCELLED)
const STATUS_TRANSITIONS: Record<FeeStatus, FeeStatus[]> = {
  [FeeStatus.PENDING]: [FeeStatus.PAID, FeeStatus.PARTIAL],
  [FeeStatus.PARTIAL]: [FeeStatus.PAID],
  [FeeStatus.PAID]: [],
};

@Injectable()
export class FeeService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(tenantId: string, dto: CreateFeeDto, ctx: CallerCtx) {
    // Validate unit exists and belongs to tenant
    await this.validateUnitTenant(dto.unitId, tenantId);

    // Check if fee already exists for this unit and period
    await this.validateUniqueFee(dto.unitId, dto.period);

    const fee = await this.prisma.fee.create({
      data: {
        tenantId,
        unitId: dto.unitId,
        amount: dto.amount,
        description: dto.description,
        period: dto.period,
        dueDate: new Date(dto.dueDate),
        type: dto.feeType,
        status: FeeStatus.PENDING,
      },
      select: this.feeSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.fee,
      entityId: fee.id,
      action: AuditAction.CREATE,
      snapshot: {
        unitId: fee.unitId,
        amount: fee.amount,
        period: fee.period,
        type: fee.type,
        status: fee.status,
      },
      ipAddress: ctx.ipAddress,
    });

    return this.mapToResponse(fee);
  }

  async findAll(tenantId: string, filters: FindAllFeesDto) {
    const { unitId, status, period, page = 1, limit = 20 } = filters;

    const where: Prisma.FeeWhereInput = {
      tenantId,
      ...(unitId && { unitId }),
      ...(status && { status }),
      ...(period && { period }),
    };

    const [data, total] = await Promise.all([
      this.prisma.fee.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.feeSelect(),
      }),
      this.prisma.fee.count({ where }),
    ]);

    return {
      data: data.map((fee) => this.mapToResponse(fee)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(tenantId: string, id: string) {
    const fee = await this.prisma.fee.findFirst({
      where: {
        id,
        tenantId,
      },
      select: this.feeSelect(),
    });

    if (!fee) {
      throw new NotFoundException(`Cuota ${id} no encontrada`);
    }

    return this.mapToResponse(fee);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateFeeDto,
    ctx: CallerCtx,
  ) {
    const fee = await this.findByIdInternal(tenantId, id);

    // Block updates if fee is PAID (inmutable)
    if (fee.status === FeeStatus.PAID) {
      throw new BadRequestException(
        'No se puede modificar una cuota pagada',
      );
    }

    const data: Prisma.FeeUpdateInput = {};
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.dueDate !== undefined) data.dueDate = new Date(dto.dueDate);

    const updated = await this.prisma.fee.update({
      where: { id },
      data,
      select: this.feeSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.fee,
      entityId: id,
      action: AuditAction.UPDATE,
      snapshot: {
        before: {
          amount: fee.amount,
          description: fee.description,
          dueDate: fee.dueDate,
        },
        after: {
          amount: updated.amount,
          description: updated.description,
          dueDate: updated.dueDate,
        },
      },
      ipAddress: ctx.ipAddress,
    });

    return this.mapToResponse(updated);
  }

  async updateStatus(
    tenantId: string,
    id: string,
    dto: UpdateFeeStatusDto,
    ctx: CallerCtx,
  ) {
    const fee = await this.findByIdInternal(tenantId, id);

    // Validate status transition
    const allowedTransitions = STATUS_TRANSITIONS[fee.status] || [];
    if (!allowedTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `No se puede cambiar de ${fee.status} a ${dto.status}`,
      );
    }

    // Calculate paidAmount and paidAt based on transition
    let paidAmount: Prisma.Decimal | undefined;
    let paidAt: Date | undefined;

    if (dto.status === FeeStatus.PAID) {
      // If transitioning to PAID, set paidAmount to full amount (or remaining if PARTIAL -> PAID)
      const currentPaid = fee.paidAmount ? Number(fee.paidAmount) : 0;
      const fullAmount = Number(fee.amount);
      paidAmount = new Prisma.Decimal(fullAmount);
      paidAt = new Date();
    } else if (dto.status === FeeStatus.PARTIAL) {
      // For partial, we'll let the user set the initial partial amount via a separate operation
      // For now, just mark as partial without specific amount
      paidAmount = new Prisma.Decimal(0);
    }

    // Update fee status
    const updated = await this.prisma.fee.update({
      where: { id },
      data: {
        status: dto.status,
        ...(paidAmount !== undefined && { paidAmount }),
        ...(paidAt && { paidAt }),
      },
      select: this.feeSelect(),
    });

    // Create status history record
    await this.prisma.feeStatusHistory.create({
      data: {
        tenantId,
        feeId: id,
        fromStatus: fee.status,
        toStatus: dto.status,
        paidAmount: paidAmount ? paidAmount : null,
        changedBy: ctx.userId,
      },
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.fee,
      entityId: id,
      action: AuditAction.STATUS_CHANGE,
      snapshot: {
        before: { status: fee.status },
        after: { status: dto.status, paidAmount, paidAt },
      },
      ipAddress: ctx.ipAddress,
    });

    return this.mapToResponse(updated);
  }

  private async validateUnitTenant(unitId: string, tenantId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id: unitId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!unit) {
      throw new NotFoundException(
        `Unidad ${unitId} no encontrada o no pertenece al tenant`,
      );
    }
  }

  private async validateUniqueFee(unitId: string, period: string) {
    const existing = await this.prisma.fee.findFirst({
      where: {
        unitId,
        period,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Ya existe una cuota para la unidad ${unitId} en el periodo ${period}`,
      );
    }
  }

  private async findByIdInternal(tenantId: string, id: string) {
    const fee = await this.prisma.fee.findFirst({
      where: {
        id,
        tenantId,
      },
      select: this.feeSelect(),
    });

    if (!fee) {
      throw new NotFoundException(`Cuota ${id} no encontrada`);
    }

    return fee;
  }

  private feeSelect() {
    return {
      id: true,
      tenantId: true,
      unitId: true,
      amount: true,
      description: true,
      period: true,
      dueDate: true,
      status: true,
      paidAmount: true,
      paidAt: true,
      type: true,
      createdAt: true,
      updatedAt: true,
      unit: {
        select: {
          identifier: true,
          tower: {
            select: {
              name: true,
            },
          },
          property: {
            select: {
              name: true,
            },
          },
        },
      },
    };
  }

  private mapToResponse(fee: any): FeeResponseDto {
    return {
      id: fee.id,
      tenantId: fee.tenantId,
      unitId: fee.unitId,
      amount: Number(fee.amount),
      description: fee.description,
      period: fee.period,
      dueDate: fee.dueDate,
      status: fee.status,
      paidAmount: fee.paidAmount ? Number(fee.paidAmount) : undefined,
      paidAt: fee.paidAt,
      type: fee.type,
      createdAt: fee.createdAt,
      updatedAt: fee.updatedAt,
      unitIdentifier: fee.unit.identifier,
      unitTowerName: fee.unit.tower?.name,
      propertyName: fee.unit.property.name,
    };
  }

  async getSummary(tenantId: string) {
    const [total, paid, partial, pending] = await Promise.all([
      this.prisma.fee.count({ where: { tenantId } }),
      this.prisma.fee.count({ where: { tenantId, status: FeeStatus.PAID } }),
      this.prisma.fee.count({ where: { tenantId, status: FeeStatus.PARTIAL } }),
      this.prisma.fee.count({ where: { tenantId, status: FeeStatus.PENDING } }),
    ]);

    const totalAmount = await this.prisma.fee.aggregate({
      where: { tenantId },
      _sum: { amount: true },
    });

    const paidAmount = await this.prisma.fee.aggregate({
      where: { tenantId, status: { in: [FeeStatus.PAID, FeeStatus.PARTIAL] } },
      _sum: { paidAmount: true },
    });

    const collectionRate = total > 0 ? Math.round(((paid + partial) / total) * 100) : 0;
    const totalCollected = paidAmount._sum.paidAmount ? Number(paidAmount._sum.paidAmount) : 0;
    const totalPending = totalAmount._sum.amount ? Number(totalAmount._sum.amount) - totalCollected : 0;

    return {
      total,
      paid,
      partial,
      pending,
      collectionRate,
      totalAmount: totalAmount._sum.amount ? Number(totalAmount._sum.amount) : 0,
      totalCollected,
      totalPending,
    };
  }

  async getPending(tenantId: string, limit = 20) {
    const fees = await this.prisma.fee.findMany({
      where: { tenantId, status: FeeStatus.PENDING },
      take: limit,
      orderBy: { dueDate: 'asc' },
      select: this.feeSelect(),
    });

    return {
      data: fees.map((fee) => this.mapToResponse(fee)),
      total: fees.length,
    };
  }
}