import { Request, Response, NextFunction } from 'express';
import {
  validateAccessCode,
  registerCandidate,
  candidateLogin,
  getCandidatesForAssessment,
  addCandidateToAssessment,
  bulkAddCandidatesToAssessment,
  assignCandidateSet,
  autoAssignSetsAlternating,
  deleteCandidate,
} from './candidate.service';

export async function validateAccessCodeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { code } = req.body;
    const info = await validateAccessCode(code);
    res.json({
      success: true,
      data: info,
    });
  } catch (error) {
    next(error);
  }
}

export async function registerCandidateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await registerCandidate(req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function candidateLoginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await candidateLogin(req.body);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCandidatesForAssessmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await getCandidatesForAssessment(req.params.accessCode);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function addCandidateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await addCandidateToAssessment(req.params.accessCode, req.body);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function bulkAddCandidatesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const candidates = Array.isArray(req.body) ? req.body : req.body.candidates;
    const result = await bulkAddCandidatesToAssessment(req.params.accessCode, candidates);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function assignCandidateSetHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await assignCandidateSet(req.params.candidateId, req.body.assignedSet);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function autoAssignSetsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await autoAssignSetsAlternating(req.params.accessCode);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCandidateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await deleteCandidate(req.params.candidateId);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
