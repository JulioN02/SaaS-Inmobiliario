/* =============================================================================
   SaaS Inmobiliario — Tower Store (Zustand)
   ============================================================================= */

import { create } from 'zustand';
import type {
  Tower,
  CreateTowerDto,
  UpdateTowerDto,
  FindAllTowersParams,
  PaginatedTowers,
} from '../types/property';
import {
  findAllTowers,
  createTower as createTowerApi,
  updateTower,
  deleteTower,
} from '../services/tower';

interface TowerState {
  towers: Tower[];
  selectedTower: Tower | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  limit: number;

  fetchTowers: (params: FindAllTowersParams) => Promise<void>;
  createTower: (dto: CreateTowerDto) => Promise<Tower>;
  updateTower: (id: string, dto: UpdateTowerDto) => Promise<Tower>;
  deleteTower: (id: string) => Promise<void>;
  setSelectedTower: (tower: Tower | null) => void;
  clearError: () => void;
}

export const useTowerStore = create<TowerState>((set) => ({
  towers: [],
  selectedTower: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 50,

  fetchTowers: async (params: FindAllTowersParams) => {
    set({ loading: true, error: null });
    try {
      const result: PaginatedTowers = await findAllTowers(params);
      set({
        towers: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar torres';
      set({ error: message, loading: false });
    }
  },

  createTower: async (dto: CreateTowerDto) => {
    set({ loading: true, error: null });
    try {
      const tower = await createTowerApi(dto);
      set((state) => ({
        towers: [tower, ...state.towers],
        total: state.total + 1,
        loading: false,
      }));
      return tower;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear torre';
      set({ error: message, loading: false });
      throw err;
    }
  },

  updateTower: async (id: string, dto: UpdateTowerDto) => {
    set({ loading: true, error: null });
    try {
      const tower = await updateTower(id, dto);
      set((state) => ({
        towers: state.towers.map((t) => (t.id === id ? tower : t)),
        selectedTower: state.selectedTower?.id === id ? tower : state.selectedTower,
        loading: false,
      }));
      return tower;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar torre';
      set({ error: message, loading: false });
      throw err;
    }
  },

  deleteTower: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteTower(id);
      set((state) => ({
        towers: state.towers.filter((t) => t.id !== id),
        selectedTower: state.selectedTower?.id === id ? null : state.selectedTower,
        total: state.total - 1,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar torre';
      set({ error: message, loading: false });
      throw err;
    }
  },

  setSelectedTower: (tower) => set({ selectedTower: tower }),

  clearError: () => set({ error: null }),
}));