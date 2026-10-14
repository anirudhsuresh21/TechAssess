import { Router } from 'express';
import { CreateAssessmentSchema, UpdateAssessmentSchema } from '@techassess/shared';
import {
  createAssessmentHandler,
  getAssessmentsHandler,
  getAssessmentByIdHandler,
  updateAssessmentHandler,
  publishAssessmentHandler,
  archiveAssessmentHandler,
  duplicateAssessmentHandler,
} from './assessment.controller';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';

const router = Router();

router.post('/', requireAuth, validateBody(CreateAssessmentSchema), createAssessmentHandler);
router.get('/', requireAuth, getAssessmentsHandler);
router.get('/:id', requireAuth, getAssessmentByIdHandler);
router.patch('/:id', requireAuth, validateBody(UpdateAssessmentSchema), updateAssessmentHandler);
router.post('/:id/publish', requireAuth, publishAssessmentHandler);
router.post('/:id/archive', requireAuth, archiveAssessmentHandler);
router.post('/:id/duplicate', requireAuth, duplicateAssessmentHandler);

export const assessmentRouter = router;
