/* =============================================================================
   SaaS Inmobiliario — Auth Store (Zustand)
   Estado global de autenticación con persistencia en localStorage
   ============================================================================= */

import { create } from 'zustand';
import type { User } from '../types';
import {
  loginService,
  logoutService,
  getStoredSession,
  saveSession,
} from '../services/auth';

// ── Estado y acciones ───────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  initialize: () => void;
}

// ── Store ───────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Login: llama al backend y guarda la sesión
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await loginService(email, password);

      saveSession(response.accessToken, response.user);

      set({
        user: response.user,
        token: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de autenticación';
      set({
        isLoading: false,
        error: message,
        isAuthenticated: false,
      });
      throw err;
    }
  },

  // Logout: limpia todo
  logout: () => {
    logoutService();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  // Limpiar error
  clearError: () => {
    set({ error: null });
  },

  // Inicializar: recuperar sesión guardada de localStorage
  initialize: () => {
    const session = getStoredSession();

    if (session) {
      set({
        user: session.user,
        token: session.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },
}));
