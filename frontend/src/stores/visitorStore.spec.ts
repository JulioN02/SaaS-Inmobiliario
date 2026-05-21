/* =============================================================================
   SaaS Inmobiliario — Visitor Store Tests
   ============================================================================= */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useVisitorStore } from './visitorStore';
import type { Visitor } from '../types/visitor';

vi.mock('../services/visitor', () => ({
  findAllVisitors: vi.fn().mockResolvedValue({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 20,
  }),
  findVisitorById: vi.fn(),
  createVisitor: vi.fn().mockResolvedValue({
    id: '1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    visitorName: 'Test Visitor',
    documentNumber: '123456',
    entryDate: '2026-05-01T10:00:00Z',
    registeredBy: 'user-1',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  }),
  checkoutVisitor: vi.fn().mockResolvedValue({
    id: '1',
    tenantId: 'tenant-1',
    unitId: 'unit-1',
    visitorName: 'Test Visitor',
    documentNumber: '123456',
    entryDate: '2026-05-01T10:00:00Z',
    exitDate: '2026-05-01T12:00:00Z',
    registeredBy: 'user-1',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  }),
}));

describe('visitorStore', () => {
  beforeEach(() => {
    useVisitorStore.setState({
      visitors: [],
      selectedVisitor: null,
      loading: false,
      error: null,
      total: 0,
      page: 1,
      totalPages: 1,
      limit: 20,
    });
  });

  it('should have initial state', () => {
    const state = useVisitorStore.getState();
    expect(state.visitors).toEqual([]);
    expect(state.selectedVisitor).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.total).toBe(0);
  });

  it('should fetch visitors and set loading state', async () => {
    const store = useVisitorStore.getState();
    expect(store.loading).toBe(false);

    const fetchPromise = store.fetchVisitors();
    
    // Check loading is true during fetch
    expect(useVisitorStore.getState().loading).toBe(true);
    
    await fetchPromise;
    
    // Check loading is false after fetch
    expect(useVisitorStore.getState().loading).toBe(false);
    expect(useVisitorStore.getState().visitors).toEqual([]);
    expect(useVisitorStore.getState().total).toBe(0);
  });

  it('should register a visitor', async () => {
    const store = useVisitorStore.getState();
    const newVisitor = {
      name: 'Test Visitor',
      document: '123456',
      unitId: 'unit-1',
      entryDate: '2026-05-01T10:00:00Z',
      observations: 'Test observation',
    };

    const result = await store.registerVisitor(newVisitor as any);
    
    expect(useVisitorStore.getState().loading).toBe(false);
    expect(useVisitorStore.getState().visitors).toHaveLength(1);
    expect(useVisitorStore.getState().visitors[0]?.visitorName).toBe('Test Visitor');
    expect(result?.visitorName).toBe('Test Visitor');
  });

  it('should checkout a visitor', async () => {
    // First add a visitor to the state
    useVisitorStore.setState({
      visitors: [{
        id: '1',
        tenantId: 'tenant-1',
        unitId: 'unit-1',
        visitorName: 'Test Visitor',
        entryDate: '2026-05-01T10:00:00Z',
        registeredBy: 'user-1',
        createdAt: '2026-05-01T10:00:00Z',
        updatedAt: '2026-05-01T10:00:00Z',
      } as any],
    });

    const store = useVisitorStore.getState();
    const result = await store.checkoutVisitor('1', {
      exitDate: '2026-05-01T12:00:00Z',
    });

    expect(useVisitorStore.getState().loading).toBe(false);
    expect(useVisitorStore.getState().visitors[0]?.exitDate).toBe('2026-05-01T12:00:00Z');
    expect(result.exitDate).toBe('2026-05-01T12:00:00Z');
  });

  it('should handle errors in fetchVisitors', async () => {
    const { findAllVisitors } = await import('../services/visitor');
    vi.mocked(findAllVisitors).mockRejectedValueOnce(new Error('Network error'));

    const store = useVisitorStore.getState();
    await store.fetchVisitors();

    expect(useVisitorStore.getState().error).toBe('Network error');
    expect(useVisitorStore.getState().loading).toBe(false);
  });

  it('should handle errors in registerVisitor', async () => {
    const { createVisitor } = await import('../services/visitor');
    vi.mocked(createVisitor).mockRejectedValueOnce(new Error('Failed to register'));

    const store = useVisitorStore.getState();
    
    await expect(store.registerVisitor({
      unitId: 'unit-1',
      visitorName: 'Test',
      entryDate: '2026-05-01T10:00:00Z',
    } as any)).rejects.toThrow();

    expect(useVisitorStore.getState().error).toBe('Failed to register');
  });

  it('should set selectedVisitor', () => {
    const visitor: Visitor = {
      id: '1',
      tenantId: 'tenant-1',
      unitId: 'unit-1',
      visitorName: 'Test Visitor',
      entryDate: '2026-05-01T10:00:00Z',
      registeredBy: 'user-1',
      createdAt: '2026-05-01T10:00:00Z',
      updatedAt: '2026-05-01T10:00:00Z',
    };

    const store = useVisitorStore.getState();
    store.setSelectedVisitor(visitor);

    expect(useVisitorStore.getState().selectedVisitor).toEqual(visitor);
  });

  it('should clear error', () => {
    useVisitorStore.setState({ error: 'Some error' });
    
    const store = useVisitorStore.getState();
    store.clearError();

    expect(useVisitorStore.getState().error).toBeNull();
  });
});