/* =============================================================================
   SaaS Inmobiliario — Resident Service
   ============================================================================= */

import { api } from './api';
import type {
  Resident,
  CreateResidentDto,
  UpdateResidentDto,
  FindAllResidentsParams,
  PaginatedResidents,
} from '../types/resident';

export async function findAllResidents(
  params?: FindAllResidentsParams,
): Promise<PaginatedResidents> {
  const response = await api.get<PaginatedResidents>('/residents', { params });
  return response.data;
}

export async function findResidentById(id: string): Promise<Resident> {
  const response = await api.get<Resident>(`/residents/${id}`);
  return response.data;
}

export async function createResident(dto: CreateResidentDto): Promise<Resident> {
  const response = await api.post<Resident>('/residents', dto);
  return response.data;
}

export async function updateResident(
  id: string,
  dto: UpdateResidentDto,
): Promise<Resident> {
  const response = await api.patch<Resident>(`/residents/${id}`, dto);
  return response.data;
}

export async function deleteResident(id: string): Promise<void> {
  await api.delete(`/residents/${id}`);
}