import { Request, Response, NextFunction } from 'express';
import {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  archiveQuestion,
  duplicateQuestion,
} from './question.service';
import {
  generateCsvTemplate,
  parseAndValidateQuestions,
  bulkInsertQuestions,
} from './question.import';
import { AppError } from '../../middleware/errorHandler';

export async function createQuestionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const question = await createQuestion(req.body, req.user?.userId, req.ip);
    res.status(201).json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
}

export async function getQuestionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, difficulty, type, topic, search, page, limit, isArchived } = req.query;
    const result = await getQuestions({
      category: category as any,
      difficulty: difficulty as any,
      type: type as any,
      topic: topic as string,
      search: search as string,
      isArchived: isArchived !== undefined ? isArchived === 'true' : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });
    res.json({
      success: true,
      data: result.questions,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getQuestionByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const question = await getQuestionById(req.params.id);
    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateQuestionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const question = await updateQuestion(req.params.id, req.body);
    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
}

export async function archiveQuestionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const question = await archiveQuestion(req.params.id);
    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
}

export async function duplicateQuestionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const question = await duplicateQuestion(req.params.id, req.user?.userId);
    res.status(201).json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadTemplateHandler(req: Request, res: Response) {
  const csv = generateCsvTemplate();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="techassess_question_template.csv"');
  res.send(csv);
}

export async function validateImportHandler(req: Request, res: Response, next: NextFunction) {
  try {
    let content = '';
    if (req.file) {
      content = req.file.buffer.toString('utf-8');
    } else if (req.body && req.body.csvContent) {
      content = req.body.csvContent;
    } else {
      throw new AppError('No CSV content or file provided for import validation', 400);
    }

    const { validQuestions, errors } = parseAndValidateQuestions(content);
    res.json({
      success: true,
      data: {
        totalParsed: validQuestions.length + errors.length,
        validCount: validQuestions.length,
        errorCount: errors.length,
        errors,
        preview: validQuestions.slice(0, 5),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function importQuestionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    let content = '';
    if (req.file) {
      content = req.file.buffer.toString('utf-8');
    } else if (req.body && req.body.csvContent) {
      content = req.body.csvContent;
    } else if (Array.isArray(req.body.questions)) {
      const inserted = await bulkInsertQuestions(req.body.questions, req.user?.userId, req.ip);
      return res.status(201).json({
        success: true,
        data: {
          insertedCount: inserted.length,
          inserted,
        },
      });
    } else {
      throw new AppError('No questions or CSV file provided for import', 400);
    }

    const { validQuestions, errors } = parseAndValidateQuestions(content);
    if (errors.length > 0 && !req.body.ignoreErrors) {
      return res.status(400).json({
        success: false,
        error: `Import file contains ${errors.length} validation errors. Fix them or pass ignoreErrors=true to import valid rows only.`,
        errors,
      });
    }

    if (validQuestions.length === 0) {
      throw new AppError('No valid questions found to import', 400);
    }

    const inserted = await bulkInsertQuestions(validQuestions, req.user?.userId, req.ip);
    res.status(201).json({
      success: true,
      data: {
        insertedCount: inserted.length,
        errorsCount: errors.length,
        inserted,
      },
    });
  } catch (error) {
    next(error);
  }
}
