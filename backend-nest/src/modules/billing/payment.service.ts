import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import {
  CreatePaymentDto,
  PaymentResponseDto,
} from './dto';
import { AuditAction, AuditEntity, InvoiceStatus, PaymentMethod, SubscriptionStatus, TenantStatus, Prisma } from '@prisma/client';

interface CallerCtx {
  userId: string;
  ipAddress?: string;
}

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreatePaymentDto, ctx: CallerCtx): Promise<PaymentResponseDto> {
    // Validate invoice exists
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: {
        subscription: { select: { id: true, status: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Factura ${dto.invoiceId} no encontrada`);
    }

    // Only PENDING invoices accept payments
    if (invoice.status !== InvoiceStatus.PENDING) {
      throw new BadRequestException(
        `No se pueden registrar pagos en facturas en estado ${invoice.status}`,
      );
    }

    // Amount validation: must equal invoice amount (no partial payments in v1)
    const invoiceAmount = Number(invoice.amount);
    const paymentAmount = Number(dto.amount);

    if (paymentAmount > invoiceAmount) {
      throw new BadRequestException(
        `El monto del pago (${paymentAmount}) excede el valor de la factura (${invoiceAmount})`,
      );
    }

    if (paymentAmount < invoiceAmount) {
      throw new BadRequestException(
        'No se permiten pagos parciales en v1. El monto debe ser igual al valor de la factura.',
      );
    }

    // Register the payment
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: dto.invoiceId,
        tenantId: dto.tenantId,
        amount: dto.amount,
        currency: dto.currency ?? 'COP',
        method: dto.method,
        reference: dto.reference ?? null,
        receivedBy: ctx.userId,
        receivedAt: new Date(),
      },
    });

    // Update invoice as PAID
    const paidAt = new Date();
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: dto.invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        paidAt,
        paidAmount: dto.amount,
        paymentMethod: dto.method,
      },
    });

    // If invoice PAID and subscription is PAST_DUE or TRIALING → set ACTIVE
    const subStatus = invoice.subscription?.status;
    if (subStatus === SubscriptionStatus.PAST_DUE || subStatus === SubscriptionStatus.TRIALING) {
      await this.prisma.subscription.update({
        where: { id: invoice.subscriptionId },
        data: { status: SubscriptionStatus.ACTIVE },
      });
    }

    // If invoice PAID and tenant SUSPENDED → activate tenant
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
      select: { status: true },
    });

    if (tenant?.status === TenantStatus.SUSPENDED) {
      await this.prisma.tenant.update({
        where: { id: dto.tenantId },
        data: { status: TenantStatus.ACTIVE },
      });
    }

    // Audit log
    await this.auditService.log({
      tenantId: dto.tenantId,
      userId: ctx.userId,
      entity: AuditEntity.payment,
      entityId: payment.id,
      action: AuditAction.CREATE,
      snapshot: {
        invoiceId: dto.invoiceId,
        amount: paymentAmount,
        method: dto.method,
        invoiceStatusBefore: InvoiceStatus.PENDING,
        invoiceStatusAfter: InvoiceStatus.PAID,
        reference: dto.reference,
      },
      ipAddress: ctx.ipAddress,
    });

    return this.mapToResponse(payment, updatedInvoice);
  }

  async findById(id: string): Promise<PaymentResponseDto> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          select: { id: true, status: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Pago ${id} no encontrado`);
    }

    return this.mapToResponse(payment, payment.invoice);
  }

  private mapToResponse(payment: any, invoice?: any): PaymentResponseDto {
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      tenantId: payment.tenantId,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      reference: payment.reference ?? undefined,
      receivedBy: payment.receivedBy,
      receivedAt: payment.receivedAt,
      metadata: payment.metadata ?? undefined,
      createdAt: payment.createdAt,
      invoiceStatus: invoice?.status,
    };
  }
}
