/* =============================================================================
   SaaS Inmobiliario — useAuth Hook
   Shortcut para consumir el contexto de autenticación
   ============================================================================= */

import { createContext, useContext } from 'react';
import type { User, UserRole } from '../types';

// ── Tipos del contexto ──────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

// ── Contexto (creado aquí, proveído en AuthProvider) ────────────────────────

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  role: null,
  login: async () => {},
  logout: () => {},
  error: null,
  clearError: () => {},
});

// ── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }

  return context;
}
