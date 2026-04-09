import { Router } from 'express';
import { visitorController } from './visitor.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', rbacMiddleware('visitors', 'read'), visitorController.list);
router.post('/', rbacMiddleware('visitors', 'create'), visitorController.create);
router.patch('/:id/checkout', rbacMiddleware('visitors', 'update'), visitorController.checkout);

export const visitorRoutes = router;
