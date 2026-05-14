/* =============================================================================
   SaaS Inmobiliario — User Types
   Interfaces para CRUD de usuarios (diferente al User de autenticación)
   ============================================================================= */

import type { UserRole } from './index';

// ── Usuario (detalle) ────────────────────────────────────────────────────────

export interface User {
  id: string;
  tenantId: string;
  roleId: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateUserDto {
  email: string;
  password: string;
  roleId: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
}

// ── Parámetros de búsqueda ───────────────────────────────────────────────────

export interface FindAllUsersParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  role?: UserRole;
}

// ── Respuesta paginada ───────────────────────────────────────────────────────

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}