import mongoose from 'mongoose';
import { stringify } from 'csv-stringify/sync';
import { ShortlistStatus, AuditAction } from '@techassess/shared';
import { ShortlistDecision, IShortlistDecision } from './shortlist.model';
import { Attempt } from '../attempts/attempt.model';
import { Candidate } from '../candidates/candidate.model';
import { Assessment } from '../assessments/assessment.model';
import { recordAudit } from '../audit/audit.service';
import { AppError } from '../../middleware/errorHandler';

export async function setCandidateShortlist(
  assessmentId: string,
  candidateId: string,
  status: ShortlistStatus,
  reviewerNotes: string = '',
  userId?: string,
  ipAddress?: string
) {
  const assessmentObjId = new mongoose.Types.ObjectId(assessmentId);
  const candidateObjId = new mongoose.Types.ObjectId(candidateId);

  const decision = await ShortlistDecision.findOneAndUpdate(
    { assessmentId: assessmentObjId, candidateId: candidateObjId },
    {
      $set: {
        status,
        reviewerNotes,
        decidedBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
        decidedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (userId) {
    await recordAudit({
      userId: new mongoose.Types.ObjectId(userId),
      action: AuditAction.SHORTLIST_DECISION_UPDATED,
      resourceType: 'ShortlistDecision',
      resourceId: decision._id.toString(),
      details: { candidateId, status, reviewerNotes },
      ipAddress,
    });
  }

  return decision;
}

export async function bulkShortlistCandidates(
  assessmentId: string,
  criteria: {
    minTotalScore?: number;
    minPercentage?: number;
    maxIntegrityWarnings?: number;
  },
  userId?: string,
  ipAddress?: string
) {
  const assessmentObjId = new mongoose.Types.ObjectId(assessmentId);

  const query: any = {
    assessmentId: assessmentObjId,
    status: { $in: ['SUBMITTED', 'EVALUATED'] },
  };

  if (criteria.minTotalScore !== undefined) {
    query.obtainedMarks = { $gte: criteria.minTotalScore };
  }
  if (criteria.minPercentage !== undefined) {
    query.percentage = { $gte: criteria.minPercentage };
  }
  if (criteria.maxIntegrityWarnings !== undefined) {
    query.focusLossCount = { $lte: criteria.maxIntegrityWarnings };
  }

  const matchingAttempts = await Attempt.find(query).lean();
  let updatedCount = 0;

  for (const att of matchingAttempts) {
    await ShortlistDecision.findOneAndUpdate(
      { assessmentId: assessmentObjId, candidateId: att.candidateId },
      {
        $set: {
          status: ShortlistStatus.SHORTLISTED,
          reviewerNotes: `Auto-shortlisted based on cutoff: score >= ${criteria.minTotalScore ?? 0}`,
          decidedBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
          decidedAt: new Date(),
        },
      },
      { upsert: true }
    );
    updatedCount++;
  }

  if (userId) {
    await recordAudit({
      userId: new mongoose.Types.ObjectId(userId),
      action: AuditAction.SHORTLIST_DECISION_UPDATED,
      resourceType: 'Assessment',
      resourceId: assessmentId,
      details: { action: 'BULK_SHORTLIST', updatedCount, criteria },
      ipAddress,
    });
  }

  return {
    matchingCount: matchingAttempts.length,
    updatedCount,
  };
}

export async function getShortlistSummary(assessmentId: string) {
  const assessmentObjId = new mongoose.Types.ObjectId(assessmentId);

  const [total, shortlisted, rejected, pending] = await Promise.all([
    Candidate.countDocuments({
      accessCode: (await Assessment.findById(assessmentObjId))?.code || '',
    }),
    ShortlistDecision.countDocuments({
      assessmentId: assessmentObjId,
      status: ShortlistStatus.SHORTLISTED,
    }),
    ShortlistDecision.countDocuments({
      assessmentId: assessmentObjId,
      status: ShortlistStatus.REJECTED,
    }),
    ShortlistDecision.countDocuments({
      assessmentId: assessmentObjId,
      status: ShortlistStatus.PENDING,
    }),
  ]);

  return {
    total,
    shortlisted,
    rejected,
    pending,
  };
}

export async function exportShortlistCsv(assessmentId: string): Promise<string> {
  const assessmentObjId = new mongoose.Types.ObjectId(assessmentId);
  const decisions = await ShortlistDecision.find({
    assessmentId: assessmentObjId,
    status: ShortlistStatus.SHORTLISTED,
  })
    .populate('candidateId')
    .lean();

  const candidateIds = decisions.map((d: any) => d.candidateId?._id);
  const attempts = await Attempt.find({
    assessmentId: assessmentObjId,
    candidateId: { $in: candidateIds },
  }).lean();

  const attemptMap = new Map<string, any>();
  attempts.forEach((a) => attemptMap.set(a.candidateId.toString(), a));

  const headers = [
    'Roll Number',
    'Full Name',
    'Division',
    'Email',
    'Score',
    'Percentage',
    'Integrity Flagged',
    'Reviewer Notes',
    'Shortlisted On',
  ];

  const rows = decisions.map((d: any) => {
    const cand = d.candidateId;
    const att = cand ? attemptMap.get(cand._id.toString()) : null;
    return [
      cand?.rollNumber || '',
      cand?.name || '',
      cand?.division || '',
      cand?.email || '',
      att?.obtainedMarks ?? 'N/A',
      att ? `${att.percentage}%` : 'N/A',
      att?.integrityFlagged ? 'YES' : 'NO',
      d.reviewerNotes || '',
      d.decidedAt ? new Date(d.decidedAt).toLocaleString() : '',
    ];
  });

  return stringify([headers, ...rows]);
}
