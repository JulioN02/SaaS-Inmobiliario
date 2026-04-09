import { Request, Response, NextFunction } from 'express';
import { announcementService } from './announcement.service';
import { UserRole } from '@prisma/client';

const ctx = (req: Request) => ({
  tenantId: req.tenantId!,
  userId: req.user!.id,
  ipAddress: req.ip
});

export const announcementController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // By default filter by the user's role unless they are an admin requesting all
      const filters = {
        tenantId: req.tenantId!,
        role: ['ADMIN_TENANT', 'SUPER_ADMIN'].includes(req.user!.role) ? undefined : req.user!.role as UserRole,
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
      };
      
      const announcements = await announcementService.list(filters);
      res.status(200).json(announcements);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const announcement = await announcementService.findById(req.params.id, req.tenantId!);
      res.status(200).json(announcement);
    } catch (error) {
      next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const announcement = await announcementService.create(req.body, ctx(req));
      res.status(201).json(announcement);
    } catch (error) {
      next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, body, targetRoles } = req.body;
      const announcement = await announcementService.update(req.params.id, { title, body, targetRoles }, ctx(req));
      res.status(200).json(announcement);
    } catch (error) {
      next(error);
    }
  },
  
  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await announcementService.delete(req.params.id, ctx(req));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
};
