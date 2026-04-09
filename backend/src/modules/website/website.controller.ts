import { Request, Response, NextFunction } from 'express';
import { websiteService } from './website.service';

export const websiteController = {
  getConfig: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = await websiteService.getConfig(req.tenantId!);
      res.status(200).json(config);
    } catch (error) {
      next(error);
    }
  },

  updateConfig: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = await websiteService.updateConfig(req.tenantId!, req.body);
      res.status(200).json(config);
    } catch (error) {
      next(error);
    }
  }
};
