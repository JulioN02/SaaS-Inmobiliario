/* =============================================================================
   SaaS Inmobiliario — Website Config Store (Zustand)
   ============================================================================= */

import { create } from 'zustand';
import type { WebsiteConfig, UpdateWebsiteDto } from '../types/website';
import * as websiteService from '../services/website';

interface WebsiteStore {
  config: WebsiteConfig | null;
  loading: boolean;
  error: string | null;
  
  fetchConfig: () => Promise<void>;
  updateConfig: (dto: UpdateWebsiteDto) => Promise<void>;
  toggleMaintenance: () => Promise<void>;
  setConfig: (config: WebsiteConfig | null) => void;
  clearError: () => void;
}

export const useWebsiteStore = create<WebsiteStore>((set) => ({
  config: null,
  loading: false,
  error: null,
  
  fetchConfig: async () => {
    set({ loading: true, error: null });
    try {
      const config = await websiteService.getWebsite();
      set({ config, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Error al cargar configuración', loading: false });
    }
  },
  
  updateConfig: async (dto) => {
    set({ loading: true, error: null });
    try {
      const config = await websiteService.updateWebsite(dto);
      set({ config, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Error al actualizar configuración', loading: false });
    }
  },
  
  toggleMaintenance: async () => {
    set({ loading: true, error: null });
    try {
      const config = await websiteService.toggleMaintenance();
      set({ config, loading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Error al cambiar modo mantenimiento', loading: false });
    }
  },
  
  setConfig: (config) => set({ config }),
  clearError: () => set({ error: null }),
}));
