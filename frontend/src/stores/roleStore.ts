/* =============================================================================
   SaaS Inmobiliario — Role Store (Zustand)
   Estado global de roles del tenant con operaciones CRUD
   ============================================================================= */

import { create } from 'zustand';
import type {
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  FindAllRolesParams,
  // PaginatedRoles,
  Permission,
} from '../types/role';
import {
  findAllRoles,
  findRoleById,
  createRole as createRoleApi,
  updateRole as updateRoleApi,
  deleteRole as deleteRoleApi,
  assignPermissions,
} from '../services/role';

// ── Normalizar rol del backend (rol + permisos) al formato del frontend ──

function normalizeRole(role: any): Role {
  // Si ya está en formato frontend, devolver tal cual
  if (role.permissions && role.permissions.length > 0 && role.permissions[0]?.actions) {
    return role as Role;
  }
  // Convertir de backend: {roleId, permissionId, permission:{resource, action}}[]
  // a frontend: {resource, actions[]}[]
  const permMap = new Map<string, string[]>();
  for (const rp of role.permissions || []) {
    const p = rp.permission || rp;
    const res = p.resource;
    const act = p.action;
    if (!permMap.has(res)) permMap.set(res, []);
    const arr = permMap.get(res)!;
    if (act && !arr.includes(act)) arr.push(act);
  }
  const permissions: Permission[] = [];
  for (const [resource, actions] of permMap) {
    permissions.push({ resource, actions });
  }
  return { ...role, permissions };
}

function normalizeRoles(roles: any[]): Role[] {
  return roles.map(normalizeRole);
}

// ── Estado y acciones ─────────────────────────────────────────────────────

interface RoleState {
  roles: Role[];
  selectedRole: Role | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  limit: number;

  // Acciones
  fetchRoles: (params?: FindAllRolesParams) => Promise<void>;
  fetchRoleById: (id: string) => Promise<void>;
  createRole: (dto: CreateRoleDto) => Promise<void>;
  updateRole: (id: string, dto: UpdateRoleDto) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  assignRolePermissions: (id: string, permissions: Permission[]) => Promise<void>;
  setSelectedRole: (role: Role | null) => void;
  clearError: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useRoleStore = create<RoleState>((set) => ({
  roles: [],
  selectedRole: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 10,

  // Obtener lista de roles
  fetchRoles: async (params?: FindAllRolesParams) => {
    set({ loading: true, error: null });
    try {
      const result = await findAllRoles(params);
      
      // El backend puede devolver array plano o paginado
      if (Array.isArray(result)) {
        const roles = normalizeRoles(result);
        set({
          roles,
          total: roles.length,
          page: 1,
          totalPages: 1,
          limit: roles.length,
          loading: false,
        });
      } else {
        const paginated = result as any;
        const data = normalizeRoles(paginated.data ?? []);
        set({
          roles: data,
          total: paginated.total ?? data.length,
          page: paginated.page ?? 1,
          totalPages: paginated.totalPages ?? 1,
          limit: paginated.limit ?? data.length,
          loading: false,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener roles';
      set({ error: message, loading: false });
    }
  },

  // Obtener rol por ID
  fetchRoleById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const role = await findRoleById(id);
      set({ selectedRole: normalizeRole(role), loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener rol';
      set({ error: message, loading: false });
    }
  },

  // Crear rol
  createRole: async (dto: CreateRoleDto) => {
    set({ loading: true, error: null });
    try {
      const newRole = await createRoleApi(dto);
      set((state) => ({
        roles: [newRole, ...state.roles],
        total: state.total + 1,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear rol';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // Actualizar rol
  updateRole: async (id: string, dto: UpdateRoleDto) => {
    set({ loading: true, error: null });
    try {
      const updatedRole = await updateRoleApi(id, dto);
      set((state) => ({
        roles: state.roles.map((r) => (r.id === id ? updatedRole : r)),
        selectedRole: state.selectedRole?.id === id ? updatedRole : state.selectedRole,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar rol';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // Eliminar rol
  deleteRole: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteRoleApi(id);
      set((state) => ({
        roles: state.roles.filter((r) => r.id !== id),
        selectedRole: state.selectedRole?.id === id ? null : state.selectedRole,
        total: state.total - 1,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar rol';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // Asignar permisos a rol
  assignRolePermissions: async (id: string, permissions: Permission[]) => {
    set({ loading: true, error: null });
    try {
      const updatedRole = await assignPermissions(id, permissions);
      set((state) => ({
        roles: state.roles.map((r) => (r.id === id ? updatedRole : r)),
        selectedRole: state.selectedRole?.id === id ? updatedRole : state.selectedRole,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al asignar permisos';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // Seleccionar rol
  setSelectedRole: (role: Role | null) => {
    set({ selectedRole: role });
  },

  // Limpiar error
  clearError: () => {
    set({ error: null });
  },
}));