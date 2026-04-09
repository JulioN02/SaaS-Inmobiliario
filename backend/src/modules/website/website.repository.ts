import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export type UpdateWebsiteConfigInput = {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  sections?: any; // JSON
};

export const websiteRepository = {
  findByTenantId: (tenantId: string) =>
    prisma.websiteConfig.findFirst({
      where: { tenantId }
    }),

  updateOrCreate: (tenantId: string, data: UpdateWebsiteConfigInput) =>
    prisma.websiteConfig.upsert({
      where: { tenantId },
      update: data,
      create: {
        tenantId,
        ...data
      }
    })
};
