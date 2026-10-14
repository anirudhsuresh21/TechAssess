import mongoose from 'mongoose';
import { stringify } from 'csv-stringify/sync';
import { AuditAction, ShortlistStatus, AttemptStatus } from '@techassess/shared';
import { Result, IResult } from './result.model';
import { Attempt } from '../attempts/attempt.model';
import { Candidate } from '../candidates/candidate.model';
import { Assessment } from '../assessments/assessment.model';
import { ShortlistDecision } from '../shortlisting/shortlist.model';
import { recordAudit } from '../audit/audit.service';
import { AppError } from '../../middleware/errorHandler';

export async function getAssessmentResults(
  assessmentId: string,
  params: {
    search?: string;
    shortlistStatus?: ShortlistStatus;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;
  const assessmentObjId = new mongoose.Types.ObjectId(assessmentId);

  // Find attempts for this assessment
  const attempts = await Attempt.find({ assessmentId: assessmentObjId })
    .populate('candidateId')
    .sort({ obtainedMarks: -1, timeSpentSeconds: 1 })
    .lean();

  const candidateIds = attempts.map((a: any) => a.candidateId?._id);
  const shortlists = await ShortlistDecision.find({
    assessmentId: assessmentObjId,
    candidateId: { $in: candidateIds },
  }).lean();

  const shortlistMap = new Map<string, any>();
  shortlists.forEach((s) => {
    shortlistMap.set(s.candidateId.toString(), s);
  });

  const allRows = attempts.map((att: any, idx: number) => {
    const sl = shortlistMap.get(att.candidateId?._id?.toString());
    return {
      attemptId: att._id.toString(),
      rank: idx + 1,
      candidate: {
        id: att.candidateId?._id?.toString(),
        name: att.candidateId?.name || 'Unknown',
        rollNumber: att.candidateId?.rollNumber || '',
        division: att.candidateId?.division || '',
        email: att.candidateId?.email || '',
      },
      status: att.status,
      totalMarks: att.totalMarks,
      obtainedMarks: att.obtainedMarks,
      percentage: att.percentage,
      isPassed: att.isPassed,
      timeSpentSeconds: att.timeSpentSeconds,
      focusLossCount: att.focusLossCount,
      integrityFlagged: att.integrityFlagged,
      startTime: att.startTime,
      submissionTime: att.submissionTime,
      shortlistStatus: sl?.status || ShortlistStatus.PENDING,
      reviewerNotes: sl?.reviewerNotes || '',
    };
  });

  // Filter in memory for search or shortlist status if provided
  let filtered = allRows;
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.candidate.name.toLowerCase().includes(q) ||
        r.candidate.rollNumber.toLowerCase().includes(q) ||
        r.candidate.division.toLowerCase().includes(q)
    );
  }

  if (params.shortlistStatus) {
    filtered = filtered.filter((r) => r.shortlistStatus === params.shortlistStatus);
  }

  const total = filtered.length;
  const paginated = filtered.slice(skip, skip + limit);

  return {
    results: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAssessmentAnalytics(assessmentId: string) {
  const assessmentObjId = new mongoose.Types.ObjectId(assessmentId);
  const assessment = await Assessment.findById(assessmentObjId);
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  const [totalCandidates, attempts, results] = await Promise.all([
    Candidate.countDocuments({ accessCode: assessment.code }),
    Attempt.find({ assessmentId: assessmentObjId }).lean(),
    Result.find({ assessmentId: assessmentObjId }).lean(),
  ]);

  const startedCount = attempts.length;
  const submittedAttempts = attempts.filter(
    (a) => a.status === AttemptStatus.SUBMITTED || a.status === AttemptStatus.EVALUATED
  );
  const submittedCount = submittedAttempts.length;
  const expiredCount = attempts.filter((a) => a.status === AttemptStatus.EXPIRED).length;
  const inProgressCount = attempts.filter((a) => a.status === AttemptStatus.IN_PROGRESS).length;

  const scores = submittedAttempts.map((a) => a.obtainedMarks);
  const avgScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0;
  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
  const passedCount = submittedAttempts.filter((a) => a.isPassed).length;
  const passPercentage =
    submittedCount > 0 ? Math.round((passedCount / submittedCount) * 1000) / 10 : 0;
  const integrityFlaggedCount = attempts.filter((a) => a.integrityFlagged).length;

  // Score distribution bins (0-20, 21-40, 41-60, 61-80, 81-100)
  const distribution = [
    { range: '0-20%', count: 0 },
    { range: '21-40%', count: 0 },
    { range: '41-60%', count: 0 },
    { range: '61-80%', count: 0 },
    { range: '81-100%', count: 0 },
  ];

  submittedAttempts.forEach((a) => {
    const pct = a.percentage;
    if (pct <= 20) distribution[0].count++;
    else if (pct <= 40) distribution[1].count++;
    else if (pct <= 60) distribution[2].count++;
    else if (pct <= 80) distribution[3].count++;
    else distribution[4].count++;
  });

  // Section averages
  const sectionAgg: Record<string, { totalObtained: number; totalMax: number; count: number }> = {};
  results.forEach((r: any) => {
    if (r.sectionScores) {
      Object.entries(r.sectionScores).forEach(([secName, secData]: [string, any]) => {
        if (!sectionAgg[secName]) {
          sectionAgg[secName] = { totalObtained: 0, totalMax: 0, count: 0 };
        }
        sectionAgg[secName].totalObtained += secData.obtained || 0;
        sectionAgg[secName].totalMax += secData.total || 0;
        sectionAgg[secName].count += 1;
      });
    }
  });

  const sectionAverages = Object.entries(sectionAgg).map(([name, data]) => ({
    name,
    averagePercentage:
      data.totalMax > 0
        ? Math.round((data.totalObtained / data.totalMax) * 1000) / 10
        : 0,
  }));

  return {
    overview: {
      totalCandidates,
      startedCount,
      submittedCount,
      expiredCount,
      inProgressCount,
      avgScore,
      highestScore,
      passPercentage,
      integrityFlaggedCount,
    },
    scoreDistribution: distribution,
    sectionAverages,
  };
}

export async function exportAssessmentResultsCsv(assessmentId: string): Promise<string> {
  const assessmentObjId = new mongoose.Types.ObjectId(assessmentId);
  const assessment = await Assessment.findById(assessmentObjId);
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  const attempts = await Attempt.find({ assessmentId: assessmentObjId })
    .populate('candidateId')
    .sort({ obtainedMarks: -1, timeSpentSeconds: 1 })
    .lean();

  const shortlists = await ShortlistDecision.find({ assessmentId: assessmentObjId }).lean();
  const shortlistMap = new Map<string, any>();
  shortlists.forEach((s) => shortlistMap.set(s.candidateId.toString(), s));

  const headers = [
    'Rank',
    'Roll Number',
    'Full Name',
    'Division',
    'Email',
    'Total Marks',
    'Obtained Marks',
    'Percentage',
    'Result Status',
    'Time Spent (Mins)',
    'Focus Loss Count',
    'Integrity Flagged',
    'Shortlist Status',
    'Reviewer Notes',
    'Submission Time',
  ];

  const rows = attempts.map((att: any, idx: number) => {
    const sl = shortlistMap.get(att.candidateId?._id?.toString());
    const mins = Math.round((att.timeSpentSeconds / 60) * 10) / 10;
    return [
      idx + 1,
      att.candidateId?.rollNumber || 'N/A',
      att.candidateId?.name || 'N/A',
      att.candidateId?.division || 'N/A',
      att.candidateId?.email || 'N/A',
      att.totalMarks,
      att.obtainedMarks,
      `${att.percentage}%`,
      att.isPassed ? 'PASSED' : 'FAILED',
      mins,
      att.focusLossCount,
      att.integrityFlagged ? 'YES' : 'NO',
      sl?.status || ShortlistStatus.PENDING,
      sl?.reviewerNotes || '',
      att.submissionTime ? new Date(att.submissionTime).toLocaleString() : 'N/A',
    ];
  });

  return stringify([headers, ...rows]);
}

export async function getAttemptResultDetail(attemptId: string) {
  const attempt = await Attempt.findById(attemptId).populate('candidateId').lean();
  if (!attempt) {
    throw new AppError('Attempt not found', 404);
  }

  const result = await Result.findOne({ attemptId: attempt._id }).lean();
  const shortlist = await ShortlistDecision.findOne({
    assessmentId: attempt.assessmentId,
    candidateId: (attempt.candidateId as any)._id,
  }).lean();

  return {
    attempt,
    result,
    shortlist,
  };
}

export async function submitManualReview(
  resultId: string,
  questionId: string,
  awardedMarks: number,
  reviewerId: string,
  comments: string = ''
) {
  const result = await Result.findById(resultId);
  if (!result) {
    throw new AppError('Result not found', 404);
  }

  const itemIndex = result.breakdown.findIndex((b) => b.questionId === questionId);
  if (itemIndex === -1) {
    throw new AppError('Question not found in result breakdown', 404);
  }

  const oldItem = result.breakdown[itemIndex];
  const oldAwarded = oldItem.awardedMarks;
  const marksDiff = awardedMarks - oldAwarded;

  result.breakdown[itemIndex].awardedMarks = awardedMarks;
  result.breakdown[itemIndex].status = awardedMarks > 0 ? 'CORRECT' : 'INCORRECT';
  result.breakdown[itemIndex].isCorrect = awardedMarks >= oldItem.maxMarks;

  result.obtainedMarks = Math.max(0, Math.round((result.obtainedMarks + marksDiff) * 100) / 100);
  result.percentage =
    result.totalMarks > 0
      ? Math.round((result.obtainedMarks / result.totalMarks) * 1000) / 10
      : 0;

  result.manualReviews.push({
    questionId,
    reviewerId: new mongoose.Types.ObjectId(reviewerId),
    awardedMarks,
    comments,
    reviewedAt: new Date(),
  });

  await result.save();

  // Update corresponding attempt
  await Attempt.findByIdAndUpdate(result.attemptId, {
    obtainedMarks: result.obtainedMarks,
    percentage: result.percentage,
  });

  // Re-rank
  await Result.find({ assessmentId: result.assessmentId })
    .sort({ obtainedMarks: -1, timeSpentSeconds: 1 })
    .then(async (sorted) => {
      for (let i = 0; i < sorted.length; i++) {
        sorted[i].rank = i + 1;
        await sorted[i].save();
      }
    });

  return result;
}
