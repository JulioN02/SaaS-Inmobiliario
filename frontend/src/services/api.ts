/* =============================================================================
   SaaS Inmobiliario — Servicio API (Axios)
   Instancia centralizada con interceptores de request y response
   ============================================================================= */

import axios from 'axios';

// ── Configuración base ──────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor ─────────────────────────────────────────────────────
// Adjunta el token JWT automáticamente a cada request

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('saas_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Adjuntar tenantId solo si NO se especificó ya en el request
    // (loginService lo asigna explícitamente, no queremos pisarlo)
    if (!config.headers['x-tenant-id']) {
      const tenantId = localStorage.getItem('saas_tenant_id');
      if (tenantId) {
        config.headers['x-tenant-id'] = tenantId;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ────────────────────────────────────────────────────
// Maneja errores de forma centralizada

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Token expirado o inválido → limpiar sesión y redirigir a login
      localStorage.removeItem('saas_token');
      localStorage.removeItem('saas_user');

      // Solo redirigir si no estamos ya en login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Retornar un error con mensaje legible
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      'Error de conexión. Intenta de nuevo.';

    return Promise.reject(new Error(message));
  }
);

// ── Helper para construir query strings ─────────────────────────────────────

export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  }

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}
