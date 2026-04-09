import { Request, Response, NextFunction } from 'express';
import { metricsService } from './metrics.service';

export const metricsController = {
  getMetrics: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const metrics = await metricsService.getGlobalMetrics();
      res.status(200).json(metrics);
    } catch (error) {
      next(error);
    }
  }
};
