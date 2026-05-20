/* =============================================================================
   SaaS Inmobiliario — Resident + Occupancy Types
   ============================================================================= */

import type { DocumentType, OccupancyType } from './index';

// Re-export types for use in other modules
export type { DocumentType, OccupancyType };

// ── Resident ────────────────────────────────────────────────────────────────

export interface Resident {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  email?: string;
  phone?: string;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreateResidentDto {
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  email?: string;
  phone?: string;
  emergencyContact?: string;
}

export interface UpdateResidentDto {
  firstName?: string;
  lastName?: string;
  documentType?: DocumentType;
  documentNumber?: string;
  email?: string;
  phone?: string;
  emergencyContact?: string;
}

export interface FindAllResidentsParams {
  page?: number;
  limit?: number;
  documentType?: DocumentType;
  documentNumber?: string;
}

export interface PaginatedResidents {
  data: Resident[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Occupancy ────────────────────────────────────────────────────────────────

export interface Occupancy {
  id: string;
  tenantId: string;
  unitId: string;
  residentId: string;
  type: OccupancyType;
  startDate: string;
  endDate?: string | null;
  notes?: string;
  documents?: Array<{
    name: string;
    type: string;
    url?: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  // Optional included relations
  unit?: {
    id: string;
    identifier: string;
    status: string;
    property?: { name: string };
    tower?: { name: string };
    propertyName?: string;
    towerName?: string;
  };
  resident?: {
    id: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
    email?: string;
    phone?: string;
  };
}

export interface CreateOccupancyDto {
  unitId: string;
  residentId: string;
  type: OccupancyType;
  startDate: string;
  endDate?: string;
  documents?: Array<{
    name: string;
    type: string;
    url?: string;
    notes?: string;
  }>;
  notes?: string;
}

export interface CloseOccupancyDto {
  endDate: string;
}

export interface FindAllOccupanciesParams {
  page?: number;
  limit?: number;
  unitId?: string;
  residentId?: string;
  type?: OccupancyType;
  active?: boolean;
}

export interface PaginatedOccupancies {
  data: Occupancy[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}