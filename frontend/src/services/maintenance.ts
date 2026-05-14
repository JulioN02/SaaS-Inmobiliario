/* =============================================================================
   SaaS Inmobiliario — Maintenance Service
   ============================================================================= */

import { api } from './api';
import type {
  MaintenanceRequest,
  CreateMaintenanceDto,
  UpdateMaintenanceDto,
  FindAllMaintenanceParams,
  PaginatedMaintenances,
} from '../types/maintenance';

export async function findAllMaintenances(
  params?: FindAllMaintenanceParams,
): Promise<PaginatedMaintenances> {
  const response = await api.get<PaginatedMaintenances>('/maintenance', { params });
  return response.data;
}

export async function findMaintenanceById(id: string): Promise<MaintenanceRequest> {
  const response = await api.get<MaintenanceRequest>(`/maintenance/${id}`);
  return response.data;
}

export async function createMaintenance(dto: CreateMaintenanceDto): Promise<MaintenanceRequest> {
  const response = await api.post<MaintenanceRequest>('/maintenance', dto);
  return response.data;
}

export async function updateMaintenance(
  id: string,
  dto: UpdateMaintenanceDto,
): Promise<MaintenanceRequest> {
  const response = await api.patch<MaintenanceRequest>(`/maintenance/${id}`, dto);
  return response.data;
}