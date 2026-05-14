/* =============================================================================
   SaaS Inmobiliario — Tenant Service
   ============================================================================= */

import { api } from './api';
import type { Tenant, TenantPlan, TenantStatus } from '../types';

export interface FindAllTenantsParams {
  page?: number;
  limit?: number;
  status?: TenantStatus;
  plan?: TenantPlan;
}

export interface PaginatedTenants {
  data: Tenant[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTenantDto {
  name: string;
  subdomain: string;
  plan: TenantPlan;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UpdateTenantDto {
  name?: string;
  subdomain?: string;
  plan?: TenantPlan;
  contactEmail?: string;
  contactPhone?: string;
}

export async function findAllTenants(
  params?: FindAllTenantsParams,
): Promise<PaginatedTenants> {
  const response = await api.get<PaginatedTenants>('/tenants', { params });
  return response.data;
}

export async function findTenantById(id: string): Promise<Tenant> {
  const response = await api.get<Tenant>(`/tenants/${id}`);
  return response.data;
}

export async function createTenant(dto: CreateTenantDto): Promise<Tenant> {
  const response = await api.post<Tenant>('/tenants', dto);
  return response.data;
}

export async function updateTenant(id: string, dto: UpdateTenantDto): Promise<Tenant> {
  const response = await api.patch<Tenant>(`/tenants/${id}`, dto);
  return response.data;
}

export async function suspendTenant(id: string): Promise<Tenant> {
  const response = await api.patch<Tenant>(`/tenants/${id}/suspend`);
  return response.data;
}

export async function activateTenant(id: string): Promise<Tenant> {
  const response = await api.patch<Tenant>(`/tenants/${id}/activate`);
  return response.data;
}

export async function changeTenantPlan(id: string, plan: TenantPlan): Promise<Tenant> {
  const response = await api.patch<Tenant>(`/tenants/${id}/plan`, { plan });
  return response.data;
}

export async function deleteTenant(id: string): Promise<Tenant> {
  const response = await api.delete<Tenant>(`/tenants/${id}`);
  return response.data;
}