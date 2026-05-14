/* =============================================================================
   SaaS Inmobiliario — Announcement Store Tests
   ============================================================================= */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAnnouncementStore } from './announcementStore';
import type { Announcement } from '../types/announcement';

vi.mock('../services/announcement', () => ({
  getAnnouncements: vi.fn().mockResolvedValue({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 20,
  }),
  getAnnouncement: vi.fn(),
  createAnnouncement: vi.fn().mockResolvedValue({
    id: '1',
    title: 'Test Announcement',
    content: 'Test content',
    targetRoles: ['RESIDENT'],
    isActive: true,
    
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  }),
  updateAnnouncement: vi.fn().mockResolvedValue({
    id: '1',
    title: 'Updated Announcement',
    content: 'Updated content',
    targetRoles: ['RESIDENT', 'ADMIN'],
    isActive: true,
    
    createdAt: '2026-05-01T10:00:00Z',
    updatedAt: '2026-05-01T12:00:00Z',
  }),
  deleteAnnouncement: vi.fn().mockResolvedValue(undefined),
}));

describe('announcementStore', () => {
  beforeEach(() => {
    useAnnouncementStore.setState({
      announcements: [],
      selectedAnnouncement: null,
      loading: false,
      error: null,
      total: 0,
      page: 1,
      totalPages: 1,
      limit: 20,
    });
  });

  it('should have initial state', () => {
    const state = useAnnouncementStore.getState();
    expect(state.announcements).toEqual([]);
    expect(state.selectedAnnouncement).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.total).toBe(0);
  });

  it('should fetch announcements and set loading state', async () => {
    const store = useAnnouncementStore.getState();
    expect(store.loading).toBe(false);

    const fetchPromise = store.fetchAnnouncements();
    
    // Check loading is true during fetch
    expect(useAnnouncementStore.getState().loading).toBe(true);
    
    await fetchPromise;
    
    // Check loading is false after fetch
    expect(useAnnouncementStore.getState().loading).toBe(false);
    expect(useAnnouncementStore.getState().announcements).toEqual([]);
    expect(useAnnouncementStore.getState().total).toBe(0);
  });

  it('should create an announcement', async () => {
    const store = useAnnouncementStore.getState();
    const newAnnouncement = {
      title: 'Test Announcement',
      content: 'Test content',
      targetRoles: ['RESIDENT'],
    };

    const result = await store.createAnnouncement(newAnnouncement);
    
    expect(useAnnouncementStore.getState().loading).toBe(false);
    expect(useAnnouncementStore.getState().announcements).toHaveLength(1);
    expect(useAnnouncementStore.getState().announcements[0]?.title).toBe('Test Announcement');
    expect(result.title).toBe('Test Announcement');
  });

  it('should update an announcement', async () => {
    // First add an announcement to the state
    useAnnouncementStore.setState({
      announcements: [{
        id: '1',
        tenantId: 'tenant-1',
        title: 'Test Announcement',
        content: 'Test content',
        priority: 'NORMAL',
        targetRoles: ['RESIDENT'],
        targetUnits: [],
        isActive: true,
        createdBy: 'user-1',
        createdAt: '2026-05-01T10:00:00Z',
        updatedAt: '2026-05-01T10:00:00Z',
      }],
    });

    const store = useAnnouncementStore.getState();
    const result = await store.updateAnnouncement('1', {
      title: 'Updated Announcement',
      content: 'Updated content',
      targetRoles: ['RESIDENT', 'ADMIN'],
    });

    expect(useAnnouncementStore.getState().loading).toBe(false);
    expect(useAnnouncementStore.getState().announcements[0]?.title).toBe('Updated Announcement');
    expect(useAnnouncementStore.getState().announcements[0]?.content).toBe('Updated content');
    expect(useAnnouncementStore.getState().announcements[0]?.targetRoles).toEqual(['RESIDENT', 'ADMIN']);
    expect(result.title).toBe('Updated Announcement');
  });

  it('should delete an announcement', async () => {
    // First add an announcement to the state
    useAnnouncementStore.setState({
      announcements: [{
        id: '1',
        tenantId: 'tenant-1',
        title: 'Test Announcement',
        content: 'Test content',
        priority: 'NORMAL',
        targetRoles: ['RESIDENT'],
        targetUnits: [],
        isActive: true,
        createdBy: 'user-1',
        createdAt: '2026-05-01T10:00:00Z',
        updatedAt: '2026-05-01T10:00:00Z',
}],
      total: 1,
    });

    const store = useAnnouncementStore.getState();
    await store.deleteAnnouncement('1');

    expect(useAnnouncementStore.getState().loading).toBe(false);
    expect(useAnnouncementStore.getState().announcements).toHaveLength(0);
    expect(useAnnouncementStore.getState().total).toBe(0);
  });

  it('should handle errors in fetchAnnouncements', async () => {
    const { getAnnouncements } = await import('../services/announcement');
    vi.mocked(getAnnouncements).mockRejectedValueOnce(new Error('Network error'));

    const store = useAnnouncementStore.getState();
    await store.fetchAnnouncements();

    expect(useAnnouncementStore.getState().error).toBe('Network error');
    expect(useAnnouncementStore.getState().loading).toBe(false);
  });

  it('should handle errors in createAnnouncement', async () => {
    const { createAnnouncement } = await import('../services/announcement');
    vi.mocked(createAnnouncement).mockRejectedValueOnce(new Error('Failed to create'));

    const store = useAnnouncementStore.getState();
    
    await expect(store.createAnnouncement({
      title: 'Test',
      content: 'Test content',
      targetRoles: ['RESIDENT'],
    })).rejects.toThrow();

    expect(useAnnouncementStore.getState().error).toBe('Failed to create');
  });

  it('should handle errors in deleteAnnouncement', async () => {
    const { deleteAnnouncement } = await import('../services/announcement');
    vi.mocked(deleteAnnouncement).mockRejectedValueOnce(new Error('Failed to delete'));

    // First add an announcement to the state
    useAnnouncementStore.setState({
      announcements: [{
        id: '1',
        tenantId: 'tenant-1',
        title: 'Test Announcement',
        content: 'Test content',
        priority: 'NORMAL',
        targetRoles: ['RESIDENT'],
        targetUnits: [],
        isActive: true,
        createdBy: 'user-1',
        createdAt: '2026-05-01T10:00:00Z',
        updatedAt: '2026-05-01T10:00:00Z',
      }],
    });

    const store = useAnnouncementStore.getState();
    
    await expect(store.deleteAnnouncement('1')).rejects.toThrow();

    expect(useAnnouncementStore.getState().error).toBe('Failed to delete');
  });

  it('should set selectedAnnouncement', () => {
    const announcement: Announcement = {
      id: '1',
      tenantId: 'tenant-1',
      title: 'Test Announcement',
      content: 'Test content',
      priority: 'NORMAL',
      targetRoles: ['RESIDENT'],
      targetUnits: [],
      isActive: true,
      createdBy: 'user-1',
      createdAt: '2026-05-01T10:00:00Z',
      updatedAt: '2026-05-01T10:00:00Z',
    };

    const store = useAnnouncementStore.getState();
    store.setSelectedAnnouncement(announcement);

    expect(useAnnouncementStore.getState().selectedAnnouncement).toEqual(announcement);
  });

  it('should clear error', () => {
    useAnnouncementStore.setState({ error: 'Some error' });
    
    const store = useAnnouncementStore.getState();
    store.clearError();

    expect(useAnnouncementStore.getState().error).toBeNull();
  });
});