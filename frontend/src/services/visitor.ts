/* =============================================================================
   SaaS Inmobiliario — Visitor Service
   ============================================================================= */

import { api } from './api';
import type {
  Visitor,
  CreateVisitorDto,
  CheckoutVisitorDto,
  FindAllVisitorsParams,
  PaginatedVisitors,
} from '../types/visitor';

export async function findAllVisitors(
  params?: FindAllVisitorsParams,
): Promise<PaginatedVisitors> {
  const response = await api.get<PaginatedVisitors>('/visitors', { params });
  return response.data;
}

export async function findVisitorById(id: string): Promise<Visitor> {
  const response = await api.get<Visitor>(`/visitors/${id}`);
  return response.data;
}

export async function createVisitor(dto: CreateVisitorDto): Promise<Visitor> {
  const response = await api.post<Visitor>('/visitors', dto);
  return response.data;
}

export async function checkoutVisitor(
  id: string,
  dto: CheckoutVisitorDto,
): Promise<Visitor> {
  const response = await api.patch<Visitor>(`/visitors/${id}/checkout`, dto);
  return response.data;
}