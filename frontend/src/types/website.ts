/* =============================================================================
   SaaS Inmobiliario — Website Config Types
   ============================================================================= */

export interface WebsiteConfig {
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

export interface UpdateWebsiteDto {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  siteTitle?: string;
  welcomeMessage?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  metaTitle?: string;
  metaDescription?: string;
  isMaintenanceMode?: boolean;
  isPublic?: boolean;
}
