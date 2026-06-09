/* =============================================================================
   SaaS Inmobiliario — Billing Store Tests
   ============================================================================= */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBillingStore } from './billingStore';
import type { BillingMetrics, TenantBillingStatus } from '../types';

vi.mock('../services/billing', () => ({
  fetchBillingMetrics: vi.fn().mockResolvedValue({
    activeSubscriptions: 5,
    pastDue: 1,
    mrr: 25000000,
    collectionRate: 85.5,
    totalCollectedYtd: 150000000,
    pendingInvoices: 3,
    totalTenants: 10,
  }),
  fetchTenantBillingStatuses: vi.fn().mockResolvedValue({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
  }),
}));

describe('billingStore', () => {
  beforeEach(() => {
    useBillingStore.setState({
      metrics: null,
      tenants: [],
      total: 0,
      page: 1,
      totalPages: 1,
      limit: 10,
      loading: false,
      error: null,
    });
  });

  // ── Initial State ───────────────────────────────────────────────────────

  it('should have initial state', () => {
    const state = useBillingStore.getState();
    expect(state.metrics).toBeNull();
    expect(state.tenants).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.total).toBe(0);
    expect(state.page).toBe(1);
    expect(state.totalPages).toBe(1);
    expect(state.limit).toBe(10);
  });

  // ── fetchMetrics ────────────────────────────────────────────────────────

  it('should fetch metrics and update state on success', async () => {
    const store = useBillingStore.getState();
    expect(store.loading).toBe(false);

    const fetchPromise = store.fetchMetrics();

    // Check loading is true during fetch
    expect(useBillingStore.getState().loading).toBe(true);

    await fetchPromise;

    const state = useBillingStore.getState();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.metrics).not.toBeNull();
    expect(state.metrics?.activeSubscriptions).toBe(5);
    expect(state.metrics?.pastDue).toBe(1);
    expect(state.metrics?.mrr).toBe(25000000);
    expect(state.metrics?.collectionRate).toBe(85.5);
    expect(state.metrics?.totalCollectedYtd).toBe(150000000);
    expect(state.metrics?.pendingInvoices).toBe(3);
    expect(state.metrics?.totalTenants).toBe(10);
  });

  it('should handle errors in fetchMetrics', async () => {
    const { fetchBillingMetrics } = await import('../services/billing');
    vi.mocked(fetchBillingMetrics).mockRejectedValueOnce(new Error('Error al cargar métricas'));

    await useBillingStore.getState().fetchMetrics();

    const state = useBillingStore.getState();
    expect(state.error).toBe('Error al cargar métricas');
    expect(state.loading).toBe(false);
    expect(state.metrics).toBeNull();
  });

  // ── fetchTenants ────────────────────────────────────────────────────────

  it('should fetch tenants and update state with pagination', async () => {
    const mockTenants: TenantBillingStatus[] = [
      {
        tenantId: 't1',
        tenantName: 'Tenant 1',
        subdomain: 'tenant1',
        planName: 'Premium',
        planSlug: 'premium',
        subscriptionStatus: 'ACTIVE',
        nextBillingDate: '2026-07-01',
        lastInvoiceDate: '2026-06-01',
        lastInvoiceAmount: 299000,
        lastInvoiceStatus: 'PAID',
        outstandingAmount: 0,
        gracePeriodDays: 5,
      },
    ];

    const { fetchTenantBillingStatuses } = await import('../services/billing');
    vi.mocked(fetchTenantBillingStatuses).mockResolvedValueOnce({
      data: mockTenants,
      total: 1,
      page: 1,
      totalPages: 1,
    });

    const store = useBillingStore.getState();
    expect(store.loading).toBe(false);

    const fetchPromise = store.fetchTenants({ page: 1, limit: 10 });

    // Check loading is true during fetch
    expect(useBillingStore.getState().loading).toBe(true);

    await fetchPromise;

    const state = useBillingStore.getState();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.tenants).toHaveLength(1);
    expect(state.tenants[0]?.tenantName).toBe('Tenant 1');
    expect(state.tenants[0]?.subscriptionStatus).toBe('ACTIVE');
    expect(state.total).toBe(1);
    expect(state.page).toBe(1);
    expect(state.totalPages).toBe(1);
  });

  it('should handle errors in fetchTenants', async () => {
    const { fetchTenantBillingStatuses } = await import('../services/billing');
    vi.mocked(fetchTenantBillingStatuses).mockRejectedValueOnce(new Error('Error al cargar tenants'));

    await useBillingStore.getState().fetchTenants({ page: 1, limit: 10 });

    const state = useBillingStore.getState();
    expect(state.error).toBe('Error al cargar tenants');
    expect(state.loading).toBe(false);
    expect(state.tenants).toEqual([]);
  });

  it('should call fetchTenants with default params when none provided', async () => {
    const { fetchTenantBillingStatuses } = await import('../services/billing');
    vi.mocked(fetchTenantBillingStatuses).mockResolvedValueOnce({
      data: [],
      total: 0,
      page: 1,
      totalPages: 1,
    });

    await useBillingStore.getState().fetchTenants();

    expect(fetchTenantBillingStatuses).toHaveBeenCalledWith(undefined);
  });

  // ── clearError ──────────────────────────────────────────────────────────

  it('should clear error', () => {
    useBillingStore.setState({ error: 'Some error' });

    useBillingStore.getState().clearError();

    expect(useBillingStore.getState().error).toBeNull();
  });
});
