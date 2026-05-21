/* =============================================================================
   SaaS Inmobiliario — Occupancy Service
   ============================================================================= */

import { api } from './api';
import type {
  Occupancy,
  CreateOccupancyDto,
  CloseOccupancyDto,
  FindAllOccupanciesParams,
  PaginatedOccupancies,
} from '../types/resident';

export async function findAllOccupancies(
  params?: FindAllOccupanciesParams,
): Promise<PaginatedOccupancies> {
  const response = await api.get<PaginatedOccupancies>('/occupancies', { params });
  return response.data;
}

export async function findOccupancyById(id: string): Promise<Occupancy> {
  const response = await api.get<Occupancy>(`/occupancies/${id}`);
  return response.data;
}

export async function createOccupancy(dto: CreateOccupancyDto): Promise<Occupancy> {
  const response = await api.post<Occupancy>('/occupancies', dto);
  return response.data;
}

export async function closeOccupancy(
  id: string,
  dto: CloseOccupancyDto,
): Promise<Occupancy> {
  const response = await api.patch<Occupancy>(`/occupancies/${id}/close`, dto);
  return response.data;
}