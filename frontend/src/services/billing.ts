/* =============================================================================
   SaaS Inmobiliario — Billing Service
   ============================================================================= */

import { api } from './api';
import type {
  BillingMetrics,
  TenantBillingStatus,
  SubscriptionDto,
  InvoiceDto,
  PaymentDto,
  BillingConfigDto,
  CreateInvoiceDto,
  CreatePaymentDto,
  UpdateBillingConfigDto,
} from '../types';

// ── Metrics ─────────────────────────────────────────────────────────────────

export async function fetchBillingMetrics(): Promise<BillingMetrics> {
  const response = await api.get<BillingMetrics>('/billing/metrics');
  return response.data;
}

// ── Tenant Billing Status ───────────────────────────────────────────────────

export interface TenantBillingStatusParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface PaginatedTenantBilling {
  data: TenantBillingStatus[];
  total: number;
  page: number;
  totalPages: number;
}

export async function fetchTenantBillingStatuses(
  params?: TenantBillingStatusParams,
): Promise<PaginatedTenantBilling> {
  const response = await api.get<PaginatedTenantBilling>('/billing/tenants', { params });
  return response.data;
}

// ── Subscriptions ───────────────────────────────────────────────────────────

export interface SubscriptionListParams {
  page?: number;
  limit?: number;
}

export interface PaginatedSubscriptions {
  data: SubscriptionDto[];
  total: number;
  page: number;
  totalPages: number;
}

export async function fetchSubscriptions(
  params?: SubscriptionListParams,
): Promise<PaginatedSubscriptions> {
  const response = await api.get<PaginatedSubscriptions>('/subscriptions', { params });
  return response.data;
}

export async function fetchSubscription(id: string): Promise<SubscriptionDto> {
  const response = await api.get<SubscriptionDto>(`/subscriptions/${id}`);
  return response.data;
}

export async function updateSubscription(
  id: string,
  data: Partial<{ status: string; planId: string }>,
): Promise<SubscriptionDto> {
  const response = await api.patch<SubscriptionDto>(`/subscriptions/${id}`, data);
  return response.data;
}

// ── Invoices ────────────────────────────────────────────────────────────────

export interface InvoiceListParams {
  page?: number;
  limit?: number;
  tenantId?: string;
  status?: string;
}

export interface PaginatedInvoices {
  data: InvoiceDto[];
  total: number;
  page: number;
  totalPages: number;
}

export async function fetchInvoices(
  params?: InvoiceListParams,
): Promise<PaginatedInvoices> {
  const response = await api.get<PaginatedInvoices>('/invoices', { params });
  return response.data;
}

export async function fetchInvoice(id: string): Promise<InvoiceDto> {
  const response = await api.get<InvoiceDto>(`/invoices/${id}`);
  return response.data;
}

export async function createInvoice(dto: CreateInvoiceDto): Promise<InvoiceDto> {
  const response = await api.post<InvoiceDto>('/invoices', dto);
  return response.data;
}

export async function updateInvoice(
  id: string,
  data: Partial<CreateInvoiceDto>,
): Promise<InvoiceDto> {
  const response = await api.patch<InvoiceDto>(`/invoices/${id}`, data);
  return response.data;
}

export async function finalizeInvoice(id: string): Promise<InvoiceDto> {
  const response = await api.patch<InvoiceDto>(`/invoices/${id}/finalize`);
  return response.data;
}

export async function cancelInvoice(id: string): Promise<InvoiceDto> {
  const response = await api.patch<InvoiceDto>(`/invoices/${id}/cancel`);
  return response.data;
}

// ── Payments ────────────────────────────────────────────────────────────────

export async function fetchInvoicePayments(id: string): Promise<PaymentDto[]> {
  const response = await api.get<PaymentDto[]>(`/invoices/${id}/payments`);
  return response.data;
}

export async function createPayment(dto: CreatePaymentDto): Promise<PaymentDto> {
  const response = await api.post<PaymentDto>('/payments', dto);
  return response.data;
}

export async function fetchPayment(id: string): Promise<PaymentDto> {
  const response = await api.get<PaymentDto>(`/payments/${id}`);
  return response.data;
}

// ── Billing Config ──────────────────────────────────────────────────────────

export async function fetchBillingConfig(tenantId: string): Promise<BillingConfigDto> {
  const response = await api.get<BillingConfigDto>(`/tenants/${tenantId}/billing-config`);
  return response.data;
}

export async function updateBillingConfig(
  tenantId: string,
  data: UpdateBillingConfigDto,
): Promise<BillingConfigDto> {
  const response = await api.put<BillingConfigDto>(`/tenants/${tenantId}/billing-config`, data);
  return response.data;
}
