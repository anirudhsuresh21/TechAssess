import { Request, Response, NextFunction } from 'express';
import {
  startAttempt,
  getAttemptState,
  saveCandidateAnswer,
  submitAttempt,
  recordAttemptIntegrityEvent,
} from './attempt.service';

export async function startAttemptHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { accessCode, candidateId } = req.body;
    const payload = await startAttempt(accessCode, candidateId);
    res.status(201).json({
      success: true,
      data: payload,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAttemptStateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = await getAttemptState(req.params.id);
    res.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    next(error);
  }
}

export async function saveAnswerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await saveCandidateAnswer(
      req.params.id,
      req.params.questionId,
      req.body
    );
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function recordIntegrityEventHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { eventType, durationMs, metadata } = req.body;
    const result = await recordAttemptIntegrityEvent(
      req.params.id,
      eventType,
      durationMs,
      metadata
    );
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function submitAttemptHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const isAutoExpired = req.body.isAutoExpired === true;
    const result = await submitAttempt(req.params.id, isAutoExpired);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
