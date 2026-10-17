import { Router } from 'express';
import {
  StartAttemptSchema,
  SelectLanguageSchema,
  SaveAnswerSchema,
  IntegrityEventSchema,
} from '@techassess/shared';
import {
  startAttemptHandler,
  getAttemptStateHandler,
  saveAnswerHandler,
  recordIntegrityEventHandler,
  submitAttemptHandler,
  updateAttemptLanguageHandler,
} from './attempt.controller';
import { validateBody } from '../../middleware/validate';
import { attemptLimiter } from '../../middleware/rateLimiter';

const router = Router();
router.post('/start', attemptLimiter, validateBody(StartAttemptSchema), startAttemptHandler);
router.get('/:id', getAttemptStateHandler);
router.patch('/:id/language', validateBody(SelectLanguageSchema), updateAttemptLanguageHandler);
router.post('/:id/answers', validateBody(SaveAnswerSchema), saveAnswerHandler);
router.put('/:id/answers', validateBody(SaveAnswerSchema), saveAnswerHandler);
router.post('/:id/answers/:questionId', validateBody(SaveAnswerSchema), saveAnswerHandler);
router.put('/:id/answers/:questionId', validateBody(SaveAnswerSchema), saveAnswerHandler);
router.post(
  '/:id/integrity-events',
  validateBody(IntegrityEventSchema),
  recordIntegrityEventHandler
);
router.post('/:id/submit', submitAttemptHandler);

export const attemptRouter = router;
