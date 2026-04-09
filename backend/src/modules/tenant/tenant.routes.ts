import { Router } from 'express';
import { tenantController } from './tenant.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';

const router = Router();

// All tenant routes require auth. SUPER_ADMIN bypasses regular RBAC via DB check.
router.use(authMiddleware, tenantMiddleware);

router.get('/',       rbacMiddleware('tenants', 'read'),   tenantController.list);
router.get('/:id',   rbacMiddleware('tenants', 'read'),   tenantController.show);
router.post('/',     rbacMiddleware('tenants', 'create'),  tenantController.create);
router.patch('/:id', rbacMiddleware('tenants', 'update'),  tenantController.update);
router.delete('/:id',rbacMiddleware('tenants', 'delete'),  tenantController.remove);

router.post('/:id/suspend',  rbacMiddleware('tenants', 'update'), tenantController.suspend);
router.post('/:id/activate', rbacMiddleware('tenants', 'update'), tenantController.activate);
router.patch('/:id/plan',    rbacMiddleware('tenants', 'update'), tenantController.changePlan);

export const tenantRoutes = router;
