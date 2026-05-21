/* =============================================================================
   SaaS Inmobiliario — User Service
   Funciones que llaman al endpoint /users del backend
   ============================================================================= */

import { api } from './api';
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  FindAllUsersParams,
  PaginatedUsers,
} from '../types/user';

// ── Obtener lista paginada ───────────────────────────────────────────────────

export async function findAllUsers(params?: FindAllUsersParams): Promise<PaginatedUsers> {
  const response = await api.get<PaginatedUsers>('/users', { params });
  return response.data;
}

// ── Obtener usuario por ID ───────────────────────────────────────────────────

export async function findUserById(id: string): Promise<User> {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
}

// ── Crear usuario ────────────────────────────────────────────────────────────

export async function createUser(dto: CreateUserDto): Promise<User> {
  const response = await api.post<User>('/users', dto);
  return response.data;
}

// ── Actualizar usuario ───────────────────────────────────────────────────────

export async function updateUser(id: string, dto: UpdateUserDto): Promise<User> {
  const response = await api.patch<User>(`/users/${id}`, dto);
  return response.data;
}

// ── Suspender usuario ────────────────────────────────────────────────────────

export async function suspendUser(id: string): Promise<User> {
  const response = await api.patch<User>(`/users/${id}/suspend`);
  return response.data;
}

// ── Activar usuario ──────────────────────────────────────────────────────────

export async function activateUser(id: string): Promise<User> {
  const response = await api.patch<User>(`/users/${id}/activate`);
  return response.data;
}

// ── Asignar rol ──────────────────────────────────────────────────────────────

export async function assignRole(id: string, roleId: string): Promise<User> {
  const response = await api.patch<User>(`/users/${id}/role`, { roleId });
  return response.data;
}