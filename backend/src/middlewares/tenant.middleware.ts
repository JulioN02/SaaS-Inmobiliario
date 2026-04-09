import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { ForbiddenError, NotFoundError } from '../shared/errors';

export const tenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // 1. Resolve tenantId from different sources
  let resolvedTenantId: string | undefined;

  // Case A: From already authenticated user (JWT)
  if (req.user) {
    resolvedTenantId = req.user.clientId;
    
    // Bypass validation for Platform Admin
    if (req.user.role === 'SUPER_ADMIN' && resolvedTenantId === env.platformTenantId) {
      req.tenantId = resolvedTenantId;
      return next();
    }
  } else {
    // Case B: From Subdomain (for public routes like login)
    const host = req.headers.host || '';
    const subdomain = host.split('.')[0];
    
    if (subdomain && subdomain !== 'api' && subdomain !== 'localhost' && subdomain !== 'www') {
      const tenant = await prisma.tenant.findUnique({
        where: { subdomain, deletedAt: null },
        select: { id: true }
      });
      resolvedTenantId = tenant?.id;
    }
  }

  if (!resolvedTenantId) {
    // If we still don't have a tenantId and it's not a root platform request, fail
    return next(new ForbiddenError('Tenant could not be resolved. Access restricted.'));
  }

  // 2. Verify tenant status
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { 
        id: resolvedTenantId,
        deletedAt: null 
      },
      select: { id: true, status: true }
    });

    if (!tenant) {
      return next(new ForbiddenError('Tenant not found'));
    }

    if (tenant.status !== 'ACTIVE') {
      return next(new ForbiddenError(`Tenant is ${tenant.status}`));
    }

    req.tenantId = tenant.id;
    next();
  } catch (error) {
    next(error);
  }
};
