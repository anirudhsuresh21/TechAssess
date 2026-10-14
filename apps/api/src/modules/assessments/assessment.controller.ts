import { Request, Response, NextFunction } from 'express';
import {
  createAssessment,
  getAssessments,
  getAssessmentById,
  updateAssessment,
  publishAssessment,
  archiveAssessment,
  duplicateAssessment,
} from './assessment.service';

export async function createAssessmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const assessment = await createAssessment(req.body, req.user?.userId, req.ip);
    res.status(201).json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAssessmentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, search, page, limit } = req.query;
    const result = await getAssessments({
      status: status as any,
      search: search as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
    });
    res.json({
      success: true,
      data: result.assessments,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAssessmentByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const assessment = await getAssessmentById(req.params.id);
    res.json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAssessmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const assessment = await updateAssessment(req.params.id, req.body, req.user?.userId, req.ip);
    res.json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
}

export async function publishAssessmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await publishAssessment(req.params.id, req.user?.userId, req.ip);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function archiveAssessmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const assessment = await archiveAssessment(req.params.id, req.user?.userId, req.ip);
    res.json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
}

export async function duplicateAssessmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const duplicated = await duplicateAssessment(req.params.id, req.user?.userId);
    res.status(201).json({
      success: true,
      data: duplicated,
    });
  } catch (error) {
    next(error);
  }
}
