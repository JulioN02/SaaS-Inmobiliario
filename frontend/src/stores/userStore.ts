/* =============================================================================
   SaaS Inmobiliario — User Store (Zustand)
   Estado global de usuarios del tenant con operaciones CRUD
   ============================================================================= */

import { create } from 'zustand';
import type {
  User,
  CreateUserDto,
  UpdateUserDto,
  FindAllUsersParams,
  PaginatedUsers,
} from '../types/user';
import {
  findAllUsers,
  findUserById,
  createUser,
  updateUser,
  suspendUser,
  activateUser,
  assignRole,
} from '../services/user';

// ── Estado y acciones ───────────────────────────────────────────────────────

interface UserState {
  users: User[];
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  limit: number;

  // Acciones
  fetchUsers: (params?: FindAllUsersParams) => Promise<void>;
  fetchUserById: (id: string) => Promise<void>;
  createUser: (dto: CreateUserDto) => Promise<void>;
  updateUser: (id: string, dto: UpdateUserDto) => Promise<void>;
  suspendUser: (id: string) => Promise<void>;
  activateUser: (id: string) => Promise<void>;
  assignRole: (id: string, roleId: string) => Promise<void>;
  setSelectedUser: (user: User | null) => void;
  clearError: () => void;
}

// ── Store ───────────────────────────────────────────────────────────────────

export const useUserStore = create<UserState>((set) => ({
  users: [],
  selectedUser: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 10,

  // Obtener lista de usuarios
  fetchUsers: async (params?: FindAllUsersParams) => {
    set({ loading: true, error: null });
    try {
      const result: PaginatedUsers = await findAllUsers(params);
      set({
        users: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener usuarios';
      set({ error: message, loading: false });
    }
  },

  // Obtener usuario por ID
  fetchUserById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const user = await findUserById(id);
      set({ selectedUser: user, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al obtener usuario';
      set({ error: message, loading: false });
    }
  },

  // Crear usuario
  createUser: async (dto: CreateUserDto) => {
    set({ loading: true, error: null });
    try {
      const newUser = await createUser(dto);
      set((state) => ({
        users: [newUser, ...state.users],
        total: state.total + 1,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear usuario';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // Actualizar usuario
  updateUser: async (id: string, dto: UpdateUserDto) => {
    set({ loading: true, error: null });
    try {
      const updatedUser = await updateUser(id, dto);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
        selectedUser: state.selectedUser?.id === id ? updatedUser : state.selectedUser,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar usuario';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // Suspender usuario
  suspendUser: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const updatedUser = await suspendUser(id);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
        selectedUser: state.selectedUser?.id === id ? updatedUser : state.selectedUser,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al suspender usuario';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // Activar usuario
  activateUser: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const updatedUser = await activateUser(id);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
        selectedUser: state.selectedUser?.id === id ? updatedUser : state.selectedUser,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al activar usuario';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // Asignar rol
  assignRole: async (id: string, roleId: string) => {
    set({ loading: true, error: null });
    try {
      const updatedUser = await assignRole(id, roleId);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? updatedUser : u)),
        selectedUser: state.selectedUser?.id === id ? updatedUser : state.selectedUser,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al asignar rol';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // Seleccionar usuario
  setSelectedUser: (user: User | null) => {
    set({ selectedUser: user });
  },

  // Limpiar error
  clearError: () => {
    set({ error: null });
  },
}));