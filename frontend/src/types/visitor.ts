/* =============================================================================
   SaaS Inmobiliario — Visitor Types
   ============================================================================= */

export interface Visitor {
  id: string;
  tenantId: string;
  unitId: string;
  visitorName: string;
  documentNumber?: string;
  entryDate: string; // ISO
  exitDate?: string; // ISO
  notes?: string;
  registeredBy: string;
  createdAt: string;
  updatedAt: string;
  unitNumber?: string;
  towerName?: string;
}

export interface CreateVisitorDto {
  unitId: string;
  visitorName: string;
  documentNumber?: string;
  entryDate?: string;
  notes?: string;
}

export interface CheckoutVisitorDto {
  exitDate: string;
}

export interface FindAllVisitorsParams {
  unitId?: string;
  entryDateFrom?: string;
  entryDateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedVisitors {
  data: Visitor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}