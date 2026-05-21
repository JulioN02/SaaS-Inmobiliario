/* =============================================================================
   SaaS Inmobiliario — Tower Service
   ============================================================================= */

import { api } from './api';
import type {
  Tower,
  CreateTowerDto,
  UpdateTowerDto,
  FindAllTowersParams,
  PaginatedTowers,
} from '../types/property';

export async function findAllTowers(
  params: FindAllTowersParams,
): Promise<PaginatedTowers> {
  const response = await api.get<PaginatedTowers>('/towers', {
    params: { propertyId: params.propertyId, page: params.page, limit: params.limit },
  });
  return response.data;
}

export async function findTowerById(id: string): Promise<Tower> {
  const response = await api.get<Tower>(`/towers/${id}`);
  return response.data;
}

export async function createTower(dto: CreateTowerDto): Promise<Tower> {
  const response = await api.post<Tower>('/properties/' + dto.propertyId + '/towers', {
    name: dto.name,
    floorsCount: dto.floorsCount,
  });
  return response.data;
}

export async function updateTower(
  id: string,
  dto: UpdateTowerDto,
): Promise<Tower> {
  const response = await api.patch<Tower>(`/towers/${id}`, dto);
  return response.data;
}

export async function deleteTower(id: string): Promise<Tower> {
  const response = await api.delete<Tower>(`/towers/${id}`);
  return response.data;
}