import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import { BillingConfigDto, UpdateBillingConfigDto } from './dto';
import { AuditAction, AuditEntity } from '@prisma/client';

interface CallerCtx {
  userId: string;
  ipAddress?: string;
}

@Injectable()
export class BillingConfigService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findOrCreateByTenantId(tenantId: string): Promise<BillingConfigDto> {
    let config = await this.prisma.billingConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      config = await this.prisma.billingConfig.create({
        data: { tenantId },
      });
    }

    return this.mapToResponse(config);
  }

  async update(
    tenantId: string,
    dto: UpdateBillingConfigDto,
    ctx: CallerCtx,
  ): Promise<BillingConfigDto> {
    // Ensure config exists
    const config = await this.findOrCreateByTenantId(tenantId);

    const data: Record<string, unknown> = {};
    if (dto.billingCycle !== undefined) data.billingCycle = dto.billingCycle;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.gracePeriodDays !== undefined) data.gracePeriodDays = dto.gracePeriodDays;
    if (dto.preferredPaymentMethod !== undefined) data.preferredPaymentMethod = dto.preferredPaymentMethod;
    if (dto.notes !== undefined) data.notes = dto.notes;

    const updated = await this.prisma.billingConfig.update({
      where: { tenantId },
      data,
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.tenant,
      entityId: tenantId,
      action: AuditAction.UPDATE,
      snapshot: {
        before: this.mapToResponse(config),
        after: this.mapToResponse(updated),
      },
      ipAddress: ctx.ipAddress,
    });

    return this.mapToResponse(updated);
  }

  private mapToResponse(config: any): BillingConfigDto {
    return {
      id: config.id,
      tenantId: config.tenantId,
      billingCycle: config.billingCycle,
      currency: config.currency,
      gracePeriodDays: config.gracePeriodDays,
      preferredPaymentMethod: config.preferredPaymentMethod ?? undefined,
      lastInvoiceAt: config.lastInvoiceAt ?? undefined,
      notes: config.notes ?? undefined,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}
