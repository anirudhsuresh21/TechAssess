import { Request, Response, NextFunction } from 'express';
import { getAuditLogs } from './audit.service';

export async function getAuditLogsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, action, resourceType } = req.query;
    const result = await getAuditLogs({
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 25,
      action: action as any,
      resourceType: resourceType as string,
    });
    res.json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}
