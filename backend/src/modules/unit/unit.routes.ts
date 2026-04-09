import { Router } from 'express';
import { unitController } from './unit.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';

// Two mount points in v1.routes.ts:
//   1. /units — tenant-wide listing + single fetch/update/delete
//   2. /properties/:propertyId/units — creation + listing scoped to property
const router = Router({ mergeParams: true });

router.use(authMiddleware, tenantMiddleware);

router.get('/',        rbacMiddleware('units', 'read'),   unitController.list);
router.get('/:id',    rbacMiddleware('units', 'read'),   unitController.show);
router.post('/',      rbacMiddleware('units', 'create'),  unitController.create);
router.patch('/:id',  rbacMiddleware('units', 'update'),  unitController.update);
router.delete('/:id', rbacMiddleware('units', 'delete'),  unitController.remove);

export const unitRoutes = router;
