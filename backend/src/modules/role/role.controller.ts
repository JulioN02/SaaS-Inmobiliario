import { Request, Response, NextFunction } from 'express';
import { roleService } from './role.service';

export const roleController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roles = await roleService.getRoles();
      res.status(200).json(roles);
    } catch (error) {
      next(error);
    }
  }
};
