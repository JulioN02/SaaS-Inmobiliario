/* =============================================================================
   SaaS Inmobiliario — Maintenance Store (Zustand)
   ============================================================================= */

import { create } from 'zustand';
import type {
  MaintenanceRequest,
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  FindAllMaintenanceParams,
  PaginatedMaintenances,
} from '../types/maintenance';
import {
  findAllMaintenances,
  findMaintenanceById,
  createMaintenance as createMaintenanceApi,
  updateMaintenance as updateMaintenanceApi,
} from '../services/maintenance';

interface MaintenanceState {
  requests: MaintenanceRequest[];
  selectedRequest: MaintenanceRequest | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  limit: number;

  fetchMaintenances: (params?: FindAllMaintenanceParams) => Promise<void>;
  fetchMaintenanceById: (id: string) => Promise<void>;
  createMaintenance: (dto: CreateMaintenanceDto) => Promise<MaintenanceRequest>;
  updateMaintenance: (id: string, dto: UpdateMaintenanceDto) => Promise<MaintenanceRequest>;
  setSelectedRequest: (request: MaintenanceRequest | null) => void;
  clearError: () => void;
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  requests: [],
  selectedRequest: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 20,

  fetchMaintenances: async (params?: FindAllMaintenanceParams) => {
    set({ loading: true, error: null });
    try {
      const result: PaginatedMaintenances = await findAllMaintenances(params);
      set({
        requests: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar solicitudes';
      set({ error: message, loading: false });
    }
  },

  fetchMaintenanceById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const request = await findMaintenanceById(id);
      set({ selectedRequest: request, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar solicitud';
      set({ error: message, loading: false });
    }
  },

  createMaintenance: async (dto: CreateMaintenanceDto) => {
    set({ loading: true, error: null });
    try {
      const request = await createMaintenanceApi(dto);
      set((state) => ({
        requests: [request, ...state.requests],
        total: state.total + 1,
        loading: false,
      }));
      return request;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear solicitud';
      set({ error: message, loading: false });
      throw err;
    }
  },

  updateMaintenance: async (id: string, dto: UpdateMaintenanceDto) => {
    set({ loading: true, error: null });
    try {
      const request = await updateMaintenanceApi(id, dto);
      set((state) => ({
        requests: state.requests.map((r) => (r.id === id ? request : r)),
        selectedRequest: state.selectedRequest?.id === id ? request : state.selectedRequest,
        loading: false,
      }));
      return request;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar solicitud';
      set({ error: message, loading: false });
      throw err;
    }
  },

  setSelectedRequest: (request) => set({ selectedRequest: request }),

  clearError: () => set({ error: null }),
}));