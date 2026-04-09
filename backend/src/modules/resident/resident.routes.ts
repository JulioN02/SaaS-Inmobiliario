import { Router } from 'express';
import { residentController } from './resident.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/',        rbacMiddleware('residents', 'read'),   residentController.list);
router.get('/:id',    rbacMiddleware('residents', 'read'),   residentController.show);
router.post('/',      rbacMiddleware('residents', 'create'),  residentController.create);
router.patch('/:id',  rbacMiddleware('residents', 'update'),  residentController.update);
router.delete('/:id', rbacMiddleware('residents', 'delete'),  residentController.remove);

export const residentRoutes = router;
