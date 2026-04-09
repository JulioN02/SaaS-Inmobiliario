import { Router } from 'express';
import { websiteController } from './website.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', rbacMiddleware('website', 'read'), websiteController.getConfig);
router.patch('/', rbacMiddleware('website', 'update'), websiteController.updateConfig);

export const websiteRoutes = router;
