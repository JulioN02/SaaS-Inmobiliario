/* =============================================================================
   SaaS Inmobiliario — Auth Context
   Provider que envuelve la app y expone el estado de autenticación
   ============================================================================= */

import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { AuthContext } from '../hooks/useAuth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, token, isAuthenticated, isLoading, login, logout, initialize, error, clearError } =
    useAuthStore();

  // Inicializar sesión al montar
  useEffect(() => {
    initialize();
  }, [initialize]);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    role: user?.role ?? null,
    login,
    logout,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
