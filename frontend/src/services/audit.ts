/* =============================================================================
   SaaS Inmobiliario — Audit Service
   ============================================================================= */

import { api } from './api';
import type { AuditLog, FindAllAuditParams, PaginatedAuditLogs } from '../types';

export interface AuditResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function findAllAuditLogs(
  params?: FindAllAuditParams,
): Promise<PaginatedAuditLogs> {
  const response = await api.get<AuditResponse>('/audit', { params });
  return response.data;
}

export async function findAuditLogById(id: string): Promise<AuditLog> {
  const response = await api.get<AuditLog>(`/audit/${id}`);
  return response.data;
}