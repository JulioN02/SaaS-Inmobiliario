import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AuditService } from '../shared/audit.service';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  FindAllAnnouncementsDto,
  AnnouncementResponseDto,
} from './dto';
import { AuditAction, AuditEntity, AnnouncementPriority, UserRole, Prisma } from '@prisma/client';

interface CallerCtx {
  userId: string;
  tenantId: string;
  ipAddress?: string;
}

@Injectable()
export class AnnouncementService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateAnnouncementDto, userId: string, tenantId: string, ctx: CallerCtx) {
    const announcement = await this.prisma.announcement.create({
      data: {
        tenantId,
        title: dto.title,
        content: dto.content,
        priority: dto.priority || AnnouncementPriority.NORMAL,
        targetRoles: (dto.targetRoles || []) as UserRole[],
        targetUnits: dto.targetUnits || [],
        startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        isActive: true,
        createdBy: userId,
      },
      select: this.announcementSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.announcement,
      entityId: announcement.id,
      action: AuditAction.CREATE,
      snapshot: {
        title: announcement.title,
        priority: announcement.priority,
        targetRoles: announcement.targetRoles,
        targetUnits: announcement.targetUnits,
      },
      ipAddress: ctx.ipAddress,
    });

    return this.mapToResponse(announcement);
  }

  async findAll(filters: FindAllAnnouncementsDto, tenantId: string, userRole?: string) {
    const { isActive, priority, targetRole, page = 1, limit = 20 } = filters;

    const where: Prisma.AnnouncementWhereInput = {
      tenantId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(priority && { priority }),
      ...(targetRole && {
        OR: [
          { targetRoles: { has: targetRole as UserRole } },
          { targetRoles: { isEmpty: true } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
        select: this.announcementSelect(),
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return {
      data: data.map((announcement) => this.mapToResponse(announcement)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, tenantId: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: this.announcementSelect(),
    });

    if (!announcement) {
      throw new NotFoundException(`Anuncio ${id} no encontrado`);
    }

    return this.mapToResponse(announcement);
  }

  async update(id: string, dto: UpdateAnnouncementDto, tenantId: string, ctx: CallerCtx) {
    const announcement = await this.findByIdInternal(id, tenantId);

    const data: Prisma.AnnouncementUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.targetRoles !== undefined) data.targetRoles = dto.targetRoles as UserRole[];
    if (dto.targetUnits !== undefined) data.targetUnits = dto.targetUnits;
    if (dto.startsAt !== undefined) data.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) data.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.prisma.announcement.update({
      where: { id },
      data,
      select: this.announcementSelect(),
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.announcement,
      entityId: id,
      action: AuditAction.UPDATE,
      snapshot: {
        before: {
          title: announcement.title,
          priority: announcement.priority,
        },
        after: {
          title: updated.title,
          priority: updated.priority,
        },
      },
      ipAddress: ctx.ipAddress,
    });

    return this.mapToResponse(updated);
  }

  async softDelete(id: string, tenantId: string, ctx: CallerCtx) {
    const announcement = await this.findByIdInternal(id, tenantId);

    await this.prisma.announcement.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Audit log
    await this.auditService.log({
      tenantId,
      userId: ctx.userId,
      entity: AuditEntity.announcement,
      entityId: id,
      action: AuditAction.DELETE,
      snapshot: {
        title: announcement.title,
      },
      ipAddress: ctx.ipAddress,
    });

    return { message: 'Anuncio eliminado correctamente' };
  }

  private async findByIdInternal(id: string, tenantId: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      select: this.announcementSelect(),
    });

    if (!announcement) {
      throw new NotFoundException(`Anuncio ${id} no encontrado`);
    }

    return announcement;
  }

  private announcementSelect() {
    return {
      id: true,
      tenantId: true,
      title: true,
      content: true,
      priority: true,
      targetRoles: true,
      targetUnits: true,
      startsAt: true,
      endsAt: true,
      isActive: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
      createdByUser: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    };
  }

  private mapToResponse(announcement: any): AnnouncementResponseDto {
    return {
      id: announcement.id,
      tenantId: announcement.tenantId,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetRoles: announcement.targetRoles,
      targetUnits: announcement.targetUnits,
      startsAt: announcement.startsAt,
      endsAt: announcement.endsAt,
      isActive: announcement.isActive,
      createdBy: announcement.createdBy,
      createdByUser: announcement.createdByUser,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
    };
  }
}
