/* =============================================================================
   SaaS Inmobiliario — Unit Service
   ============================================================================= */

import { api } from './api';
import type {
  Unit,
  CreateUnitDto,
  UpdateUnitDto,
  FindAllUnitsParams,
  PaginatedUnits,
} from '../types/property';

export async function findAllUnits(
  params?: FindAllUnitsParams,
): Promise<PaginatedUnits> {
  const response = await api.get<PaginatedUnits>('/units', { params });
  return response.data;
}

export async function findUnitById(id: string): Promise<Unit> {
  const response = await api.get<Unit>(`/units/${id}`);
  return response.data;
}

export async function createUnit(dto: CreateUnitDto): Promise<Unit> {
  const response = await api.post<Unit>('/units', dto);
  return response.data;
}

export async function updateUnit(
  id: string,
  dto: UpdateUnitDto,
): Promise<Unit> {
  const response = await api.patch<Unit>(`/units/${id}`, dto);
  return response.data;
}

export async function deleteUnit(id: string): Promise<Unit> {
  const response = await api.delete<Unit>(`/units/${id}`);
  return response.data;
}