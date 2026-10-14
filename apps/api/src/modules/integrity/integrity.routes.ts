import { Router } from 'express';
import {
  getAttemptIntegrityEventsHandler,
  acknowledgeIntegrityFlagHandler,
} from './integrity.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.get('/attempts/:attemptId', requireAuth, getAttemptIntegrityEventsHandler);
router.post('/attempts/:attemptId/review', requireAuth, acknowledgeIntegrityFlagHandler);

export const integrityRouter = router;
