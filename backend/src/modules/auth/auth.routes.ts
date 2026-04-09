import { Router } from 'express';
import { authController } from './auth.controller';
import { tenantMiddleware } from '../../middlewares/tenant.middleware';

const router = Router();

// Login requires tenant resolution (from host) but not authentication
router.post('/login', tenantMiddleware, authController.login);

export const authRoutes = router;
