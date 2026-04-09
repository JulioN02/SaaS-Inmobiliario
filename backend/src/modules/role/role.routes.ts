import { Router } from 'express';
import { roleController } from './role.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';

const router = Router();

router.get(
  '/',
  authMiddleware,
  tenantMiddleware,
  rbacMiddleware('roles', 'read'),
  roleController.list
);

export const roleRoutes = router;
