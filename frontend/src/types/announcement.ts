/* =============================================================================
   SaaS Inmobiliario — Announcement Types
   ============================================================================= */

export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Announcement {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  targetRoles: string[];
  targetUnits: string[];
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  targetRoles?: string[];
  targetUnits?: string[];
  startsAt?: string;
  endsAt?: string;
}

export interface UpdateAnnouncementDto {
  title?: string;
  content?: string;
  priority?: AnnouncementPriority;
  targetRoles?: string[];
  targetUnits?: string[];
  startsAt?: string;
  endsAt?: string;
  isActive?: boolean;
}

export interface FindAllAnnouncementsParams {
  isActive?: boolean;
  priority?: AnnouncementPriority;
  targetRole?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAnnouncements {
  data: Announcement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
