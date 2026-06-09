/* =============================================================================
   SaaS Inmobiliario — Plan Types
   ============================================================================= */

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  limits: PlanLimits;
  prices: PlanPrices;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface PlanLimits {
  properties: number;  // -1 = unlimited
  units: number;
  users: number;
}

export interface PlanPrices {
  monthly: number;
  yearly: number;
}

export interface CreatePlanDto {
  name: string;
  slug: string;
  description?: string;
  limits: PlanLimits;
  prices: PlanPrices;
  features?: string[];
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdatePlanDto = Partial<CreatePlanDto>;

export interface FindAllPlansParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export interface PaginatedPlans {
  data: Plan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
