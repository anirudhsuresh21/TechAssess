import { Router } from 'express';
import { runCodeHandler } from './codeRunner.controller';
import { attemptLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/run', attemptLimiter, runCodeHandler);

export const codeRunnerRouter = router;
