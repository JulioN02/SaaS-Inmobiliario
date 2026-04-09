/* =============================================================================
   SaaS Inmobiliario — Role Guard
   Verifica que el usuario tenga uno de los roles permitidos para la ruta
   ============================================================================= */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { role, isLoading } = useAuth();

  // Mientras carga, no hacer nada
  if (isLoading) return null;

  // Si el rol no está permitido → redirect a dashboard
  if (role && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
