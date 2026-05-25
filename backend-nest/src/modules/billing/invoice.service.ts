import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceResponseDto,
} from './dto';
import { AuditAction, AuditEntity, InvoiceStatus, Prisma } from '@prisma/client';

interface CallerCtx {
  userId: string;
  ipAddress?: string;
}

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(filters: {
    tenantId?: string;
    status?: InvoiceStatus;
    page?: number;
    limit?: number;
  }) {
    const { tenantId, status, page = 1, limit = 20 } = filters;

    const where: Prisma.InvoiceWhereInput = {
      ...(tenantId && { tenantId }),
      ...(status && { status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: { select: { id: true, name: true } },
          tenant: { select: { id: true, name: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: data.map((inv) => this.mapToResponse(inv)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<InvoiceResponseDto> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        plan: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            reference: true,
            receivedAt: true,
          },
          orderBy: { receivedAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Factura ${id} no encontrada`);
    }

    return this.mapToResponse(invoice);
  }

  async create(dto: CreateInvoiceDto, ctx: CallerCtx): Promise<InvoiceResponseDto> {
    // Validate subscription exists
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: dto.subscriptionId },
    });
    if (!subscription) {
      throw new NotFoundException(`Suscripción ${dto.subscriptionId} no encontrada`);
    }

    // Validate plan exists
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) {
      throw new NotFoundException(`Plan ${dto.planId} no encontrado`);
    }

    // Amount must be > 0
    if (dto.amount <= 0) {
      throw new BadRequestException('El monto de la factura debe ser mayor a 0');
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        subscriptionId: dto.subscriptionId,
        tenantId: dto.tenantId,
        planId: dto.planId,
        amount: dto.amount,
        currency: dto.currency ?? 'COP',
        status: InvoiceStatus.DRAFT,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        dueDate: new Date(dto.periodEnd), // Default due date = period end
        notes: dto.notes,
      },
      include: {
        plan: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await this.auditService.log({
      tenantId: dto.tenantId,
      userId: ctx.userId,
      entity: AuditEntity.invoice,
      entityId: invoice.id,
      action: AuditAction.CREATE,
      snapshot: {
        subscriptionId: dto.subscriptionId,
        amount: dto.amount,
        currency: invoice.currency,
        status: InvoiceStatus.DRAFT,
      },
      ipAddress: ctx.ipAddress,
    });

    return this.mapToResponse(invoice);
  }

  async update(id: string, dto: UpdateInvoiceDto, ctx: CallerCtx): Promise<InvoiceResponseDto> {
    const invoice = await this.findByIdInternal(id);

    // Only DRAFT can be edited
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Solo se pueden editar facturas en estado DRAFT');
    }

    const updateData: Prisma.InvoiceUpdateInput = {};
    if (dto.amount !== undefined) {
      if (dto.amount <= 0) {
        throw new BadRequestException('El monto de la factura debe ser mayor a 0');
      }
      updateData.amount = dto.amount;
    }
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        plan: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await this.auditService.log({
      tenantId: updated.tenantId,
      userId: ctx.userId,
      entity: AuditEntity.invoice,
      entityId: id,
      action: AuditAction.UPDATE,
      snapshot: {
        before: { amount: Number(invoice.amount), notes: invoice.notes },
        after: { amount: Number(updated.amount), notes: updated.notes },
      },
      ipAddress: ctx.ipAddress,
    });

    return this.mapToResponse(updated);
  }

  async finalize(id: string, ctx: CallerCtx): Promise<InvoiceResponseDto> {
    const invoice = await this.findByIdInternal(id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Solo se pueden finalizar facturas en estado DRAFT');
    }

    // Calculate dueDate based on billing config's grace period
    const billingConfig = await this.prisma.billingConfig.findUnique({
      where: { tenantId: invoice.tenantId },
    });
    const graceDays = billingConfig?.gracePeriodDays ?? 5;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + graceDays);

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.PENDING,
        dueDate,
      },
      include: {
        plan: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
      },
    });

    // Update billing config's lastInvoiceAt
    await this.prisma.billingConfig.upsert({
      where: { tenantId: invoice.tenantId },
      update: { lastInvoiceAt: new Date() },
      create: {
        tenantId: invoice.tenantId,
        lastInvoiceAt: new Date(),
      },
    });

    // Audit log
    await this.auditService.log({
      tenantId: invoice.tenantId,
      userId: ctx.userId,
      entity: AuditEntity.invoice,
      entityId: id,
      action: AuditAction.STATUS_CHANGE,
      snapshot: {
        before: { status: InvoiceStatus.DRAFT },
        after: { status: InvoiceStatus.PENDING, dueDate },
      },
      ipAddress: ctx.ipAddress,
    });

    return this.mapToResponse(updated);
  }

  async cancel(id: string, ctx: CallerCtx): Promise<InvoiceResponseDto> {
    const invoice = await this.findByIdInternal(id);

    // Only PENDING invoices can be cancelled
    if (invoice.status !== InvoiceStatus.PENDING) {
      throw new BadRequestException('Solo se pueden cancelar facturas en estado PENDING');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELED },
      include: {
        plan: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true } },
      },
    });

    // Audit log
    await this.auditService.log({
      tenantId: invoice.tenantId,
      userId: ctx.userId,
      entity: AuditEntity.invoice,
      entityId: id,
      action: AuditAction.STATUS_CHANGE,
      snapshot: {
        before: { status: InvoiceStatus.PENDING },
        after: { status: InvoiceStatus.CANCELED },
      },
      ipAddress: ctx.ipAddress,
    });

    return this.mapToResponse(updated);
  }

  async findPaymentsByInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException(`Factura ${invoiceId} no encontrada`);
    }

    return this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { receivedAt: 'desc' },
    });
  }

  private async findByIdInternal(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new NotFoundException(`Factura ${id} no encontrada`);
    }

    return invoice;
  }

  private mapToResponse(inv: any): InvoiceResponseDto {
    return {
      id: inv.id,
      subscriptionId: inv.subscriptionId,
      tenantId: inv.tenantId,
      planId: inv.planId,
      amount: Number(inv.amount),
      currency: inv.currency,
      status: inv.status,
      periodStart: inv.periodStart,
      periodEnd: inv.periodEnd,
      dueDate: inv.dueDate,
      paidAt: inv.paidAt ?? undefined,
      paidAmount: inv.paidAmount ? Number(inv.paidAmount) : undefined,
      paymentMethod: inv.paymentMethod ?? undefined,
      notes: inv.notes ?? undefined,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
      planName: inv.plan?.name,
      tenantName: inv.tenant?.name,
      payments: inv.payments?.map((p: any) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        reference: p.reference,
        receivedAt: p.receivedAt,
      })),
    };
  }
}
