import { Router } from 'express';
import { announcementController } from './announcement.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', rbacMiddleware('announcements', 'read'), announcementController.list);
router.post('/', rbacMiddleware('announcements', 'create'), announcementController.create);

router.get('/:id', rbacMiddleware('announcements', 'read'), announcementController.getById);
router.patch('/:id', rbacMiddleware('announcements', 'update'), announcementController.update);
router.delete('/:id', rbacMiddleware('announcements', 'delete'), announcementController.delete);

export const announcementRoutes = router;
