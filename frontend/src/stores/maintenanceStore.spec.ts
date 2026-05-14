/* =============================================================================
   SaaS Inmobiliario — Maintenance Store Tests
   ============================================================================= */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMaintenanceStore } from './maintenanceStore';
import type { MaintenanceRequest } from '../types/maintenance';

vi.mock('../services/maintenance', () => ({
  findAllMaintenances: vi.fn().mockResolvedValue({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 20,
  }),
  findMaintenanceById: vi.fn(),
  createMaintenance: vi.fn().mockResolvedValue({
    id: '1',
    unitId: 'unit-1',
    title: 'Test Maintenance',
    description: 'Test description',
    status: 'PENDING',
    priority: 'MEDIUM',
    assignedTo: null,
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  }),
  updateMaintenance: vi.fn().mockResolvedValue({
    id: '1',
    unitId: 'unit-1',
    title: 'Test Maintenance',
    description: 'Test description',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignedTo: 'user-1',
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T12:00:00Z',
  }),
}));

describe('maintenanceStore', () => {
  beforeEach(() => {
    useMaintenanceStore.setState({
      requests: [],
      selectedRequest: null,
      loading: false,
      error: null,
      total: 0,
      page: 1,
      totalPages: 1,
      limit: 20,
    });
  });

  it('should have initial state', () => {
    const state = useMaintenanceStore.getState();
    expect(state.requests).toEqual([]);
    expect(state.selectedRequest).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.total).toBe(0);
  });

  it('should fetch maintenances and set loading state', async () => {
    const store = useMaintenanceStore.getState();
    expect(store.loading).toBe(false);

    const fetchPromise = store.fetchMaintenances();
    
    // Check loading is true during fetch
    expect(useMaintenanceStore.getState().loading).toBe(true);
    
    await fetchPromise;
    
    // Check loading is false after fetch
    expect(useMaintenanceStore.getState().loading).toBe(false);
    expect(useMaintenanceStore.getState().requests).toEqual([]);
    expect(useMaintenanceStore.getState().total).toBe(0);
  });

  it('should create a maintenance request', async () => {
    const store = useMaintenanceStore.getState();
    const newRequest = {
      unitId: 'unit-1',
      title: 'Test Maintenance',
      description: 'Test description',
      priority: 'MEDIUM',
    };

    const result = await store.createMaintenance(newRequest);
    
    expect(useMaintenanceStore.getState().loading).toBe(false);
    expect(useMaintenanceStore.getState().requests).toHaveLength(1);
    expect(useMaintenanceStore.getState().requests[0]?.title).toBe('Test Maintenance');
    expect(result.title).toBe('Test Maintenance');
  });

  it('should update a maintenance request', async () => {
    // First add a request to the state
    useMaintenanceStore.setState({
      requests: [{
        id: '1',
        unitId: 'unit-1',
        title: 'Test Maintenance',
        description: 'Test description',
        status: 'PENDING',
        createdAt: '2026-05-01T10:00:00Z',
        updatedAt: '2026-05-01T10:00:00Z',
      } as any],
    });

    const store = useMaintenanceStore.getState();
    const result = await store.updateMaintenance('1', {
      status: 'IN_PROGRESS',
      assignedTo: 'user-1',
    } as any);

    expect(useMaintenanceStore.getState().loading).toBe(false);
    expect(useMaintenanceStore.getState().requests[0]?.status).toBe('IN_PROGRESS');
    expect(useMaintenanceStore.getState().requests[0]?.assignedTo).toBe('user-1');
    expect(result.status).toBe('IN_PROGRESS');
  });

  it('should handle errors in fetchMaintenances', async () => {
    const { findAllMaintenances } = await import('../services/maintenance');
    vi.mocked(findAllMaintenances).mockRejectedValueOnce(new Error('Network error'));

    const store = useMaintenanceStore.getState();
    await store.fetchMaintenances();

    expect(useMaintenanceStore.getState().error).toBe('Network error');
    expect(useMaintenanceStore.getState().loading).toBe(false);
  });

  it('should handle errors in createMaintenance', async () => {
    const { createMaintenance } = await import('../services/maintenance');
    vi.mocked(createMaintenance).mockRejectedValueOnce(new Error('Failed to create'));

    const store = useMaintenanceStore.getState();
    
    await expect(store.createMaintenance({
      unitId: 'unit-1',
      title: 'Test',
      description: 'Test',
    } as any)).rejects.toThrow();

    expect(useMaintenanceStore.getState().error).toBe('Failed to create');
  });

  it('should set selectedRequest', () => {
    const request: MaintenanceRequest = {
      id: '1',
      unitId: 'unit-1',
      title: 'Test Maintenance',
      description: 'Test description',
      status: 'PENDING',
      createdAt: '2026-05-01T10:00:00Z',
      updatedAt: '2026-05-01T10:00:00Z',
    } as any;

    const store = useMaintenanceStore.getState();
    store.setSelectedRequest(request);

    expect(useMaintenanceStore.getState().selectedRequest).toEqual(request);
  });

  it('should clear error', () => {
    useMaintenanceStore.setState({ error: 'Some error' });
    
    const store = useMaintenanceStore.getState();
    store.clearError();

    expect(useMaintenanceStore.getState().error).toBeNull();
  });
});