/* =============================================================================
   SaaS Inmobiliario — Property Service
   ============================================================================= */

import { api } from './api';
import type {
  Property,
  CreatePropertyDto,
  UpdatePropertyDto,
  FindAllPropertiesParams,
  PaginatedProperties,
} from '../types/property';

export async function findAllProperties(
  params?: FindAllPropertiesParams,
): Promise<PaginatedProperties> {
  const response = await api.get<PaginatedProperties>('/properties', { params });
  return response.data;
}

export async function findPropertyById(id: string): Promise<Property> {
  const response = await api.get<Property>(`/properties/${id}`);
  return response.data;
}

export async function createProperty(dto: CreatePropertyDto): Promise<Property> {
  const response = await api.post<Property>('/properties', dto);
  return response.data;
}

export async function updateProperty(
  id: string,
  dto: UpdatePropertyDto,
): Promise<Property> {
  const response = await api.patch<Property>(`/properties/${id}`, dto);
  return response.data;
}

export async function deleteProperty(id: string): Promise<Property> {
  const response = await api.delete<Property>(`/properties/${id}`);
  return response.data;
}