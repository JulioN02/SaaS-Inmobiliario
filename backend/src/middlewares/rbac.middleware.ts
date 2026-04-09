import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ForbiddenError } from '../shared/errors';

export const rbacMiddleware = (resource: string, action: 'read' | 'create' | 'update' | 'delete') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(new ForbiddenError('Auth required for RBAC'));
    }

    const { role } = req.user;

    // SUPER_ADMIN has god mode in many systems, but here we check if we should still query or bypass.
    // Following "recibe resource y action como parámetros, consulta la BD"
    
    try {
      const hasPermission = await prisma.rolePermission.findFirst({
        where: {
          role: {
            name: role
          },
          permission: {
            resource,
            action
          }
        }
      });

      if (!hasPermission && role !== 'SUPER_ADMIN') {
        return next(new ForbiddenError(`Insuficient permissions for ${action} on ${resource}`));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
