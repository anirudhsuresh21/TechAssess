import { Router } from 'express';
import multer from 'multer';
import { CreateQuestionSchema, UpdateQuestionSchema } from '@techassess/shared';
import {
  createQuestionHandler,
  getQuestionsHandler,
  getQuestionByIdHandler,
  updateQuestionHandler,
  archiveQuestionHandler,
  duplicateQuestionHandler,
  downloadTemplateHandler,
  validateImportHandler,
  importQuestionsHandler,
} from './question.controller';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get('/template', downloadTemplateHandler);
router.post('/import/validate', requireAuth, upload.single('file'), validateImportHandler);
router.post('/validate-import', requireAuth, upload.single('file'), validateImportHandler);
router.post('/import/commit', requireAuth, upload.single('file'), importQuestionsHandler);
router.post('/import', requireAuth, upload.single('file'), importQuestionsHandler);

router.post('/', requireAuth, validateBody(CreateQuestionSchema), createQuestionHandler);
router.get('/', requireAuth, getQuestionsHandler);
router.get('/:id', requireAuth, getQuestionByIdHandler);
router.patch('/:id', requireAuth, validateBody(UpdateQuestionSchema), updateQuestionHandler);
router.post('/:id/archive', requireAuth, archiveQuestionHandler);
router.post('/:id/duplicate', requireAuth, duplicateQuestionHandler);

export const questionRouter = router;
