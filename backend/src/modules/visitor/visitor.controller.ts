import { Request, Response, NextFunction } from 'express';
import { visitorService } from './visitor.service';

const ctx = (req: Request) => ({
  tenantId: req.tenantId!,
  userId: req.user!.id,
  ipAddress: req.ip
});

export const visitorController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        tenantId: req.tenantId!,
        unitId: req.query.unitId as string | undefined,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
      };
      
      const visitors = await visitorService.list(filters);
      res.status(200).json(visitors);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = {
        ...req.body,
        entryDate: new Date(req.body.entryDate)
      };
      const visitor = await visitorService.create(data, ctx(req));
      res.status(201).json(visitor);
    } catch (error) {
      next(error);
    }
  },

  checkout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { exitDate, notes } = req.body;
      const visitor = await visitorService.checkout(req.params.id, new Date(exitDate), notes, { tenantId: req.tenantId! });
      res.status(200).json(visitor);
    } catch (error) {
      next(error);
    }
  }
};
