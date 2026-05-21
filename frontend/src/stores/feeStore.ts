/* =============================================================================
   SaaS Inmobiliario — Fee Store (Zustand)
   ============================================================================= */

import { create } from 'zustand';
import type {
  Fee,
  CreateFeeDto,
  UpdateFeeDto,
  UpdateFeeStatusDto,
  FindAllFeesParams,
  PaginatedFees,
} from '../types/fee';
import {
  getFees,
  getFee,
  createFee as createFeeApi,
  updateFee as updateFeeApi,
  updateFeeStatus as updateFeeStatusApi,
} from '../services/fee';

interface FeeState {
  fees: Fee[];
  selectedFee: Fee | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  limit: number;

  fetchFees: (params?: FindAllFeesParams) => Promise<void>;
  fetchFeeById: (id: string) => Promise<void>;
  createFee: (dto: CreateFeeDto) => Promise<Fee>;
  updateFee: (id: string, dto: UpdateFeeDto) => Promise<Fee>;
  updateFeeStatus: (id: string, dto: UpdateFeeStatusDto) => Promise<Fee>;
  setSelectedFee: (fee: Fee | null) => void;
  clearError: () => void;
}

export const useFeeStore = create<FeeState>((set) => ({
  fees: [],
  selectedFee: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 20,

  fetchFees: async (params?: FindAllFeesParams) => {
    set({ loading: true, error: null });
    try {
      const result: PaginatedFees = await getFees(params);
      set({
        fees: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar cuotas';
      set({ error: message, loading: false });
    }
  },

  fetchFeeById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const fee = await getFee(id);
      set({ selectedFee: fee, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar cuota';
      set({ error: message, loading: false });
    }
  },

  createFee: async (dto: CreateFeeDto) => {
    set({ loading: true, error: null });
    try {
      const fee = await createFeeApi(dto);
      set((state) => ({
        fees: [fee, ...state.fees],
        total: state.total + 1,
        loading: false,
      }));
      return fee;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear cuota';
      set({ error: message, loading: false });
      throw err;
    }
  },

  updateFee: async (id: string, dto: UpdateFeeDto) => {
    set({ loading: true, error: null });
    try {
      const fee = await updateFeeApi(id, dto);
      set((state) => ({
        fees: state.fees.map((f) => (f.id === id ? fee : f)),
        selectedFee: state.selectedFee?.id === id ? fee : state.selectedFee,
        loading: false,
      }));
      return fee;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar cuota';
      set({ error: message, loading: false });
      throw err;
    }
  },

  updateFeeStatus: async (id: string, dto: UpdateFeeStatusDto) => {
    set({ loading: true, error: null });
    try {
      const fee = await updateFeeStatusApi(id, dto);
      set((state) => ({
        fees: state.fees.map((f) => (f.id === id ? fee : f)),
        selectedFee: state.selectedFee?.id === id ? fee : state.selectedFee,
        loading: false,
      }));
      return fee;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar estado';
      set({ error: message, loading: false });
      throw err;
    }
  },

  setSelectedFee: (fee) => set({ selectedFee: fee }),

  clearError: () => set({ error: null }),
}));
