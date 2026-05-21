/* =============================================================================
   SaaS Inmobiliario — Audit Store (Zustand)
   ============================================================================= */

import { create } from 'zustand';
import type { AuditLog, FindAllAuditParams, PaginatedAuditLogs } from '../types';
import { findAllAuditLogs, findAuditLogById } from '../services/audit';

interface AuditState {
  logs: AuditLog[];
  selectedLog: AuditLog | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  limit: number;

  fetchAuditLogs: (params?: FindAllAuditParams) => Promise<void>;
  fetchAuditLogById: (id: string) => Promise<void>;
  setSelectedLog: (log: AuditLog | null) => void;
  clearError: () => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  logs: [],
  selectedLog: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 20,

  fetchAuditLogs: async (params?: FindAllAuditParams) => {
    set({ loading: true, error: null });
    try {
      const result: PaginatedAuditLogs = await findAllAuditLogs(params);
      set({
        logs: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar auditoría';
      set({ error: message, loading: false });
    }
  },

  fetchAuditLogById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const log = await findAuditLogById(id);
      set({ selectedLog: log, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar log';
      set({ error: message, loading: false });
    }
  },

  setSelectedLog: (log) => set({ selectedLog: log }),

  clearError: () => set({ error: null }),
}));