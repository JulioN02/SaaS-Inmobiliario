import { Router } from 'express';
import { metricsController } from './metrics.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { rbacMiddleware } from '../../middlewares/rbac.middleware';

const router = Router();

// Only SUPER_ADMIN can access metrics
router.use(authMiddleware);

router.get('/', rbacMiddleware('metrics', 'read'), metricsController.getMetrics);

export const metricsRoutes = router;
