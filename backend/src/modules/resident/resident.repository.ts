import { prisma } from '../../config/database';
import { DocumentType } from '@prisma/client';

export type CreateResidentInput = {
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  email?: string;
  phone?: string;
  emergencyContact?: string;
};

export type UpdateResidentInput = Partial<CreateResidentInput>;

export type ResidentListFilters = {
  tenantId: string;
  page?: number;
  limit?: number;
};

export const residentRepository = {
  findAll: async (filters: ResidentListFilters) => {
    const { tenantId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = { tenantId, deletedAt: null };

    const [total, data] = await Promise.all([
      prisma.resident.count({ where }),
      prisma.resident.findMany({
        where,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip,
        take: limit
      })
    ]);

    return { data, total, page, limit };
  },

  findById: (id: string, tenantId: string) =>
    prisma.resident.findFirst({ where: { id, tenantId, deletedAt: null } }),

  findByDocument: (documentNumber: string, tenantId: string) =>
    prisma.resident.findFirst({ where: { documentNumber, tenantId, deletedAt: null } }),

  hasActiveOccupancy: async (id: string) => {
    const count = await prisma.occupancy.count({ where: { residentId: id, endDate: null } });
    return count > 0;
  },

  create: (tenantId: string, data: CreateResidentInput) =>
    prisma.resident.create({ data: { ...data, tenantId } }),

  update: (id: string, data: UpdateResidentInput) =>
    prisma.resident.update({ where: { id }, data }),

  softDelete: (id: string) =>
    prisma.resident.update({ where: { id }, data: { deletedAt: new Date() } })
};
