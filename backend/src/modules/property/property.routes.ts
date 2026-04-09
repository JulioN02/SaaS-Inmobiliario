import { Router } from 'express';
import { propertyController } from './property.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/',        rbacMiddleware('properties', 'read'),   propertyController.list);
router.get('/:id',    rbacMiddleware('properties', 'read'),   propertyController.show);
router.post('/',      rbacMiddleware('properties', 'create'),  propertyController.create);
router.patch('/:id',  rbacMiddleware('properties', 'update'),  propertyController.update);
router.delete('/:id', rbacMiddleware('properties', 'delete'),  propertyController.remove);

export const propertyRoutes = router;
