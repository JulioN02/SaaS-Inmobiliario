/* =============================================================================
   SaaS Inmobiliario — Fee Store Tests
   ============================================================================= */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFeeStore } from './feeStore';
import type { Fee } from '../types/fee';

vi.mock('../services/fee', () => ({
  getFees: vi.fn().mockResolvedValue({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 20,
  }),
  getFee: vi.fn(),
  createFee: vi.fn().mockResolvedValue({
    id: '1',
    unitId: 'unit-1',
    amount: 500000,
    period: '2026-05',
    status: 'PENDING',
    dueDate: '2026-05-31',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  }),
  updateFee: vi.fn(),
  updateFeeStatus: vi.fn().mockImplementation((_id: string, dto: { status: string }) => {
    if (dto.status === 'PARTIAL') {
      return Promise.resolve({
        id: '1',
        unitId: 'unit-1',
        amount: 500000,
        period: '2026-05',
        status: 'PARTIAL',
        dueDate: '2026-05-31',
        paidAmount: 250000,
        createdAt: '2026-05-01T10:00:00Z',
        updatedAt: '2026-05-15T10:00:00Z',
      });
    }
    return Promise.resolve({
      id: '1',
      unitId: 'unit-1',
      amount: 500000,
      period: '2026-05',
      status: 'PAID',
      dueDate: '2026-05-31',
      paidAt: '2026-05-15T10:00:00Z',
      createdAt: '2026-05-01T10:00:00Z',
      updatedAt: '2026-05-15T10:00:00Z',
    });
  }),
}));

describe('feeStore', () => {
  beforeEach(() => {
    useFeeStore.setState({
      fees: [],
      selectedFee: null,
      loading: false,
      error: null,
      total: 0,
      page: 1,
      totalPages: 1,
      limit: 20,
    });
  });

  it('should have initial state', () => {
    const state = useFeeStore.getState();
    expect(state.fees).toEqual([]);
    expect(state.selectedFee).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.total).toBe(0);
  });

  it('should fetch fees and set loading state', async () => {
    const store = useFeeStore.getState();
    expect(store.loading).toBe(false);

    const fetchPromise = store.fetchFees();
    
    // Check loading is true during fetch
    expect(useFeeStore.getState().loading).toBe(true);
    
    await fetchPromise;
    
    // Check loading is false after fetch
    expect(useFeeStore.getState().loading).toBe(false);
    expect(useFeeStore.getState().fees).toEqual([]);
    expect(useFeeStore.getState().total).toBe(0);
  });

  it('should create a fee', async () => {
    const store = useFeeStore.getState();
    const newFee = {
      unitId: 'unit-1',
      amount: 500000,
      period: '2026-05',
      dueDate: '2026-05-31',
      feeType: 'PERIODIC',
    };

    const result = await store.createFee(newFee as any);
    
    expect(useFeeStore.getState().loading).toBe(false);
    expect(useFeeStore.getState().fees).toHaveLength(1);
    expect(useFeeStore.getState().fees[0]?.amount).toBe(500000);
    expect(useFeeStore.getState().fees[0]?.status).toBe('PENDING');
    expect(result.amount).toBe(500000);
  });

  it('should update fee status from PENDING to PAID', async () => {
    // First add a fee to the state
    useFeeStore.setState({
      fees: [{
        id: '1',
        tenantId: 'tenant-1',
        unitId: 'unit-1',
        amount: 500000,
        period: '2026-05',
        status: 'PENDING',
        feeType: 'PERIODIC',
        dueDate: '2026-05-31',
        createdBy: 'user-1',
        createdAt: '2026-05-01T10:00:00Z',
        updatedAt: '2026-05-01T10:00:00Z',
      }],
    });

    const store = useFeeStore.getState();
    const result = await store.updateFeeStatus('1', {
      status: 'PAID',
    });

    expect(useFeeStore.getState().loading).toBe(false);
    expect(useFeeStore.getState().fees[0]?.status).toBe('PAID');
    expect(result.status).toBe('PAID');
  });

  it('should update fee status to PARTIAL', async () => {
    // First add a fee to the state
    useFeeStore.setState({
      fees: [{
        id: '1',
        tenantId: 'tenant-1',
        unitId: 'unit-1',
        amount: 500000,
        period: '2026-05',
        status: 'PENDING',
        feeType: 'PERIODIC',
        dueDate: '2026-05-31',
        createdBy: 'user-1',
        createdAt: '2026-05-01T10:00:00Z',
        updatedAt: '2026-05-01T10:00:00Z',
      }],
    });

    const store = useFeeStore.getState();
    const result = await store.updateFeeStatus('1', {
      status: 'PARTIAL',
      paidAmount: 250000,
    });

    expect(useFeeStore.getState().loading).toBe(false);
    expect(useFeeStore.getState().fees[0]?.status).toBe('PARTIAL');
    expect(result.status).toBe('PARTIAL');
  });

  it('should handle errors in fetchFees', async () => {
    const { getFees } = await import('../services/fee');
    vi.mocked(getFees).mockRejectedValueOnce(new Error('Network error'));

    const store = useFeeStore.getState();
    await store.fetchFees();

    expect(useFeeStore.getState().error).toBe('Network error');
    expect(useFeeStore.getState().loading).toBe(false);
  });

  it('should handle errors in createFee', async () => {
    const { createFee } = await import('../services/fee');
    vi.mocked(createFee).mockRejectedValueOnce(new Error('Failed to create'));

    const store = useFeeStore.getState();
    
    await expect(store.createFee({
      unitId: 'unit-1',
      amount: 500000,
      period: '2026-05',
      dueDate: '2026-05-31',
      feeType: 'PERIODIC',
    } as any)).rejects.toThrow();

    expect(useFeeStore.getState().error).toBe('Failed to create');
  });

  it('should set selectedFee', () => {
    const fee: Fee = {
      id: '1',
      tenantId: 'tenant-1',
      unitId: 'unit-1',
      amount: 500000,
      period: '2026-05',
      status: 'PENDING',
      feeType: 'PERIODIC',
      dueDate: '2026-05-31',
      createdBy: 'user-1',
      createdAt: '2026-05-01T10:00:00Z',
      updatedAt: '2026-05-01T10:00:00Z',
    };

    const store = useFeeStore.getState();
    store.setSelectedFee(fee);

    expect(useFeeStore.getState().selectedFee).toEqual(fee);
  });

  it('should clear error', () => {
    useFeeStore.setState({ error: 'Some error' });
    
    const store = useFeeStore.getState();
    store.clearError();

    expect(useFeeStore.getState().error).toBeNull();
  });
});