/* =============================================================================
   SaaS Inmobiliario — Metrics Service
   ============================================================================= */

import { api } from './api';

export interface MetricsResponse {
  tenantsActive: number;
  tenantsSuspended: number;
  totalUnits: number;
  totalUsers: number;
  unitsByStatus: Record<string, number>;
  tenantsByPlan: Record<string, number>;
  feesByStatus: Record<string, number>;
  feesDueSoon: number;
  maintenanceOpen: number;
  visitorsToday: number;
}

export async function getPlatformMetrics(): Promise<MetricsResponse> {
  const response = await api.get<MetricsResponse>('/metrics/platform');
  return response.data;
}

export async function getTenantMetrics(tenantId: string): Promise<MetricsResponse> {
  const response = await api.get<MetricsResponse>(`/metrics/tenant/${tenantId}`);
  return response.data;
}