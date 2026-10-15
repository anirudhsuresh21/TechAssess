import { Request, Response, NextFunction } from 'express';
import {
  getAssessmentResults,
  getAssessmentAnalytics,
  exportAssessmentResultsCsv,
  getAttemptResultDetail,
  submitManualReview,
} from './result.service';

export async function getAssessmentResultsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, shortlistStatus, set, page, limit, sortBy, sortOrder } = req.query;
    const data = await getAssessmentResults(req.params.id, {
      search: search as string,
      shortlistStatus: shortlistStatus as any,
      set: set as string,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      sortBy: sortBy as string,
      sortOrder: sortOrder as any,
    });
    res.json({
      success: true,
      data: data.results,
      pagination: data.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAssessmentAnalyticsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getAssessmentAnalytics(req.params.id);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function exportAssessmentResultsCsvHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const csv = await exportAssessmentResultsCsv(req.params.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="assessment_${req.params.id}_results.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
}

export async function getAttemptResultDetailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getAttemptResultDetail(req.params.attemptId);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function submitManualReviewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { questionId, awardedMarks, comments } = req.body;
    const reviewerId = req.user?.userId || '';
    const result = await submitManualReview(
      req.params.id,
      questionId,
      awardedMarks,
      reviewerId,
      comments
    );
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
