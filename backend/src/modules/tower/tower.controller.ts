import { Request, Response, NextFunction } from 'express';
import { towerService } from './tower.service';

const ctx = (req: Request) => ({
  userId: req.user!.id,
  tenantId: req.tenantId!,
  ipAddress: req.ip
});

export const towerController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = req.query;
      const result = await towerService.list({
        tenantId: req.tenantId!,
        propertyId: req.params.propertyId,
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
      const tower = await towerService.findById(req.params.id, req.tenantId!);
      res.status(200).json(tower);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tower = await towerService.create(req.params.propertyId, req.body, ctx(req));
      res.status(201).json(tower);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tower = await towerService.update(req.params.id, req.body, ctx(req));
      res.status(200).json(tower);
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await towerService.remove(req.params.id, ctx(req));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
