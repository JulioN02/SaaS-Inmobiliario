import { Router } from 'express';
import { towerController } from './tower.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';

// Mounted at /properties/:propertyId/towers in v1.routes.ts
// Express mergeParams: true needed — applied in v1.routes.ts
const router = Router({ mergeParams: true });

router.use(authMiddleware, tenantMiddleware);

router.get('/',        rbacMiddleware('towers', 'read'),   towerController.list);
router.get('/:id',    rbacMiddleware('towers', 'read'),   towerController.show);
router.post('/',      rbacMiddleware('towers', 'create'),  towerController.create);
router.patch('/:id',  rbacMiddleware('towers', 'update'),  towerController.update);
router.delete('/:id', rbacMiddleware('towers', 'delete'),  towerController.remove);

export const towerRoutes = router;
