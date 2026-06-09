/* =============================================================================
   SaaS Inmobiliario — Plan Store (Zustand)
   ============================================================================= */

import { create } from 'zustand';
import type { Plan, CreatePlanDto, UpdatePlanDto, FindAllPlansParams } from '../types';
import {
  findAllPlans,
  findActivePlans,
  createPlan as createPlanService,
  updatePlan as updatePlanService,
  deletePlan as deletePlanService,
  togglePlanActive as togglePlanActiveService,
  type PaginatedPlans,
} from '../services/plan';

interface PlanState {
  plans: Plan[];
  activePlans: Plan[];
  selectedPlan: Plan | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  limit: number;

  fetchPlans: (params?: FindAllPlansParams) => Promise<void>;
  fetchActivePlans: () => Promise<void>;
  createPlan: (dto: CreatePlanDto) => Promise<Plan>;
  updatePlan: (id: string, dto: UpdatePlanDto) => Promise<Plan>;
  deletePlan: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<Plan>;
  setSelectedPlan: (plan: Plan | null) => void;
  clearError: () => void;
}

export const usePlanStore = create<PlanState>((set) => ({
  plans: [],
  activePlans: [],
  selectedPlan: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 10,

  fetchPlans: async (params?: FindAllPlansParams) => {
    set({ loading: true, error: null });
    try {
      const result: PaginatedPlans = await findAllPlans(params);
      set({
        plans: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar planes';
      set({ error: message, loading: false });
    }
  },

  fetchActivePlans: async () => {
    set({ loading: true, error: null });
    try {
      const plans = await findActivePlans();
      set({ activePlans: plans, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar planes activos';
      set({ error: message, loading: false });
    }
  },

  createPlan: async (dto: CreatePlanDto) => {
    set({ loading: true, error: null });
    try {
      const plan = await createPlanService(dto);
      set((state) => ({
        plans: [plan, ...state.plans],
        total: state.total + 1,
        loading: false,
      }));
      return plan;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear plan';
      set({ error: message, loading: false });
      throw err;
    }
  },

  updatePlan: async (id: string, dto: UpdatePlanDto) => {
    set({ loading: true, error: null });
    try {
      const plan = await updatePlanService(id, dto);
      set((state) => ({
        plans: state.plans.map((p) => (p.id === id ? plan : p)),
        selectedPlan: state.selectedPlan?.id === id ? plan : state.selectedPlan,
        loading: false,
      }));
      return plan;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar plan';
      set({ error: message, loading: false });
      throw err;
    }
  },

  deletePlan: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deletePlanService(id);
      set((state) => ({
        plans: state.plans.filter((p) => p.id !== id),
        selectedPlan: state.selectedPlan?.id === id ? null : state.selectedPlan,
        total: state.total - 1,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar plan';
      set({ error: message, loading: false });
      throw err;
    }
  },

  toggleActive: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const plan = await togglePlanActiveService(id);
      set((state) => ({
        plans: state.plans.map((p) => (p.id === id ? plan : p)),
        selectedPlan: state.selectedPlan?.id === id ? plan : state.selectedPlan,
        loading: false,
      }));
      return plan;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cambiar estado del plan';
      set({ error: message, loading: false });
      throw err;
    }
  },

  setSelectedPlan: (plan) => set({ selectedPlan: plan }),

  clearError: () => set({ error: null }),
}));
