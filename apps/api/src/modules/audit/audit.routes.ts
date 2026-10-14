import { Router } from 'express';
import { UserRole } from '@techassess/shared';
import { getAuditLogsHandler } from './audit.controller';
import { requireAuth, requireRole } from '../../middleware/auth';

const router = Router();

router.get('/', requireAuth, requireRole([UserRole.SUPER_ADMIN]), getAuditLogsHandler);

export const auditRouter = router;
