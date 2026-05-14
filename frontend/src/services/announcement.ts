/* =============================================================================
   SaaS Inmobiliario — Announcement Service
   ============================================================================= */

import { api } from './api';
import type {
  Announcement,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  FindAllAnnouncementsParams,
  PaginatedAnnouncements,
} from '../types/announcement';

export async function getAnnouncements(params?: FindAllAnnouncementsParams): Promise<PaginatedAnnouncements> {
  const response = await api.get<PaginatedAnnouncements>('/announcements', { params });
  return response.data;
}

export async function getAnnouncement(id: string): Promise<Announcement> {
  const response = await api.get<Announcement>(`/announcements/${id}`);
  return response.data;
}

export async function createAnnouncement(dto: CreateAnnouncementDto): Promise<Announcement> {
  const response = await api.post<Announcement>('/announcements', dto);
  return response.data;
}

export async function updateAnnouncement(id: string, dto: UpdateAnnouncementDto): Promise<Announcement> {
  const response = await api.patch<Announcement>(`/announcements/${id}`, dto);
  return response.data;
}

export async function deleteAnnouncement(id: string): Promise<Announcement> {
  const response = await api.delete<Announcement>(`/announcements/${id}`);
  return response.data;
}
