import { prisma } from '../../config/database';

export const roleRepository = {
  findAll: () => {
    return prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }
};
