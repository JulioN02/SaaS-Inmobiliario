import { prisma } from '../../config/database';
import { Prisma, UserRole } from '@prisma/client';

export type CreateAnnouncementInput = {
  title: string;
  body: string;
  targetRoles: UserRole[];
};

export type UpdateAnnouncementInput = {
  title?: string;
  body?: string;
  targetRoles?: UserRole[];
};

export type AnnouncementFilters = {
  tenantId: string;
  role?: UserRole; // To filter by role
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
};

export const announcementRepository = {
  findAll: async (filters: AnnouncementFilters) => {
    const { tenantId, role, includeDeleted = false, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.AnnouncementWhereInput = {
      tenantId,
      ...(role && { targetRoles: { has: role } }),
      ...(!includeDeleted && { deletedAt: null })
    };

    const [total, data] = await Promise.all([
      prisma.announcement.count({ where }),
      prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return { data, total, page, limit };
  },

  findById: (id: string, tenantId: string) =>
    prisma.announcement.findFirst({
      where: { id, tenantId, deletedAt: null }
    }),

  create: (data: CreateAnnouncementInput & { tenantId: string; createdBy: string }) =>
    prisma.announcement.create({
      data
    }),

  update: (id: string, data: UpdateAnnouncementInput) =>
    prisma.announcement.update({
      where: { id },
      data
    }),

  delete: (id: string) =>
    prisma.announcement.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
};
