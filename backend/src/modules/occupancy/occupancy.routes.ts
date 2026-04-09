import { Router } from 'express';
import { occupancyController } from './occupancy.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authMiddleware, tenantMiddleware);

router.get('/',                rbacMiddleware('occupancies', 'read'),   occupancyController.list);
router.get('/:id',            rbacMiddleware('occupancies', 'read'),   occupancyController.show);
router.post('/',              rbacMiddleware('occupancies', 'create'),  occupancyController.open);
router.patch('/:id/close',   rbacMiddleware('occupancies', 'update'),  occupancyController.close);

export const occupancyRoutes = router;
