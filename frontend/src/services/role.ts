/* =============================================================================
   SaaS Inmobiliario — Role Service
   Funciones que llaman al endpoint /roles del backend
   ============================================================================= */

import { api } from './api';
import type {
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  FindAllRolesParams,
  PaginatedRoles,
  Permission,
} from '../types/role';

// ── Obtener lista paginada ───────────────────────────────────────────────────

export async function findAllRoles(params?: FindAllRolesParams): Promise<PaginatedRoles> {
  const response = await api.get<PaginatedRoles>('/roles', { params });
  return response.data;
}

// ── Obtener rol por ID ───────────────────────────────────────────────────────────────

export async function findRoleById(id: string): Promise<Role> {
  const response = await api.get<Role>(`/roles/${id}`);
  return response.data;
}

// ── Crear rol ────────────────────────────────────────────────────────────────

export async function createRole(dto: CreateRoleDto): Promise<Role> {
  const response = await api.post<Role>('/roles', dto);
  return response.data;
}

// ── Actualizar rol ───────────────────────────────────────────────────────

export async function updateRole(id: string, dto: UpdateRoleDto): Promise<Role> {
  const response = await api.patch<Role>(`/roles/${id}`, dto);
  return response.data;
}

// ── Eliminar rol ──────────────────────────────────────────────────────────────

export async function deleteRole(id: string): Promise<void> {
  await api.delete(`/roles/${id}`);
}

// ── Asignar permisos a un rol ──────────────────────────────────────────

export async function assignPermissions(id: string, permissions: Permission[]): Promise<Role> {
  const response = await api.patch<Role>(`/roles/${id}/permissions`, { permissions });
  return response.data;
}