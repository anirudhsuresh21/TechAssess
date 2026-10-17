import { Router } from 'express';
import {
  CandidateRegisterSchema,
  CandidateLoginSchema,
  AdminAddCandidateSchema,
  AdminAssignSetSchema,
} from '@techassess/shared';
import {
  validateAccessCodeHandler,
  registerCandidateHandler,
  candidateLoginHandler,
  getCandidatesForAssessmentHandler,
  addCandidateHandler,
  bulkAddCandidatesHandler,
  assignCandidateSetHandler,
  autoAssignSetsHandler,
  deleteCandidateHandler,
} from './candidate.controller';
import { validateBody } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';
import { z } from 'zod';

const router = Router();

const ValidateCodeSchema = z.object({
  code: z.string().min(4),
});

// Candidate facing routes
router.post('/validate-access-code', authLimiter, validateBody(ValidateCodeSchema), validateAccessCodeHandler);
router.post('/register', authLimiter, validateBody(CandidateRegisterSchema), registerCandidateHandler);
router.post('/login', authLimiter, validateBody(CandidateLoginSchema), candidateLoginHandler);

// Admin candidate roster & set assignment routes
router.get('/assessment/:accessCode', requireAuth, getCandidatesForAssessmentHandler);
router.post('/assessment/:accessCode', requireAuth, validateBody(AdminAddCandidateSchema), addCandidateHandler);
router.post('/assessment/:accessCode/bulk', requireAuth, bulkAddCandidatesHandler);
router.patch('/:candidateId/set', requireAuth, validateBody(AdminAssignSetSchema), assignCandidateSetHandler);
router.post('/assessment/:accessCode/auto-assign-sets', requireAuth, autoAssignSetsHandler);
router.delete('/:candidateId', requireAuth, deleteCandidateHandler);

export const candidateRouter = router;
