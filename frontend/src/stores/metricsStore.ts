/* =============================================================================
   SaaS Inmobiliario — Metrics Store (Zustand)
   ============================================================================= */

import { create } from 'zustand';
import { getPlatformMetrics, getTenantMetrics, type MetricsResponse } from '../services/metrics';

interface MetricsState {
  metrics: MetricsResponse | null;
  loading: boolean;
  error: string | null;

  fetchPlatformMetrics: () => Promise<void>;
  fetchTenantMetrics: (tenantId: string) => Promise<void>;
  clearError: () => void;
}

export const useMetricsStore = create<MetricsState>((set) => ({
  metrics: null,
  loading: false,
  error: null,

  fetchPlatformMetrics: async () => {
    set({ loading: true, error: null });
    try {
      const metrics = await getPlatformMetrics();
      set({ metrics, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar métricas';
      set({ error: message, loading: false });
    }
  },

  fetchTenantMetrics: async (tenantId: string) => {
    set({ loading: true, error: null });
    try {
      const metrics = await getTenantMetrics(tenantId);
      set({ metrics, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar métricas';
      set({ error: message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));