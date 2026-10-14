import { Request, Response, NextFunction } from 'express';
import { validateAccessCode, registerCandidate } from './candidate.service';

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
