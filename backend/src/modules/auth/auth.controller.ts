import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';

export const authController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const tenantId = req.tenantId; // Resolved by middleware

      const result = await authService.login(email, password, tenantId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
};
