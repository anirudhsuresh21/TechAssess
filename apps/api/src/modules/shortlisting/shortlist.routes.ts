import { Router } from 'express';
import {
  ShortlistCandidateSchema,
  BulkShortlistCriteriaSchema,
} from '@techassess/shared';
import {
  setCandidateShortlistHandler,
  bulkShortlistHandler,
  getShortlistSummaryHandler,
  exportShortlistCsvHandler,
} from './shortlist.controller';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';

const router = Router();

router.get('/assessments/:assessmentId/summary', requireAuth, getShortlistSummaryHandler);
router.get('/assessments/:assessmentId/export', requireAuth, exportShortlistCsvHandler);
router.post(
  '/assessments/:assessmentId/candidates/:candidateId',
  requireAuth,
  validateBody(ShortlistCandidateSchema),
  setCandidateShortlistHandler
);
router.post(
  '/assessments/:assessmentId/bulk',
  requireAuth,
  validateBody(BulkShortlistCriteriaSchema),
  bulkShortlistHandler
);

export const shortlistRouter = router;
