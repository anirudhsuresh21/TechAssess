import { Request, Response, NextFunction } from 'express';
import { executeCandidateCode } from './codeRunner.service';

export async function runCodeHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { code, testCases } = req.body;
    // Only allow public test cases in candidate run
    const publicCases = (testCases || []).filter((tc: any) => !tc.isHidden);
    const result = await executeCandidateCode(code, publicCases);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
