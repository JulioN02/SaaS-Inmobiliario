/* =============================================================================
   SaaS Inmobiliario — Public API Service
   Uses raw fetch() to avoid JWT auth interceptors
   ============================================================================= */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PublicWebsiteConfig {
  id: string;
  tenantId: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  siteTitle: string;
  welcomeMessage?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  metaTitle?: string;
  metaDescription?: string;
  isMaintenanceMode: boolean;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProperty {
  id: string;
  name: string;
  address?: string;
  propertyType: string;
  description?: string;
  imageUrl?: string;
  unitCount: number;
}

// ── Generic fetch wrapper (raw, no axios) ────────────────────────────────────

async function publicFetch<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    let message = `Error: ${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body.message) message = body.message;
    } catch {
      // fallback to status text
    }
    throw new Error(message);
  }

  return response.json();
}

// ── Public endpoints ─────────────────────────────────────────────────────────

export async function getWebsiteConfig(subdomain: string): Promise<PublicWebsiteConfig> {
  return publicFetch<PublicWebsiteConfig>(`/public/${encodeURIComponent(subdomain)}/website`);
}

export async function getPublicProperties(subdomain: string): Promise<PublicProperty[]> {
  return publicFetch<PublicProperty[]>(`/public/${encodeURIComponent(subdomain)}/properties`);
}
