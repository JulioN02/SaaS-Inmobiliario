/* =============================================================================
   SaaS Inmobiliario — Property, Tower, Unit Types
   ============================================================================= */

import type {
  PropertyType,
  UnitType,
  UnitStatus,
} from './index';

// Re-export types for use in other modules
export type { PropertyType, UnitType, UnitStatus };

// ── Property ──────────────────────────────────────────────────────────────────

export interface Property {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  propertyType: PropertyType;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreatePropertyDto {
  name: string;
  address: string;
  propertyType: PropertyType;
  description?: string;
}

export interface UpdatePropertyDto {
  name?: string;
  address?: string;
  propertyType?: PropertyType;
  description?: string;
}

export interface FindAllPropertiesParams {
  page?: number;
  limit?: number;
  propertyType?: PropertyType;
}

export interface PaginatedProperties {
  data: Property[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Tower ──────────────────────────────────────────────────────────────────────

export interface Tower {
  id: string;
  tenantId: string;
  propertyId: string;
  name: string;
  floorsCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateTowerDto {
  propertyId: string;
  name: string;
  floorsCount: number;
}

export interface UpdateTowerDto {
  name?: string;
  floorsCount?: number;
  propertyId?: string;
}

export interface FindAllTowersParams {
  propertyId: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTowers {
  data: Tower[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Unit ───────────────────────────────────────────────────────────────────────

export interface Unit {
  id: string;
  tenantId: string;
  propertyId: string;
  towerId?: string;
  identifier: string;
  unitType: UnitType;
  floor: number;
  status: UnitStatus;
  monthlyFeeAmount?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateUnitDto {
  propertyId: string;
  towerId?: string;
  identifier: string;
  unitType: UnitType;
  floor: number;
  monthlyFeeAmount?: number;
}

export interface UpdateUnitDto {
  propertyId?: string;
  towerId?: string;
  identifier?: string;
  unitType?: UnitType;
  floor?: number;
  status?: UnitStatus;
  monthlyFeeAmount?: number;
}

export interface FindAllUnitsParams {
  page?: number;
  limit?: number;
  propertyId?: string;
  towerId?: string;
  status?: UnitStatus;
}

export interface PaginatedUnits {
  data: Unit[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}