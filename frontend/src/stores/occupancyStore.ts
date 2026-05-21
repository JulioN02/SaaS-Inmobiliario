/* =============================================================================
   SaaS Inmobiliario — Occupancy Store (Zustand)
   ============================================================================= */

import { create } from 'zustand';
import type {
  Occupancy,
  CreateOccupancyDto,
  CloseOccupancyDto,
  FindAllOccupanciesParams,
  PaginatedOccupancies,
} from '../types/resident';
import {
  findAllOccupancies,
  findOccupancyById,
  createOccupancy,
  closeOccupancy,
} from '../services/occupancy';

interface OccupancyState {
  occupancies: Occupancy[];
  selectedOccupancy: Occupancy | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  limit: number;

  fetchOccupancies: (params?: FindAllOccupanciesParams) => Promise<void>;
  fetchOccupancyById: (id: string) => Promise<void>;
  createOccupancy: (dto: CreateOccupancyDto) => Promise<Occupancy>;
  closeOccupancy: (id: string, dto: CloseOccupancyDto) => Promise<Occupancy>;
  setSelectedOccupancy: (occupancy: Occupancy | null) => void;
  clearError: () => void;
}

export const useOccupancyStore = create<OccupancyState>((set) => ({
  occupancies: [],
  selectedOccupancy: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 20,

  fetchOccupancies: async (params?: FindAllOccupanciesParams) => {
    set({ loading: true, error: null });
    try {
      const result: PaginatedOccupancies = await findAllOccupancies(params);
      set({
        occupancies: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar ocupaciones';
      set({ error: message, loading: false });
    }
  },

  fetchOccupancyById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const occupancy = await findOccupancyById(id);
      set({ selectedOccupancy: occupancy, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar ocupación';
      set({ error: message, loading: false });
    }
  },

  createOccupancy: async (dto: CreateOccupancyDto) => {
    set({ loading: true, error: null });
    try {
      const occupancy = await createOccupancy(dto);
      set((state) => ({
        occupancies: [occupancy, ...state.occupancies],
        total: state.total + 1,
        loading: false,
      }));
      return occupancy;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear ocupación';
      set({ error: message, loading: false });
      throw err;
    }
  },

  closeOccupancy: async (id: string, dto: CloseOccupancyDto) => {
    set({ loading: true, error: null });
    try {
      const occupancy = await closeOccupancy(id, dto);
      set((state) => ({
        occupancies: state.occupancies.map((o) => (o.id === id ? occupancy : o)),
        selectedOccupancy: state.selectedOccupancy?.id === id ? occupancy : state.selectedOccupancy,
        loading: false,
      }));
      return occupancy;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cerrar ocupación';
      set({ error: message, loading: false });
      throw err;
    }
  },

  setSelectedOccupancy: (occupancy) => set({ selectedOccupancy: occupancy }),

  clearError: () => set({ error: null }),
}));