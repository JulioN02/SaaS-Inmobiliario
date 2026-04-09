import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';

const ctx = (req: Request) => ({
  userId: req.user!.id,
  tenantId: req.tenantId!,
  ipAddress: req.ip
});

export const userController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { isActive, page, limit } = req.query;
      const result = await userService.list({
        tenantId: req.tenantId!,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
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
      const user = await userService.findById(req.params.id, req.tenantId!);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.create(req.body, ctx(req));
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.update(req.params.id, req.body, ctx(req));
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },

  suspend: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.suspend(req.params.id, ctx(req));
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },

  activate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.activate(req.params.id, ctx(req));
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await userService.remove(req.params.id, ctx(req));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
