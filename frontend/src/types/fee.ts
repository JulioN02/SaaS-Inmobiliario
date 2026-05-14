/* =============================================================================
   SaaS Inmobiliario — Fee Types
   ============================================================================= */

export type FeeStatus = 'PENDING' | 'PAID' | 'PARTIAL';
export type FeeType = 'PERIODIC' | 'EXTRAORDINARY' | 'ADJUSTMENT';

export interface Fee {
  id: string;
  tenantId: string;
  unitId: string;
  amount: number;
  description?: string;
  period: string; // "YYYY-MM"
  dueDate: string;
  status: FeeStatus;
  feeType: FeeType;
  paidAmount?: number;
  paidAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  unitNumber?: string;
  towerName?: string;
}

export interface CreateFeeDto {
  unitId: string;
  amount: number;
  description?: string;
  period: string;
  dueDate: string;
  feeType: FeeType;
}

export interface UpdateFeeDto {
  amount?: number;
  description?: string;
  dueDate?: string;
}

export interface UpdateFeeStatusDto {
  status: FeeStatus;
  paidAmount?: number;
}

export interface FindAllFeesParams {
  unitId?: string;
  status?: FeeStatus;
  period?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedFees {
  data: Fee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
