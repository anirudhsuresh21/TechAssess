import { AuditAction } from '@techassess/shared';
import { AuditLog, IAuditLog } from './auditLog.model';
import { logger } from '../../utils/logger';

interface RecordAuditParams {
  userId?: any;
  userEmail?: string;
  role?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function recordAudit(params: RecordAuditParams): Promise<IAuditLog | null> {
  try {
    // Sanitize details to never log passwords or tokens
    const cleanDetails = { ...params.details };
    delete cleanDetails.password;
    delete cleanDetails.token;
    delete cleanDetails.passwordHash;

    const log = await AuditLog.create({
      ...params,
      details: cleanDetails,
    });
    return log;
  } catch (error: any) {
    logger.error('Failed to write audit log', { error: error.message });
    return null;
  }
}

export async function getAuditLogs(filter: {
  page?: number;
  limit?: number;
  action?: AuditAction;
  resourceType?: string;
}) {
  const page = Math.max(1, filter.page || 1);
  const limit = Math.min(100, Math.max(1, filter.limit || 20));
  const skip = (page - 1) * limit;

  const query: any = {};
  if (filter.action) query.action = filter.action;
  if (filter.resourceType) query.resourceType = filter.resourceType;

  const [logs, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(query),
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
