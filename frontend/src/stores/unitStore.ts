/* =============================================================================
   SaaS Inmobiliario — Unit Store (Zustand)
   ============================================================================= */

import { create } from 'zustand';
import type {
  Unit,
  CreateUnitDto,
  UpdateUnitDto,
  FindAllUnitsParams,
  PaginatedUnits,
} from '../types/property';
import {
  findAllUnits,
  findUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
} from '../services/unit';

interface UnitState {
  units: Unit[];
  selectedUnit: Unit | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  limit: number;

  fetchUnits: (params?: FindAllUnitsParams) => Promise<void>;
  fetchUnitById: (id: string) => Promise<void>;
  createUnit: (dto: CreateUnitDto) => Promise<Unit>;
  updateUnit: (id: string, dto: UpdateUnitDto) => Promise<Unit>;
  deleteUnit: (id: string) => Promise<void>;
  setSelectedUnit: (unit: Unit | null) => void;
  clearError: () => void;
}

export const useUnitStore = create<UnitState>((set) => ({
  units: [],
  selectedUnit: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 20,

  fetchUnits: async (params?: FindAllUnitsParams) => {
    set({ loading: true, error: null });
    try {
      const result: PaginatedUnits = await findAllUnits(params);
      set({
        units: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar unidades';
      set({ error: message, loading: false });
    }
  },

  fetchUnitById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const unit = await findUnitById(id);
      set({ selectedUnit: unit, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar unidad';
      set({ error: message, loading: false });
    }
  },

  createUnit: async (dto: CreateUnitDto) => {
    set({ loading: true, error: null });
    try {
      const unit = await createUnit(dto);
      set((state) => ({
        units: [unit, ...state.units],
        total: state.total + 1,
        loading: false,
      }));
      return unit;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear unidad';
      set({ error: message, loading: false });
      throw err;
    }
  },

  updateUnit: async (id: string, dto: UpdateUnitDto) => {
    set({ loading: true, error: null });
    try {
      const unit = await updateUnit(id, dto);
      set((state) => ({
        units: state.units.map((u) => (u.id === id ? unit : u)),
        selectedUnit: state.selectedUnit?.id === id ? unit : state.selectedUnit,
        loading: false,
      }));
      return unit;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar unidad';
      set({ error: message, loading: false });
      throw err;
    }
  },

  deleteUnit: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteUnit(id);
      set((state) => ({
        units: state.units.filter((u) => u.id !== id),
        selectedUnit: state.selectedUnit?.id === id ? null : state.selectedUnit,
        total: state.total - 1,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar unidad';
      set({ error: message, loading: false });
      throw err;
    }
  },

  setSelectedUnit: (unit) => set({ selectedUnit: unit }),

  clearError: () => set({ error: null }),
}));