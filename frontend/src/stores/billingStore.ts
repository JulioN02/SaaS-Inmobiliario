/* =============================================================================
   SaaS Inmobiliario — Billing Store (Zustand)
   ============================================================================= */

import { create } from 'zustand';
import type { BillingMetrics, TenantBillingStatus } from '../types';
import {
  fetchBillingMetrics as fetchBillingMetricsService,
  fetchTenantBillingStatuses as fetchTenantBillingStatusesService,
  type TenantBillingStatusParams,
  type PaginatedTenantBilling,
} from '../services/billing';

interface BillingState {
  metrics: BillingMetrics | null;
  tenants: TenantBillingStatus[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
  loading: boolean;
  error: string | null;

  fetchMetrics: () => Promise<void>;
  fetchTenants: (params?: TenantBillingStatusParams) => Promise<void>;
  clearError: () => void;
}

export const useBillingStore = create<BillingState>((set) => ({
  metrics: null,
  tenants: [],
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 10,
  loading: false,
  error: null,

  fetchMetrics: async () => {
    set({ loading: true, error: null });
    try {
      const metrics = await fetchBillingMetricsService();
      set({ metrics, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar métricas';
      set({ error: message, loading: false });
    }
  },

  fetchTenants: async (params?: TenantBillingStatusParams) => {
    set({ loading: true, error: null });
    try {
      const result: PaginatedTenantBilling = await fetchTenantBillingStatusesService(params);
      set({
        tenants: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar tenants';
      set({ error: message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
