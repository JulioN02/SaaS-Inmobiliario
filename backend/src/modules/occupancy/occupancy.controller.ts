import { Request, Response, NextFunction } from 'express';
import { occupancyService } from './occupancy.service';

const ctx = (req: Request) => ({
  userId: req.user!.id,
  tenantId: req.tenantId!,
  ipAddress: req.ip
});

export const occupancyController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { unitId, residentId, active, page, limit } = req.query;
      const result = await occupancyService.list({
        tenantId: req.tenantId!,
        unitId:     unitId as string | undefined,
        residentId: residentId as string | undefined,
        active:     active !== undefined ? active === 'true' : undefined,
        page:  page  ? Number(page)  : undefined,
        limit: limit ? Number(limit) : undefined
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  show: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const occupancy = await occupancyService.findById(req.params.id, req.tenantId!);
      res.status(200).json(occupancy);
    } catch (error) {
      next(error);
    }
  },

  open: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const occupancy = await occupancyService.open(req.body, ctx(req));
      res.status(201).json(occupancy);
    } catch (error) {
      next(error);
    }
  },

  close: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const occupancy = await occupancyService.close(req.params.id, req.body, ctx(req));
      res.status(200).json(occupancy);
    } catch (error) {
      next(error);
    }
  }
};
