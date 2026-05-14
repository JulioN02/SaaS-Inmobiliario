/* =============================================================================
   SaaS Inmobiliario — Fee Service
   ============================================================================= */

import { api } from './api';
import type {
  Fee,
  CreateFeeDto,
  UpdateFeeDto,
  UpdateFeeStatusDto,
  FindAllFeesParams,
  PaginatedFees,
} from '../types/fee';

export async function getFees(params?: FindAllFeesParams): Promise<PaginatedFees> {
  const response = await api.get<PaginatedFees>('/fees', { params });
  return response.data;
}

export async function getFee(id: string): Promise<Fee> {
  const response = await api.get<Fee>(`/fees/${id}`);
  return response.data;
}

export async function createFee(dto: CreateFeeDto): Promise<Fee> {
  const response = await api.post<Fee>('/fees', dto);
  return response.data;
}

export async function updateFee(id: string, dto: UpdateFeeDto): Promise<Fee> {
  const response = await api.patch<Fee>(`/fees/${id}`, dto);
  return response.data;
}

export async function updateFeeStatus(id: string, dto: UpdateFeeStatusDto): Promise<Fee> {
  const response = await api.patch<Fee>(`/fees/${id}/status`, dto);
  return response.data;
}
