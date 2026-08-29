/* =============================================================================
   SaaS Inmobiliario — Plan Store Tests
   ============================================================================= */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePlanStore } from './planStore';
import type { Plan } from '../types/plan';

vi.mock('../services/plan', () => ({
  findAllPlans: vi.fn().mockResolvedValue({
    data: [],
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  }),
  findActivePlans: vi.fn().mockResolvedValue([]),
  findPlanById: vi.fn(),
  createPlan: vi.fn().mockResolvedValue({
    id: 'plan-1',
    name: 'Plan Básico',
    slug: 'basico',
    limits: { properties: 1, units: 100, users: 5 },
    prices: { monthly: 29900, yearly: 299000 },
    features: ['Soporte email'],
    isActive: true,
    sortOrder: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }),
  updatePlan: vi.fn(),
  deletePlan: vi.fn(),
  togglePlanActive: vi.fn(),
}));

describe('planStore', () => {
  beforeEach(() => {
    usePlanStore.setState({
      plans: [],
      activePlans: [],
      selectedPlan: null,
      loading: false,
      error: null,
      total: 0,
      page: 1,
      totalPages: 1,
      limit: 10,
    });
  });

  it('should have initial state', () => {
    const state = usePlanStore.getState();
    expect(state.plans).toEqual([]);
    expect(state.activePlans).toEqual([]);
    expect(state.selectedPlan).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.total).toBe(0);
  });

  it('should fetch plans and set loading state', async () => {
    const store = usePlanStore.getState();
    expect(store.loading).toBe(false);

    const fetchPromise = store.fetchPlans();

    // Check loading is true during fetch
    expect(usePlanStore.getState().loading).toBe(true);

    await fetchPromise;

    // Check loading is false after fetch
    expect(usePlanStore.getState().loading).toBe(false);
    expect(usePlanStore.getState().plans).toEqual([]);
    expect(usePlanStore.getState().total).toBe(0);
  });

  it('should fetch active plans', async () => {
    const { findActivePlans } = await import('../services/plan');
    vi.mocked(findActivePlans).mockResolvedValueOnce([
      {
        id: 'plan-1',
        name: 'Plan Activo',
        slug: 'activo',
        limits: { properties: 5, units: 200, users: 10 },
        prices: { monthly: 59900, yearly: 599000 },
        features: ['Soporte prioritario'],
        isActive: true,
        sortOrder: 1,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]);

    await usePlanStore.getState().fetchActivePlans();

    const state = usePlanStore.getState();
    expect(state.loading).toBe(false);
    expect(state.activePlans).toHaveLength(1);
    expect(state.activePlans[0]?.name).toBe('Plan Activo');
    expect(state.activePlans[0]?.isActive).toBe(true);
  });

  it('should create a plan', async () => {
    const store = usePlanStore.getState();
    const dto = {
      name: 'Plan Básico',
      slug: 'basico',
      limits: { properties: 1, units: 100, users: 5 },
      prices: { monthly: 29900, yearly: 299000 },
      features: ['Soporte email'],
      isActive: true,
      sortOrder: 1,
    };

    const result = await store.createPlan(dto);

    expect(usePlanStore.getState().loading).toBe(false);
    expect(usePlanStore.getState().plans).toHaveLength(1);
    expect(usePlanStore.getState().plans[0]?.name).toBe('Plan Básico');
    expect(result.name).toBe('Plan Básico');
  });

  it('should toggle plan active status', async () => {
    const { togglePlanActive } = await import('../services/plan');
    vi.mocked(togglePlanActive).mockResolvedValueOnce({
      id: 'plan-1',
      name: 'Plan Básico',
      slug: 'basico',
      limits: { properties: 1, units: 100, users: 5 },
      prices: { monthly: 29900, yearly: 299000 },
      features: [],
      isActive: false,
      sortOrder: 1,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    });

    // Add plan to state
    usePlanStore.setState({
      plans: [
        {
          id: 'plan-1',
          name: 'Plan Básico',
          slug: 'basico',
          limits: { properties: 1, units: 100, users: 5 },
          prices: { monthly: 29900, yearly: 299000 },
          features: [],
          isActive: true,
          sortOrder: 1,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
    });

    const result = await usePlanStore.getState().toggleActive('plan-1');

    expect(usePlanStore.getState().loading).toBe(false);
    expect(usePlanStore.getState().plans[0]?.isActive).toBe(false);
    expect(result.isActive).toBe(false);
  });

  it('should delete a plan', async () => {
    // Add plan to state
    usePlanStore.setState({
      plans: [
        {
          id: 'plan-1',
          name: 'Plan Básico',
          slug: 'basico',
          limits: { properties: 1, units: 100, users: 5 },
          prices: { monthly: 29900, yearly: 299000 },
          features: [],
          isActive: true,
          sortOrder: 1,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
    });

    await usePlanStore.getState().deletePlan('plan-1');

    expect(usePlanStore.getState().loading).toBe(false);
    expect(usePlanStore.getState().plans).toHaveLength(0);
    expect(usePlanStore.getState().total).toBe(0);
  });

  it('should handle errors in fetchPlans', async () => {
    const { findAllPlans } = await import('../services/plan');
    vi.mocked(findAllPlans).mockRejectedValueOnce(new Error('Network error'));

    await usePlanStore.getState().fetchPlans();

    expect(usePlanStore.getState().error).toBe('Network error');
    expect(usePlanStore.getState().loading).toBe(false);
  });

  it('should handle errors in createPlan', async () => {
    const { createPlan } = await import('../services/plan');
    vi.mocked(createPlan).mockRejectedValueOnce(new Error('Failed to create'));

    await expect(usePlanStore.getState().createPlan({
      name: 'Test',
      slug: 'test',
      limits: { properties: 1, units: 10, users: 2 },
      prices: { monthly: 0, yearly: 0 },
    })).rejects.toThrow();

    expect(usePlanStore.getState().error).toBe('Failed to create');
  });

  it('should set selectedPlan', () => {
    const plan: Plan = {
      id: 'plan-1',
      name: 'Plan Premium',
      slug: 'premium',
      limits: { properties: 10, units: 500, users: 15 },
      prices: { monthly: 99900, yearly: 999000 },
      features: ['Todo incluido'],
      isActive: true,
      sortOrder: 2,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    usePlanStore.getState().setSelectedPlan(plan);

    expect(usePlanStore.getState().selectedPlan).toEqual(plan);
  });

  it('should clear error', () => {
    usePlanStore.setState({ error: 'Some error' });

    usePlanStore.getState().clearError();

    expect(usePlanStore.getState().error).toBeNull();
  });
});
