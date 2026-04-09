import { Request, Response, NextFunction } from 'express';
import { feeService } from './fee.service';
import { FeeStatus, FeeType } from '@prisma/client';

const ctx = (req: Request) => ({
  tenantId: req.tenantId!,
  userId: req.user!.id,
  ipAddress: req.ip
});

export const feeController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        tenantId: req.tenantId!,
        unitId: req.query.unitId as string | undefined,
        status: req.query.status as FeeStatus | undefined,
        type: req.query.type as FeeType | undefined,
        periodFrom: req.query.periodFrom as string | undefined,
        periodTo: req.query.periodTo as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
      };
      
      const fees = await feeService.list(filters);
      res.status(200).json(fees);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fee = await feeService.findById(req.params.id, req.tenantId!);
      res.status(200).json(fee);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fee = await feeService.create(req.body, ctx(req));
      res.status(201).json(fee);
    } catch (error) {
      next(error);
    }
  },

  updateStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, paidAmount, notes } = req.body;
      const fee = await feeService.updateStatus(req.params.id, { status, paidAmount, notes }, ctx(req));
      res.status(200).json(fee);
    } catch (error) {
      next(error);
    }
  }
};
