import { Request, Response, NextFunction } from 'express';
import { residentService } from './resident.service';

const ctx = (req: Request) => ({
  userId: req.user!.id,
  tenantId: req.tenantId!,
  ipAddress: req.ip
});

export const residentController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = req.query;
      const result = await residentService.list({
        tenantId: req.tenantId!,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  show: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resident = await residentService.findById(req.params.id, req.tenantId!);
      res.status(200).json(resident);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resident = await residentService.create(req.body, ctx(req));
      res.status(201).json(resident);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resident = await residentService.update(req.params.id, req.body, ctx(req));
      res.status(200).json(resident);
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await residentService.remove(req.params.id, ctx(req));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
