import { websiteRepository, UpdateWebsiteConfigInput } from './website.repository';
import { NotFoundError } from '../../shared/errors';

export const websiteService = {
  getConfig: async (tenantId: string) => {
    const config = await websiteRepository.findByTenantId(tenantId);
    if (!config) throw new NotFoundError('Website configuration not found for this tenant');
    return config;
  },

  updateConfig: async (tenantId: string, data: UpdateWebsiteConfigInput) => {
    return websiteRepository.updateOrCreate(tenantId, data);
  }
};
