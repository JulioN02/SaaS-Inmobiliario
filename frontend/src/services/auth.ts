/* =============================================================================
   SaaS Inmobiliario — Servicio de Autenticación
   Funciones que llaman al endpoint /auth del backend
   Soporta login multi-tenant por subdominio (x-tenant-id dinámico)
   ============================================================================= */

import { api } from './api';
import type { LoginResponse } from '../types';

// Tenant ID del platform (seed data) - fallback para desarrollo local
const PLATFORM_TENANT_ID = '2fdee7cd-3d10-49f5-a096-38e11b8391a9';

// ── Resolver tenant desde subdominio ─────────────────────────────────────────
// El backend ya soporta subdominios en x-tenant-id (TenantGuard step 2).

function resolveTenantId(): string {
  if (typeof window === 'undefined') {
    return PLATFORM_TENANT_ID; // SSR / test fallback
  }

  const hostname = window.location.hostname;

  // localhost directo → platform tenant (dev)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return PLATFORM_TENANT_ID;
  }

  // Extraer subdominio: "losalamos" de "losalamos.localhost"
  // Se envía como x-tenant-id; el backend lo resuelve a UUID
  return hostname.split('.')[0] ?? PLATFORM_TENANT_ID;
}

// ── Login ───────────────────────────────────────────────────────────────────

export async function loginService(email: string, password: string): Promise<LoginResponse> {
  const tenantId = resolveTenantId();
  const response = await api.post<LoginResponse>('/auth/login',
    { email, password },
    { headers: { 'x-tenant-id': tenantId } }
  );
  return response.data;
}

// ── Logout ──────────────────────────────────────────────────────────────────

export function logoutService(): void {
  localStorage.removeItem('saas_token');
  localStorage.removeItem('saas_user');
  localStorage.removeItem('saas_tenant_id');
}

// ── Recuperar sesión guardada ───────────────────────────────────────────────

export function getStoredSession(): { token: string; user: LoginResponse['user'] } | null {
  const token = localStorage.getItem('saas_token');
  const userJson = localStorage.getItem('saas_user');

  if (!token || !userJson) return null;

  try {
    const user = JSON.parse(userJson) as LoginResponse['user'];
    return { token, user };
  } catch {
    // JSON inválido → limpiar
    localStorage.removeItem('saas_token');
    localStorage.removeItem('saas_user');
    localStorage.removeItem('saas_tenant_id');
    return null;
  }
}

// ── Guardar sesión ──────────────────────────────────────────────────────────

export function saveSession(token: string, user: LoginResponse['user']): void {
  localStorage.setItem('saas_token', token);
  localStorage.setItem('saas_user', JSON.stringify(user));
  localStorage.setItem('saas_tenant_id', user.clientId);
}
