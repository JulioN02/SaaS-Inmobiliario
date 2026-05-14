/* =============================================================================
   SaaS Inmobiliario — Tenant Store (Zustand)
   ============================================================================= */

import { create } from 'zustand';
import type { Tenant, TenantPlan, FindAllTenantsParams } from '../types';
import {
  findAllTenants,
  findTenantById,
  createTenant,
  updateTenant,
  suspendTenant,
  activateTenant,
  changeTenantPlan,
  deleteTenant,
  type CreateTenantDto,
  type UpdateTenantDto,
  type PaginatedTenants,
} from '../services/tenant';

interface TenantState {
  tenants: Tenant[];
  selectedTenant: Tenant | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  limit: number;

  fetchTenants: (params?: FindAllTenantsParams) => Promise<void>;
  fetchTenantById: (id: string) => Promise<void>;
  createTenant: (dto: CreateTenantDto) => Promise<Tenant>;
  updateTenant: (id: string, dto: UpdateTenantDto) => Promise<Tenant>;
  suspendTenant: (id: string) => Promise<Tenant>;
  activateTenant: (id: string) => Promise<Tenant>;
  changeTenantPlan: (id: string, plan: TenantPlan) => Promise<Tenant>;
  deleteTenant: (id: string) => Promise<void>;
  setSelectedTenant: (tenant: Tenant | null) => void;
  clearError: () => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenants: [],
  selectedTenant: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 10,

  fetchTenants: async (params?: FindAllTenantsParams) => {
    set({ loading: true, error: null });
    try {
      const result: PaginatedTenants = await findAllTenants(params);
      set({
        tenants: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar tenants';
      set({ error: message, loading: false });
    }
  },

  fetchTenantById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const tenant = await findTenantById(id);
      set({ selectedTenant: tenant, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar tenant';
      set({ error: message, loading: false });
    }
  },

  createTenant: async (dto: CreateTenantDto) => {
    set({ loading: true, error: null });
    try {
      const tenant = await createTenant(dto);
      set((state) => ({
        tenants: [tenant, ...state.tenants],
        total: state.total + 1,
        loading: false,
      }));
      return tenant;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear tenant';
      set({ error: message, loading: false });
      throw err;
    }
  },

  updateTenant: async (id: string, dto: UpdateTenantDto) => {
    set({ loading: true, error: null });
    try {
      const tenant = await updateTenant(id, dto);
      set((state) => ({
        tenants: state.tenants.map((t) => (t.id === id ? tenant : t)),
        selectedTenant: state.selectedTenant?.id === id ? tenant : state.selectedTenant,
        loading: false,
      }));
      return tenant;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar tenant';
      set({ error: message, loading: false });
      throw err;
    }
  },

  suspendTenant: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const tenant = await suspendTenant(id);
      set((state) => ({
        tenants: state.tenants.map((t) => (t.id === id ? tenant : t)),
        selectedTenant: state.selectedTenant?.id === id ? tenant : state.selectedTenant,
        loading: false,
      }));
      return tenant;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al suspender tenant';
      set({ error: message, loading: false });
      throw err;
    }
  },

  activateTenant: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const tenant = await activateTenant(id);
      set((state) => ({
        tenants: state.tenants.map((t) => (t.id === id ? tenant : t)),
        selectedTenant: state.selectedTenant?.id === id ? tenant : state.selectedTenant,
        loading: false,
      }));
      return tenant;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al activar tenant';
      set({ error: message, loading: false });
      throw err;
    }
  },

  changeTenantPlan: async (id: string, plan: TenantPlan) => {
    set({ loading: true, error: null });
    try {
      const tenant = await changeTenantPlan(id, plan);
      set((state) => ({
        tenants: state.tenants.map((t) => (t.id === id ? tenant : t)),
        selectedTenant: state.selectedTenant?.id === id ? tenant : state.selectedTenant,
        loading: false,
      }));
      return tenant;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cambiar plan';
      set({ error: message, loading: false });
      throw err;
    }
  },

  deleteTenant: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteTenant(id);
      set((state) => ({
        tenants: state.tenants.filter((t) => t.id !== id),
        selectedTenant: state.selectedTenant?.id === id ? null : state.selectedTenant,
        total: state.total - 1,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar tenant';
      set({ error: message, loading: false });
      throw err;
    }
  },

  setSelectedTenant: (tenant) => set({ selectedTenant: tenant }),

  clearError: () => set({ error: null }),
}));