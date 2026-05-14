import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import { UpdateWebsiteDto, WebsiteResponseDto } from './dto';
import { AuditAction, AuditEntity } from '@prisma/client';

interface CallerCtx {
  userId: string;
  tenantId: string;
  ipAddress?: string;
}

@Injectable()
export class WebsiteService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findOrCreateByTenantId(tenantId: string): Promise<WebsiteResponseDto> {
    let config = await this.prisma.websiteConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      config = await this.prisma.websiteConfig.create({
        data: { tenantId },
      });
    }

    return this.mapToResponse(config);
  }

  async update(
    tenantId: string,
    dto: UpdateWebsiteDto,
    ctx: CallerCtx,
  ): Promise<WebsiteResponseDto> {
    // Ensure config exists
    await this.findOrCreateByTenantId(tenantId);

    // Build update data from DTO (only include defined fields)
    const data: Record<string, unknown> = {};
    if (dto.logoUrl !== undefined) data.logoUrl = dto.logoUrl;
    if (dto.primaryColor !== undefined) data.primaryColor = dto.primaryColor;
    if (dto.secondaryColor !== undefined) data.secondaryColor = dto.secondaryColor;
    if (dto.backgroundColor !== undefined) data.backgroundColor = dto.backgroundColor;
    if (dto.siteTitle !== undefined) data.siteTitle = dto.siteTitle;
    if (dto.welcomeMessage !== undefined) data.welcomeMessage = dto.welcomeMessage;
    if (dto.contactEmail !== undefined) data.contactEmail = dto.contactEmail;
    if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.metaTitle !== undefined) data.metaTitle = dto.metaTitle;
    if (dto.metaDescription !== undefined) data.metaDescription = dto.metaDescription;
    if (dto.isMaintenanceMode !== undefined) data.isMaintenanceMode = dto.isMaintenanceMode;
    if (dto.isPublic !== undefined) data.isPublic = dto.isPublic;

    // Get current state for audit snapshot
    const before = await this.prisma.websiteConfig.findUnique({
      where: { tenantId },
    });

    const updated = await this.prisma.websiteConfig.update({
      where: { tenantId },
      data,
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.website,
      entityId: updated.id,
      action: AuditAction.UPDATE,
      snapshot: {
        before: this.mapToResponse(before),
        after: this.mapToResponse(updated),
      },
      ipAddress: ctx.ipAddress,
    });

    return this.mapToResponse(updated);
  }

  async toggleMaintenance(
    tenantId: string,
    ctx: CallerCtx,
  ): Promise<WebsiteResponseDto> {
    // Ensure config exists
    const config = await this.findOrCreateByTenantId(tenantId);
    const newMaintenanceMode = !config.isMaintenanceMode;

    const updated = await this.prisma.websiteConfig.update({
      where: { tenantId },
      data: { isMaintenanceMode: newMaintenanceMode },
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.website,
      entityId: updated.id,
      action: AuditAction.UPDATE,
      snapshot: {
        before: { isMaintenanceMode: config.isMaintenanceMode },
        after: { isMaintenanceMode: newMaintenanceMode },
      },
      ipAddress: ctx.ipAddress,
    });

    return this.mapToResponse(updated);
  }

  private mapToResponse(config: {
    id: string;
    tenantId: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    siteTitle: string;
    welcomeMessage: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    address: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    isMaintenanceMode: boolean;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): WebsiteResponseDto {
    return {
      id: config.id,
      tenantId: config.tenantId,
      logoUrl: config.logoUrl ?? undefined,
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      backgroundColor: config.backgroundColor,
      siteTitle: config.siteTitle,
      welcomeMessage: config.welcomeMessage ?? undefined,
      contactEmail: config.contactEmail ?? undefined,
      contactPhone: config.contactPhone ?? undefined,
      address: config.address ?? undefined,
      metaTitle: config.metaTitle ?? undefined,
      metaDescription: config.metaDescription ?? undefined,
      isMaintenanceMode: config.isMaintenanceMode,
      isPublic: config.isPublic,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}
