import { prisma } from '../../config/database';

export const authRepository = {
  findByEmail: async (email: string, tenantId?: string) => {
    return prisma.user.findFirst({
      where: {
        email,
        tenantId, // Filter by tenant if provided
        deletedAt: null,
      },
      include: {
        tenant: true, // To verify tenant status
        roleRef: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      }
    });
  }
};
