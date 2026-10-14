import { Router } from 'express';
import { LoginSchema, RegisterUserSchema, UserRole } from '@techassess/shared';
import {
  loginHandler,
  logoutHandler,
  getMeHandler,
  registerAdminHandler,
} from './auth.controller';
import { validateBody } from '../../middleware/validate';
import { requireAuth, requireRole } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/login', authLimiter, validateBody(LoginSchema), loginHandler);
router.post('/logout', logoutHandler);
router.get('/me', requireAuth, getMeHandler);
router.post(
  '/register-admin',
  requireAuth,
  requireRole([UserRole.SUPER_ADMIN]),
  validateBody(RegisterUserSchema),
  registerAdminHandler
);

export const authRouter = router;
