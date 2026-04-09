import { Request, Response, NextFunction } from 'express';
import { unitService } from './unit.service';
import { UnitStatus } from '@prisma/client';

const ctx = (req: Request) => ({
  userId: req.user!.id,
  tenantId: req.tenantId!,
  ipAddress: req.ip
});

export const unitController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId, towerId, status, page, limit } = req.query;
      const result = await unitService.list({
        tenantId: req.tenantId!,
        propertyId: propertyId as string | undefined,
        towerId: towerId as string | undefined,
        status: status as UnitStatus | undefined,
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
      const unit = await unitService.findById(req.params.id, req.tenantId!);
      res.status(200).json(unit);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyId, ...data } = req.body;
      const targetPropertyId = propertyId || req.params.propertyId;
      const unit = await unitService.create(targetPropertyId, data, ctx(req));
      res.status(201).json(unit);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unit = await unitService.update(req.params.id, req.body, ctx(req));
      res.status(200).json(unit);
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await unitService.remove(req.params.id, ctx(req));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
