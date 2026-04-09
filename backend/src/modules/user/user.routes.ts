import { Router } from 'express';
import { userController } from './user.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/',        rbacMiddleware('users', 'read'),   userController.list);
router.get('/:id',    rbacMiddleware('users', 'read'),   userController.show);
router.post('/',      rbacMiddleware('users', 'create'),  userController.create);
router.patch('/:id',  rbacMiddleware('users', 'update'),  userController.update);
router.delete('/:id', rbacMiddleware('users', 'delete'),  userController.remove);

router.post('/:id/suspend',  rbacMiddleware('users', 'update'), userController.suspend);
router.post('/:id/activate', rbacMiddleware('users', 'update'), userController.activate);

export const userRoutes = router;
