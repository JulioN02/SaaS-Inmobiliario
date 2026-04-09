import { prisma } from '../../config/database';
import { UserRole } from '@prisma/client';

export type CreateUserInput = {
  tenantId: string;
  roleId: string;
  email: string;
  password: string;  // raw — hashed in service
  role: UserRole;
  firstName?: string;
  lastName?: string;
};

export type UpdateUserInput = {
  roleId?: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
};

export type UserListFilters = {
  tenantId: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

export const userRepository = {
  findAll: async (filters: UserListFilters) => {
    const { tenantId, isActive, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive })
    };

    const [total, data] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, role: true, firstName: true,
          lastName: true, isActive: true, createdAt: true, updatedAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    return { data, total, page, limit };
  },

  findById: (id: string, tenantId: string) => {
    return prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: {
        id: true, email: true, role: true, roleId: true,
        firstName: true, lastName: true, isActive: true,
        createdAt: true, updatedAt: true
      }
    });
  },

  findByEmail: (email: string, tenantId: string) => {
    return prisma.user.findFirst({ where: { email, tenantId, deletedAt: null } });
  },

  countActive: (tenantId: string) => {
    return prisma.user.count({ where: { tenantId, isActive: true, deletedAt: null } });
  },

  create: (data: CreateUserInput) => {
    return prisma.user.create({
      data,
      select: {
        id: true, email: true, role: true,
        firstName: true, lastName: true, isActive: true,
        createdAt: true
      }
    });
  },

  update: (id: string, tenantId: string, data: UpdateUserInput) => {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true, email: true, role: true,
        firstName: true, lastName: true, isActive: true,
        updatedAt: true
      }
    });
  },

  setActive: (id: string, isActive: boolean) => {
    return prisma.user.update({ where: { id }, data: { isActive } });
  },

  softDelete: (id: string) => {
    return prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
  }
};
