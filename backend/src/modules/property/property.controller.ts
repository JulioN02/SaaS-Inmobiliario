import { Request, Response, NextFunction } from 'express';
import { propertyService } from './property.service';
import { PropertyType } from '@prisma/client';

const ctx = (req: Request) => ({
  userId: req.user!.id,
  tenantId: req.tenantId!,
  ipAddress: req.ip
});

export const propertyController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { propertyType, page, limit } = req.query;
      const result = await propertyService.list({
        tenantId: req.tenantId!,
        propertyType: propertyType as PropertyType | undefined,
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
      const property = await propertyService.findById(req.params.id, req.tenantId!);
      res.status(200).json(property);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await propertyService.create(req.body, ctx(req));
      res.status(201).json(property);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await propertyService.update(req.params.id, req.body, ctx(req));
      res.status(200).json(property);
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await propertyService.remove(req.params.id, ctx(req));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
