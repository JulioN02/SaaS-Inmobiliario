/* =============================================================================
   SaaS Inmobiliario — Announcement Store (Zustand)
   ============================================================================= */

import { create } from 'zustand';
import type {
  Announcement,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  FindAllAnnouncementsParams,
  PaginatedAnnouncements,
} from '../types/announcement';
import {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement as createAnnouncementApi,
  updateAnnouncement as updateAnnouncementApi,
  deleteAnnouncement as deleteAnnouncementApi,
} from '../services/announcement';

interface AnnouncementState {
  announcements: Announcement[];
  selectedAnnouncement: Announcement | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  limit: number;

  fetchAnnouncements: (params?: FindAllAnnouncementsParams) => Promise<void>;
  fetchAnnouncementById: (id: string) => Promise<void>;
  createAnnouncement: (dto: CreateAnnouncementDto) => Promise<Announcement>;
  updateAnnouncement: (id: string, dto: UpdateAnnouncementDto) => Promise<Announcement>;
  deleteAnnouncement: (id: string) => Promise<void>;
  setSelectedAnnouncement: (announcement: Announcement | null) => void;
  clearError: () => void;
}

export const useAnnouncementStore = create<AnnouncementState>((set) => ({
  announcements: [],
  selectedAnnouncement: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 20,

  fetchAnnouncements: async (params?: FindAllAnnouncementsParams) => {
    set({ loading: true, error: null });
    try {
      const result: PaginatedAnnouncements = await getAnnouncements(params);
      set({
        announcements: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar anuncios';
      set({ error: message, loading: false });
    }
  },

  fetchAnnouncementById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const announcement = await getAnnouncement(id);
      set({ selectedAnnouncement: announcement, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar anuncio';
      set({ error: message, loading: false });
    }
  },

  createAnnouncement: async (dto: CreateAnnouncementDto) => {
    set({ loading: true, error: null });
    try {
      const announcement = await createAnnouncementApi(dto);
      set((state) => ({
        announcements: [announcement, ...state.announcements],
        total: state.total + 1,
        loading: false,
      }));
      return announcement;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear anuncio';
      set({ error: message, loading: false });
      throw err;
    }
  },

  updateAnnouncement: async (id: string, dto: UpdateAnnouncementDto) => {
    set({ loading: true, error: null });
    try {
      const announcement = await updateAnnouncementApi(id, dto);
      set((state) => ({
        announcements: state.announcements.map((a) => (a.id === id ? announcement : a)),
        selectedAnnouncement: state.selectedAnnouncement?.id === id ? announcement : state.selectedAnnouncement,
        loading: false,
      }));
      return announcement;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar anuncio';
      set({ error: message, loading: false });
      throw err;
    }
  },

  deleteAnnouncement: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteAnnouncementApi(id);
      set((state) => ({
        announcements: state.announcements.filter((a) => a.id !== id),
        selectedAnnouncement: state.selectedAnnouncement?.id === id ? null : state.selectedAnnouncement,
        total: state.total - 1,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar anuncio';
      set({ error: message, loading: false });
      throw err;
    }
  },

  setSelectedAnnouncement: (announcement) => set({ selectedAnnouncement: announcement }),

  clearError: () => set({ error: null }),
}));
