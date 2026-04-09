import { Router } from 'express';
import { auditController } from './audit.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', rbacMiddleware('audit', 'read'), auditController.list);

export const auditRoutes = router;
