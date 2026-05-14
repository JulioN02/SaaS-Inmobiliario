/* =============================================================================
   SaaS Inmobiliario — Visitor Store (Zustand)
   ============================================================================= */

import { create } from 'zustand';
import type {
  Visitor,
  CreateVisitorDto,
  CheckoutVisitorDto,
  FindAllVisitorsParams,
  PaginatedVisitors,
} from '../types/visitor';
import {
  findAllVisitors,
  findVisitorById,
  createVisitor as createVisitorApi,
  checkoutVisitor as checkoutVisitorApi,
} from '../services/visitor';

interface VisitorState {
  visitors: Visitor[];
  selectedVisitor: Visitor | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  limit: number;

  fetchVisitors: (params?: FindAllVisitorsParams) => Promise<void>;
  fetchVisitorById: (id: string) => Promise<void>;
  registerVisitor: (dto: CreateVisitorDto) => Promise<Visitor>;
  checkoutVisitor: (id: string, dto: CheckoutVisitorDto) => Promise<Visitor>;
  setSelectedVisitor: (visitor: Visitor | null) => void;
  clearError: () => void;
}

export const useVisitorStore = create<VisitorState>((set) => ({
  visitors: [],
  selectedVisitor: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 20,

  fetchVisitors: async (params?: FindAllVisitorsParams) => {
    set({ loading: true, error: null });
    try {
      const result: PaginatedVisitors = await findAllVisitors(params);
      set({
        visitors: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar visitantes';
      set({ error: message, loading: false });
    }
  },

  fetchVisitorById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const visitor = await findVisitorById(id);
      set({ selectedVisitor: visitor, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar visitante';
      set({ error: message, loading: false });
    }
  },

  registerVisitor: async (dto: CreateVisitorDto) => {
    set({ loading: true, error: null });
    try {
      const visitor = await createVisitorApi(dto);
      set((state) => ({
        visitors: [visitor, ...state.visitors],
        total: state.total + 1,
        loading: false,
      }));
      return visitor;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrar visitante';
      set({ error: message, loading: false });
      throw err;
    }
  },

  checkoutVisitor: async (id: string, dto: CheckoutVisitorDto) => {
    set({ loading: true, error: null });
    try {
      const visitor = await checkoutVisitorApi(id, dto);
      set((state) => ({
        visitors: state.visitors.map((v) => (v.id === id ? visitor : v)),
        selectedVisitor: state.selectedVisitor?.id === id ? visitor : state.selectedVisitor,
        loading: false,
      }));
      return visitor;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrar salida';
      set({ error: message, loading: false });
      throw err;
    }
  },

  setSelectedVisitor: (visitor) => set({ selectedVisitor: visitor }),

  clearError: () => set({ error: null }),
}));