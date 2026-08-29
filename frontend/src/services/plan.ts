/* =============================================================================
   SaaS Inmobiliario — Plan Service
   ============================================================================= */

import { api } from './api';
import type { Plan, CreatePlanDto, UpdatePlanDto, FindAllPlansParams, PaginatedPlans } from '../types';

export async function findAllPlans(params?: FindAllPlansParams): Promise<PaginatedPlans> {
  const response = await api.get<PaginatedPlans>('/plans', { params });
  return response.data;
}

export async function findActivePlans(): Promise<Plan[]> {
  const response = await api.get<Plan[]>('/plans/active');
  return response.data;
}

export async function findPlanById(id: string): Promise<Plan> {
  const response = await api.get<Plan>(`/plans/${id}`);
  return response.data;
}

export async function createPlan(dto: CreatePlanDto): Promise<Plan> {
  const response = await api.post<Plan>('/plans', dto);
  return response.data;
}

export async function updatePlan(id: string, dto: UpdatePlanDto): Promise<Plan> {
  const response = await api.patch<Plan>(`/plans/${id}`, dto);
  return response.data;
}

export async function deletePlan(id: string): Promise<Plan> {
  const response = await api.delete<Plan>(`/plans/${id}`);
  return response.data;
}

export async function togglePlanActive(id: string): Promise<Plan> {
  const response = await api.patch<Plan>(`/plans/${id}/toggle`);
  return response.data;
}
