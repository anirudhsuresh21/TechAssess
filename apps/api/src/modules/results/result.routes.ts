import { Router } from 'express';
import {
  getAssessmentResultsHandler,
  getAssessmentAnalyticsHandler,
  exportAssessmentResultsCsvHandler,
  getAttemptResultDetailHandler,
  submitManualReviewHandler,
} from './result.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

router.get('/assessments/:id/results', requireAuth, getAssessmentResultsHandler);
router.get('/assessments/:id/analytics', requireAuth, getAssessmentAnalyticsHandler);
router.get('/assessments/:id/export', requireAuth, exportAssessmentResultsCsvHandler);
router.get('/attempts/:attemptId', requireAuth, getAttemptResultDetailHandler);
router.patch('/:id/review', requireAuth, submitManualReviewHandler);

export const resultRouter = router;
