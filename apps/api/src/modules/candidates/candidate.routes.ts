import { Router } from 'express';
import { CandidateRegisterSchema } from '@techassess/shared';
import {
  validateAccessCodeHandler,
  registerCandidateHandler,
} from './candidate.controller';
import { validateBody } from '../../middleware/validate';
import { authLimiter } from '../../middleware/rateLimiter';
import { z } from 'zod';

const router = Router();

const ValidateCodeSchema = z.object({
  code: z.string().min(4),
});

router.post('/validate-access-code', authLimiter, validateBody(ValidateCodeSchema), validateAccessCodeHandler);
router.post('/register', authLimiter, validateBody(CandidateRegisterSchema), registerCandidateHandler);

export const candidateRouter = router;
