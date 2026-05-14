/* =============================================================================
   SaaS Inmobiliario — Resident Store (Zustand)
   ============================================================================= */

import { create } from 'zustand';
import type {
  Resident,
  CreateResidentDto,
  UpdateResidentDto,
  FindAllResidentsParams,
  PaginatedResidents,
} from '../types/resident';
import {
  findAllResidents,
  findResidentById,
  createResident,
  updateResident,
  deleteResident,
} from '../services/resident';

interface ResidentState {
  residents: Resident[];
  selectedResident: Resident | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  limit: number;

  fetchResidents: (params?: FindAllResidentsParams) => Promise<void>;
  fetchResidentById: (id: string) => Promise<void>;
  createResident: (dto: CreateResidentDto) => Promise<Resident>;
  updateResident: (id: string, dto: UpdateResidentDto) => Promise<Resident>;
  deleteResident: (id: string) => Promise<void>;
  setSelectedResident: (resident: Resident | null) => void;
  clearError: () => void;
}

export const useResidentStore = create<ResidentState>((set) => ({
  residents: [],
  selectedResident: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 10,

  fetchResidents: async (params?: FindAllResidentsParams) => {
    set({ loading: true, error: null });
    try {
      const result: PaginatedResidents = await findAllResidents(params);
      set({
        residents: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar residentes';
      set({ error: message, loading: false });
    }
  },

  fetchResidentById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const resident = await findResidentById(id);
      set({ selectedResident: resident, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar residente';
      set({ error: message, loading: false });
    }
  },

  createResident: async (dto: CreateResidentDto) => {
    set({ loading: true, error: null });
    try {
      const resident = await createResident(dto);
      set((state) => ({
        residents: [resident, ...state.residents],
        total: state.total + 1,
        loading: false,
      }));
      return resident;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear residente';
      set({ error: message, loading: false });
      throw err;
    }
  },

  updateResident: async (id: string, dto: UpdateResidentDto) => {
    set({ loading: true, error: null });
    try {
      const resident = await updateResident(id, dto);
      set((state) => ({
        residents: state.residents.map((r) => (r.id === id ? resident : r)),
        selectedResident: state.selectedResident?.id === id ? resident : state.selectedResident,
        loading: false,
      }));
      return resident;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar residente';
      set({ error: message, loading: false });
      throw err;
    }
  },

  deleteResident: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteResident(id);
      set((state) => ({
        residents: state.residents.filter((r) => r.id !== id),
        selectedResident: state.selectedResident?.id === id ? null : state.selectedResident,
        total: state.total - 1,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar residente';
      set({ error: message, loading: false });
      throw err;
    }
  },

  setSelectedResident: (resident) => set({ selectedResident: resident }),

  clearError: () => set({ error: null }),
}));