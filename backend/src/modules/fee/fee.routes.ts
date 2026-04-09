import { Router } from 'express';
import { feeController } from './fee.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', rbacMiddleware('fees', 'read'), feeController.list);
router.post('/', rbacMiddleware('fees', 'create'), feeController.create);

router.get('/:id', rbacMiddleware('fees', 'read'), feeController.getById);
router.patch('/:id/status', rbacMiddleware('fees', 'update'), feeController.updateStatus);

export const feeRoutes = router;
