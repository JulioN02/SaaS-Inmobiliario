/* =============================================================================
   SaaS Inmobiliario — Website Config Service
   ============================================================================= */

import { api } from './api';
import type { WebsiteConfig, UpdateWebsiteDto } from '../types/website';

export async function getWebsite(): Promise<WebsiteConfig> {
  const response = await api.get<WebsiteConfig>('/website');
  return response.data;
}

export async function updateWebsite(dto: UpdateWebsiteDto): Promise<WebsiteConfig> {
  const response = await api.patch<WebsiteConfig>('/website', dto);
  return response.data;
}

export async function toggleMaintenance(): Promise<WebsiteConfig> {
  const response = await api.patch<WebsiteConfig>('/website/maintenance');
  return response.data;
}
