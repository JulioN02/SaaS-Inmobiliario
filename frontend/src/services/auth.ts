/* =============================================================================
   SaaS Inmobiliario — Servicio de Autenticación
   Funciones que llaman al endpoint /auth del backend
   ============================================================================= */

import { api } from './api';
import type { LoginResponse } from '../types';

// ── Login ───────────────────────────────────────────────────────────────────

export async function loginService(email: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', { email, password });
  return response.data;
}

// ── Logout ──────────────────────────────────────────────────────────────────

export function logoutService(): void {
  localStorage.removeItem('saas_token');
  localStorage.removeItem('saas_user');
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
    return null;
  }
}

// ── Guardar sesión ──────────────────────────────────────────────────────────

export function saveSession(token: string, user: LoginResponse['user']): void {
  localStorage.setItem('saas_token', token);
  localStorage.setItem('saas_user', JSON.stringify(user));
}
