import { Request, Response, NextFunction } from 'express';
import { IntegrityEvent } from './integrityEvent.model';
import { Attempt } from '../attempts/attempt.model';
import { AppError } from '../../middleware/errorHandler';

export async function getAttemptIntegrityEventsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const events = await IntegrityEvent.find({ attemptId: req.params.attemptId })
      .sort({ timestamp: 1 })
      .lean();

    const attempt = await Attempt.findById(req.params.attemptId).lean();

    res.json({
      success: true,
      data: {
        focusLossCount: attempt?.focusLossCount || 0,
        integrityFlagged: !!attempt?.integrityFlagged,
        events,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function acknowledgeIntegrityFlagHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { cleared, note } = req.body;
    const attempt = await Attempt.findByIdAndUpdate(
      req.params.attemptId,
      {
        $set: {
          integrityFlagged: !cleared,
          'metadata.integrityReviewNote': note || 'Flag acknowledged by administrator',
          'metadata.reviewedBy': req.user?.userId,
          'metadata.reviewedAt': new Date(),
        },
      },
      { new: true }
    );

    if (!attempt) {
      throw new AppError('Attempt not found', 404);
    }

    res.json({
      success: true,
      data: attempt,
    });
  } catch (error) {
    next(error);
  }
}
