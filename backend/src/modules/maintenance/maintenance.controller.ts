import { Request, Response, NextFunction } from 'express';
import { maintenanceService } from './maintenance.service';
import { MaintenanceStatus } from '@prisma/client';

const ctx = (req: Request) => ({
  tenantId: req.tenantId!,
  userId: req.user!.id,
  ipAddress: req.ip
});

export const maintenanceController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        tenantId: req.tenantId!,
        unitId: req.query.unitId as string | undefined,
        status: req.query.status as MaintenanceStatus | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
      };
      
      const requests = await maintenanceService.list(filters);
      res.status(200).json(requests);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await maintenanceService.findById(req.params.id, req.tenantId!);
      res.status(200).json(request);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await maintenanceService.create(req.body, ctx(req));
      res.status(201).json(request);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, assignedTo, description } = req.body;
      const request = await maintenanceService.update(req.params.id, { status, assignedTo, description }, ctx(req));
      res.status(200).json(request);
    } catch (error) {
      next(error);
    }
  }
};
