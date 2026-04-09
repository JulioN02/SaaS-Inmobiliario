import { Request, Response, NextFunction } from 'express';
import { tenantService } from './tenant.service';
import { TenantPlan, TenantStatus } from '@prisma/client';

const ctx = (req: Request) => ({
  userId: req.user!.id,
  ipAddress: req.ip
});

export const tenantController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, plan, page, limit } = req.query;
      const result = await tenantService.list({
        status: status as TenantStatus | undefined,
        plan: plan as TenantPlan | undefined,
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
      const tenant = await tenantService.findById(req.params.id);
      res.status(200).json(tenant);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await tenantService.create(req.body, ctx(req));
      res.status(201).json(tenant);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await tenantService.update(req.params.id, req.body, ctx(req));
      res.status(200).json(tenant);
    } catch (error) {
      next(error);
    }
  },

  suspend: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await tenantService.suspend(req.params.id, ctx(req));
      res.status(200).json(tenant);
    } catch (error) {
      next(error);
    }
  },

  activate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await tenantService.activate(req.params.id, ctx(req));
      res.status(200).json(tenant);
    } catch (error) {
      next(error);
    }
  },

  changePlan: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await tenantService.changePlan(req.params.id, req.body.plan, ctx(req));
      res.status(200).json(tenant);
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await tenantService.remove(req.params.id, ctx(req));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
