import { Request, Response, NextFunction } from 'express';
import { auditQueryService } from './audit.service';
import { AuditAction, AuditEntity } from '@prisma/client';

export const auditController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entity, action, userId, from, to, page, limit } = req.query;

      const result = await auditQueryService.list({
        tenantId: req.tenantId!,
        entity: entity as AuditEntity | undefined,
        action: action as AuditAction | undefined,
        userId: userId as string | undefined,
        from: from ? new Date(from as string) : undefined,
        to: to ? new Date(to as string) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};
