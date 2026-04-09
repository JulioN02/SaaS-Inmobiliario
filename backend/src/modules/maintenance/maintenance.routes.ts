import { Router } from 'express';
import { maintenanceController } from './maintenance.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/', rbacMiddleware('maintenance', 'read'), maintenanceController.list);
router.post('/', rbacMiddleware('maintenance', 'create'), maintenanceController.create);

router.get('/:id', rbacMiddleware('maintenance', 'read'), maintenanceController.getById);
router.patch('/:id', rbacMiddleware('maintenance', 'update'), maintenanceController.update);

export const maintenanceRoutes = router;
