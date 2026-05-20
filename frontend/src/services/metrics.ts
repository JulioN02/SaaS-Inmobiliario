/* =============================================================================
   SaaS Inmobiliario — Metrics Service
   ============================================================================= */

import { api } from './api';
import type { Metrics } from '../types';

export async function getPlatformMetrics(): Promise<Metrics> {
  const response = await api.get<Metrics>('/metrics/platform');
  return response.data;
}

export async function getTenantMetrics(tenantId: string): Promise<Metrics> {
  const response = await api.get<Metrics>(`/metrics/tenant/${tenantId}`);
  return response.data;
}
