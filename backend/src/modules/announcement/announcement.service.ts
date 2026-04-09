import { announcementRepository, CreateAnnouncementInput, UpdateAnnouncementInput, AnnouncementFilters } from './announcement.repository';
import { NotFoundError } from '../../shared/errors';
import { UserRole } from '@prisma/client';

export const announcementService = {
  list: (filters: AnnouncementFilters) => announcementRepository.findAll(filters),

  findById: async (id: string, tenantId: string) => {
    const announcement = await announcementRepository.findById(id, tenantId);
    if (!announcement) throw new NotFoundError(`Announcement ${id} not found`);
    return announcement;
  },

  create: async (data: CreateAnnouncementInput, ctx: { tenantId: string; userId: string; ipAddress?: string }) => {
    const { tenantId, userId } = ctx;

    return announcementRepository.create({
      ...data,
      tenantId,
      createdBy: userId
    });
  },

  update: async (id: string, data: UpdateAnnouncementInput, ctx: { tenantId: string }) => {
    const { tenantId } = ctx;

    const announcement = await announcementRepository.findById(id, tenantId);
    if (!announcement) throw new NotFoundError(`Announcement ${id} not found`);

    return announcementRepository.update(id, data);
  },

  delete: async (id: string, ctx: { tenantId: string }) => {
    const { tenantId } = ctx;

    const announcement = await announcementRepository.findById(id, tenantId);
    if (!announcement) throw new NotFoundError(`Announcement ${id} not found`);

    return announcementRepository.delete(id);
  }
};
