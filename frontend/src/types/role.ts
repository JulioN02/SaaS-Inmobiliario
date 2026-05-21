/* =============================================================================
   SaaS Inmobiliario — Role Types
   Interfaces para gestión de roles y permisos (RBAC)
   ============================================================================= */

// ── Nombre de rol ─────────────────────────────────────────────────────────

export type RoleName = 'SuperAdmin' | 'AdminTenant' | 'Administrativo' | 'Portero';

// ── Permisos ─────────────────────────────────────────────────────────────

export interface Permission {
  resource: string;    // e.g., 'user', 'property', 'resident'
  actions: string[];     // e.g., ['create', 'read', 'update', 'delete']
}

// ── Rol ─────────────────────────────────────────────────────────────────

export interface Role {
  id: string;
  tenantId: string;
  name: RoleName;
  description?: string;
  permissions: Permission[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateRoleDto {
  name: RoleName;
  description?: string;
  permissions: Permission[];
}

export interface UpdateRoleDto {
  name?: RoleName;
  description?: string;
  permissions?: Permission[];
}

// ── Búsqueda ─────────────────────────────────────────────────────────────

export interface FindAllRolesParams {
  page?: number;
  limit?: number;
}

// ── Respuesta paginada ─────────────────────────────────────────────────────

export interface PaginatedRoles {
  data: Role[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Recursos disponibles para permisos ──────────────────────────────────────

export const PERMISSION_RESOURCES = [
  'user',
  'property',
  'unit',
  'resident',
  'occupancy',
  'visitor',
  'maintenance',
  'fee',
  'announcement',
] as const;

export type PermissionResource = (typeof PERMISSION_RESOURCES)[number];

// ── Acciones disponibles para permisos ─────────────────────────────

export const PERMISSION_ACTIONS = ['create', 'read', 'update', 'delete'] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];