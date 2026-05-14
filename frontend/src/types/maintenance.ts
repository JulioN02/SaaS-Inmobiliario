/* =============================================================================
   SaaS Inmobiliario — Maintenance Types
   ============================================================================= */

import type { MaintenanceStatus as StatusEnum } from '../types/index';

export type MaintenanceStatus = StatusEnum;

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  unitId: string;
  title: string;
  description?: string;
  status: MaintenanceStatus;
  assignedTo?: string;
  assignedToName?: string;
  resolvedAt?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  unitNumber?: string;
  towerName?: string;
}

export interface CreateMaintenanceDto {
  unitId: string;
  title: string;
  description?: string;
}

export interface UpdateMaintenanceDto {
  status?: MaintenanceStatus;
  assignedTo?: string;
}

export interface FindAllMaintenanceParams {
  unitId?: string;
  status?: MaintenanceStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedMaintenances {
  data: MaintenanceRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}