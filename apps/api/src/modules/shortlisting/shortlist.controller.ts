import { Request, Response, NextFunction } from 'express';
import {
  setCandidateShortlist,
  bulkShortlistCandidates,
  getShortlistSummary,
  exportShortlistCsv,
} from './shortlist.service';

export async function setCandidateShortlistHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, reviewerNotes } = req.body;
    const decision = await setCandidateShortlist(
      req.params.assessmentId,
      req.params.candidateId,
      status,
      reviewerNotes,
      req.user?.userId,
      req.ip
    );
    res.json({
      success: true,
      data: decision,
    });
  } catch (error) {
    next(error);
  }
}

export async function bulkShortlistHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await bulkShortlistCandidates(
      req.params.assessmentId,
      req.body,
      req.user?.userId,
      req.ip
    );
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getShortlistSummaryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await getShortlistSummary(req.params.assessmentId);
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
}

export async function exportShortlistCsvHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const csv = await exportShortlistCsv(req.params.assessmentId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="shortlist_${req.params.assessmentId}.csv"`
    );
    res.send(csv);
  } catch (error) {
    next(error);
  }
}
