/* =============================================================================
   SaaS Inmobiliario — Billing Types
   ============================================================================= */

// ── Enums ───────────────────────────────────────────────────────────────────

export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
export type InvoiceStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELED' | 'REFUNDED';
export type PaymentMethod = 'cash' | 'transfer' | 'stripe' | 'other';
export type BillingCycle = 'MONTHLY' | 'YEARLY';

// ── Metrics ─────────────────────────────────────────────────────────────────

export interface BillingMetrics {
  activeSubscriptions: number;
  pastDue: number;
  mrr: number;
  collectionRate: number;
  totalCollectedYtd: number;
  pendingInvoices: number;
  totalTenants: number;
}

// ── DTOs ────────────────────────────────────────────────────────────────────

export interface SubscriptionDto {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  periodStart: string;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  tenant: { id: string; name: string; subdomain: string };
  plan: { id: string; name: string; slug: string };
  invoices: InvoiceDto[];
  createdAt: string;
}

export interface InvoiceDto {
  id: string;
  subscriptionId: string;
  tenantId: string;
  planId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  paidAt: string | null;
  paidAmount: number | null;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
  plan: { name: string; slug: string };
  payments: PaymentDto[];
}

export interface PaymentDto {
  id: string;
  invoiceId: string;
  tenantId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference: string | null;
  receivedBy: string;
  receivedAt: string;
}

export interface BillingConfigDto {
  id: string;
  tenantId: string;
  billingCycle: BillingCycle;
  currency: string;
  gracePeriodDays: number;
  preferredPaymentMethod: string | null;
  lastInvoiceAt: string | null;
  notes: string | null;
}

export interface TenantBillingStatus {
  tenantId: string;
  tenantName: string;
  subdomain: string;
  planName: string;
  planSlug: string;
  subscriptionStatus: SubscriptionStatus;
  nextBillingDate: string;
  lastInvoiceDate: string | null;
  lastInvoiceAmount: number | null;
  lastInvoiceStatus: InvoiceStatus | null;
  outstandingAmount: number;
  gracePeriodDays: number;
}

export interface CreateInvoiceDto {
  subscriptionId: string;
  tenantId: string;
  planId: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  notes?: string;
}

export interface CreatePaymentDto {
  invoiceId: string;
  tenantId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  receivedBy: string;
}

export interface UpdateBillingConfigDto {
  billingCycle?: BillingCycle;
  currency?: string;
  gracePeriodDays?: number;
  preferredPaymentMethod?: string;
  notes?: string;
}
