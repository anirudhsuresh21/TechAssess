import mongoose from 'mongoose';
import {
  AttemptStatus,
  CandidateAttemptPayload,
  SanitizedCandidateQuestion,
  IntegrityEventType,
} from '@techassess/shared';
import { Assessment } from '../assessments/assessment.model';
import { AssessmentVersion } from '../assessments/assessmentVersion.model';
import { Candidate } from '../candidates/candidate.model';
import { Attempt, IAttempt } from './attempt.model';
import { AttemptAnswer } from './attemptAnswer.model';
import { Result } from '../results/result.model';
import { IntegrityEvent } from '../integrity/integrityEvent.model';
import { evaluateAttemptAnswers } from '../scoring/scoring.service';
import { AppError } from '../../middleware/errorHandler';

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function startAttempt(accessCode: string, candidateId: string, preferredSet?: string) {
  const normalizedCode = accessCode.trim().toUpperCase();
  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new AppError('Candidate record not found. Please register first.', 404);
  }

  const assessment = await Assessment.findOne({ code: normalizedCode });
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  // Fetch the latest published version
  const version = await AssessmentVersion.findOne({
    assessmentId: assessment._id,
    versionNumber: assessment.currentVersion,
  });

  if (!version) {
    throw new AppError('This assessment has not been published with a valid question set.', 400);
  }

  // Check for existing attempt
  let attempt = await Attempt.findOne({
    candidateId: candidate._id,
    assessmentId: assessment._id,
  });

  const now = new Date();

  if (attempt) {
    // If already submitted or evaluated
    if (attempt.status === AttemptStatus.SUBMITTED || attempt.status === AttemptStatus.EVALUATED) {
      if (!version.snapshotData.allowRetake) {
        throw new AppError('You have already submitted this examination. Retakes are not permitted.', 403);
      }
    }

    // If in progress but deadline expired
    if (attempt.status === AttemptStatus.IN_PROGRESS && now > attempt.serverDeadline) {
      await submitAttempt(attempt._id.toString(), true);
      throw new AppError('Examination time has expired. Your attempt has been automatically submitted.', 403);
    }

    // Candidate is resuming their active attempt!
    return getAttemptPayload(attempt, version);
  }

  // Determine assigned set (alternating parity or preferred)
  let assignedSetCode = 'A';
  if (preferredSet && ['A', 'B'].includes(preferredSet.toUpperCase())) {
    assignedSetCode = preferredSet.toUpperCase();
  } else if (version.snapshotData.setsEnabled !== false) {
    const existingAttemptsCount = await Attempt.countDocuments({ assessmentId: assessment._id });
    assignedSetCode = existingAttemptsCount % 2 === 0 ? 'A' : 'B';
  }

  // Find matching set snapshot or fallback to base sections
  const matchingSet = version.snapshotData.sets?.find((s: any) => s.setCode === assignedSetCode);
  const assignedSetName = matchingSet?.name || `Set ${assignedSetCode}`;
  const activeSections =
    matchingSet?.sections && matchingSet.sections.length > 0
      ? matchingSet.sections
      : version.snapshotData.sections;

  // Build question ordering and option map from active sections
  const allQuestions: any[] = [];
  activeSections.forEach((sec: any) => {
    allQuestions.push(...sec.questions);
  });

  let orderedQuestionIds = allQuestions.map((q) => q._id.toString());
  if (version.snapshotData.randomizeQuestions) {
    orderedQuestionIds = shuffleArray<string>(orderedQuestionIds);
  }

  const randomizedOptionMap: Record<string, string[]> = {};
  if (version.snapshotData.randomizeOptions) {
    for (const q of allQuestions) {
      if (q.options && q.options.length > 0) {
        const optionIds: string[] = q.options.map((o: any) => String(o.id));
        const shuffled = shuffleArray<string>(optionIds);
        randomizedOptionMap[q._id.toString()] = shuffled;
      }
    }
  }

  const durationMs = version.snapshotData.durationMinutes * 60 * 1000;
  const startTime = new Date();
  const serverDeadline = new Date(startTime.getTime() + durationMs);

  attempt = await Attempt.create({
    candidateId: candidate._id,
    assessmentId: assessment._id,
    versionId: version._id,
    versionNumber: version.versionNumber,
    status: AttemptStatus.IN_PROGRESS,
    startTime,
    serverDeadline,
    totalMarks: version.snapshotData.totalMarks,
    assignedSet: assignedSetCode,
    setName: assignedSetName,
    randomizedQuestionOrder: orderedQuestionIds,
    randomizedOptionMap,
  });

  return getAttemptPayload(attempt, version);
}

export async function getAttemptState(attemptId: string) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    throw new AppError('Attempt not found', 404);
  }

  const version = await AssessmentVersion.findById(attempt.versionId);
  if (!version) {
    throw new AppError('Assessment snapshot version not found', 500);
  }

  // Check if server deadline expired while in progress
  const now = new Date();
  if (attempt.status === AttemptStatus.IN_PROGRESS && now > attempt.serverDeadline) {
    await submitAttempt(attemptId, true);
    attempt.status = AttemptStatus.EXPIRED;
  }

  return getAttemptPayload(attempt, version);
}

export async function saveCandidateAnswer(
  attemptId: string,
  questionId: string,
  answerData: {
    selectedOptionIds?: string[];
    textAnswer?: string;
    numericalAnswer?: number;
    codeSubmission?: string;
    isMarkedForReview?: boolean;
  }
) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    throw new AppError('Attempt not found', 404);
  }

  if (attempt.status !== AttemptStatus.IN_PROGRESS) {
    throw new AppError('Cannot update answers for an examination that is already finalized', 400);
  }

  if (new Date() > attempt.serverDeadline) {
    await submitAttempt(attemptId, true);
    throw new AppError('Examination time has expired. Answers can no longer be saved.', 403);
  }

  const updatedAnswer = await AttemptAnswer.findOneAndUpdate(
    { attemptId: attempt._id, questionId },
    {
      $set: {
        selectedOptionIds: answerData.selectedOptionIds || [],
        textAnswer: answerData.textAnswer,
        numericalAnswer: answerData.numericalAnswer,
        codeSubmission: answerData.codeSubmission,
        isMarkedForReview: !!answerData.isMarkedForReview,
        lastSavedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    success: true,
    savedAt: updatedAnswer.lastSavedAt,
  };
}

export async function submitAttempt(attemptId: string, isAutoExpired = false) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    throw new AppError('Attempt not found', 404);
  }

  // Idempotent: If already submitted or evaluated, return existing result
  if (attempt.status === AttemptStatus.SUBMITTED || attempt.status === AttemptStatus.EVALUATED) {
    const existingResult = await Result.findOne({ attemptId: attempt._id });
    return {
      attempt,
      result: existingResult,
      alreadySubmitted: true,
    };
  }

  const version = await AssessmentVersion.findById(attempt.versionId);
  if (!version) {
    throw new AppError('Version snapshot not found for scoring', 500);
  }

  const submissionTime = new Date();
  const timeSpentSeconds = Math.max(
    0,
    Math.round((submissionTime.getTime() - attempt.startTime.getTime()) / 1000)
  );

  // Retrieve all saved answers
  const answers = await AttemptAnswer.find({ attemptId: attempt._id }).lean();
  const answersMap: Record<string, any> = {};
  for (const a of answers) {
    answersMap[a.questionId] = {
      selectedOptionIds: a.selectedOptionIds,
      textAnswer: a.textAnswer,
      numericalAnswer: a.numericalAnswer,
      codeSubmission: a.codeSubmission,
    };
  }

  // Evaluate
  const scoreResult = evaluateAttemptAnswers(version.snapshotData, answersMap, attempt.assignedSet);

  attempt.status = isAutoExpired ? AttemptStatus.EXPIRED : AttemptStatus.SUBMITTED;
  attempt.submissionTime = submissionTime;
  attempt.timeSpentSeconds = timeSpentSeconds;
  attempt.totalMarks = scoreResult.totalMarks;
  attempt.obtainedMarks = scoreResult.obtainedMarks;
  attempt.percentage = scoreResult.percentage;
  attempt.isPassed = scoreResult.isPassed;
  await attempt.save();

  // Create or update Result document
  const result = await Result.findOneAndUpdate(
    { attemptId: attempt._id },
    {
      $set: {
        candidateId: attempt.candidateId,
        assessmentId: attempt.assessmentId,
        assignedSet: attempt.assignedSet || 'A',
        setName: attempt.setName || `Set ${attempt.assignedSet || 'A'}`,
        totalMarks: scoreResult.totalMarks,
        obtainedMarks: scoreResult.obtainedMarks,
        percentage: scoreResult.percentage,
        isPassed: scoreResult.isPassed,
        timeSpentSeconds,
        sectionScores: scoreResult.sectionScores,
        breakdown: scoreResult.breakdown,
      },
    },
    { upsert: true, new: true }
  );

  // Recalculate ranks for this assessment
  await recalculateAssessmentRanks(attempt.assessmentId.toString());

  return {
    attempt,
    result,
    showResultsImmediately: version.snapshotData.showResultsImmediately,
  };
}

export async function recordAttemptIntegrityEvent(
  attemptId: string,
  eventType: IntegrityEventType,
  durationMs: number = 0,
  metadata: Record<string, any> = {}
) {
  const attempt = await Attempt.findById(attemptId);
  if (!attempt) {
    throw new AppError('Attempt not found', 404);
  }

  const version = await AssessmentVersion.findById(attempt.versionId);
  const maxAllowed = version?.snapshotData.integritySettings?.maxFocusLossCount || 3;

  await IntegrityEvent.create({
    attemptId: attempt._id,
    candidateId: attempt.candidateId,
    eventType,
    durationMs,
    metadata,
  });

  attempt.focusLossCount += 1;
  let autoSubmitted = false;
  let submissionResult: any = null;

  if (attempt.focusLossCount >= maxAllowed) {
    attempt.integrityFlagged = true;
    attempt.metadata = {
      ...(attempt.metadata || {}),
      terminationReason: 'INTEGRITY_VIOLATION_LIMIT_REACHED',
      autoSubmittedDueToViolations: true,
    };

    if (attempt.status === AttemptStatus.IN_PROGRESS) {
      await attempt.save();
      submissionResult = await submitAttempt(attempt._id.toString(), false);
      autoSubmitted = true;
    } else {
      await attempt.save();
    }
  } else {
    await attempt.save();
  }

  return {
    focusLossCount: attempt.focusLossCount,
    integrityFlagged: attempt.integrityFlagged,
    maxAllowed,
    autoSubmitted,
    submissionResult,
    warning:
      attempt.focusLossCount >= maxAllowed
        ? `Maximum integrity violations reached (${attempt.focusLossCount}/${maxAllowed}). Your examination has been automatically submitted for administrator review.`
        : `Focus loss warning ${attempt.focusLossCount} of ${maxAllowed}. Switching tabs or exiting fullscreen is monitored. At ${maxAllowed} warnings, the examination will automatically submit.`,
  };
}

export async function recalculateAssessmentRanks(assessmentId: string) {
  // Sort results by obtainedMarks descending, then timeSpentSeconds ascending (tie-breaker)
  const results = await Result.find({ assessmentId: new mongoose.Types.ObjectId(assessmentId) })
    .sort({ obtainedMarks: -1, timeSpentSeconds: 1 });

  for (let i = 0; i < results.length; i++) {
    results[i].rank = i + 1;
    await results[i].save();
  }
}

async function getAttemptPayload(attempt: IAttempt, version: any): Promise<CandidateAttemptPayload> {
  const matchingSet = version.snapshotData.sets?.find((s: any) => s.setCode === (attempt.assignedSet || 'A'));
  const activeSections =
    matchingSet?.sections && matchingSet.sections.length > 0
      ? matchingSet.sections
      : version.snapshotData.sections;

  // Build lookup of all questions from activeSections
  const questionsMap = new Map<string, any>();
  activeSections.forEach((sec: any) => {
    sec.questions.forEach((q: any) => {
      questionsMap.set(q._id.toString(), q);
    });
  });

  // Use candidate's randomized question order if available
  const questionOrder =
    attempt.randomizedQuestionOrder && attempt.randomizedQuestionOrder.length > 0
      ? attempt.randomizedQuestionOrder
      : Array.from(questionsMap.keys());

  // Sanitize questions: NEVER expose isCorrect, explanation, hidden testcases or answer keys
  const sanitizedQuestions: SanitizedCandidateQuestion[] = [];
  questionOrder.forEach((qId, idx) => {
    const rawQ = questionsMap.get(qId);
    if (!rawQ) return;

    let options = undefined;
    if (rawQ.options && rawQ.options.length > 0) {
      const optionOrder = attempt.randomizedOptionMap?.[qId] || rawQ.options.map((o: any) => o.id);
      options = optionOrder.map((optId: string) => {
        const opt = rawQ.options.find((o: any) => o.id === optId);
        return {
          id: optId,
          text: opt ? opt.text : '',
        };
      });
    }

    sanitizedQuestions.push({
      _id: qId,
      title: rawQ.title,
      text: rawQ.text,
      codeSnippet: rawQ.codeSnippet,
      category: rawQ.category,
      topic: rawQ.topic,
      difficulty: rawQ.difficulty,
      type: rawQ.type,
      options,
      marks: rawQ.marks,
      negativeMarks: rawQ.negativeMarks,
      sectionIndex: 0,
    });
  });

  // Fetch saved answers
  const savedAnswersDocs = await AttemptAnswer.find({ attemptId: attempt._id }).lean();
  const savedAnswers: Record<string, any> = {};
  for (const a of savedAnswersDocs) {
    savedAnswers[a.questionId] = {
      selectedOptionIds: a.selectedOptionIds,
      textAnswer: a.textAnswer,
      numericalAnswer: a.numericalAnswer,
      codeSubmission: a.codeSubmission,
      isMarkedForReview: a.isMarkedForReview,
      lastSavedAt: a.lastSavedAt?.toISOString(),
    };
  }

  // Sections with question indices
  const sections = activeSections.map((sec: any) => {
    const secQIds = new Set(sec.questions.map((q: any) => q._id.toString()));
    const indices: number[] = [];
    sanitizedQuestions.forEach((q, idx) => {
      if (secQIds.has(q._id)) {
        indices.push(idx);
      }
    });
    return {
      name: sec.name,
      category: sec.category,
      questionIndices: indices,
    };
  });

  return {
    attemptId: attempt._id.toString(),
    assessmentTitle: version.snapshotData.title,
    assessmentDescription: version.snapshotData.description,
    durationMinutes: version.snapshotData.durationMinutes,
    startTime: attempt.startTime.toISOString(),
    serverDeadline: attempt.serverDeadline.toISOString(),
    allowQuestionReturn: version.snapshotData.allowQuestionReturn,
    allowAnswerChange: version.snapshotData.allowAnswerChange,
    codingEnabled: version.snapshotData.codingEnabled,
    assignedSet: attempt.assignedSet || 'A',
    setName: attempt.setName || `Set ${attempt.assignedSet || 'A'}`,
    sections,
    questions: sanitizedQuestions,
    savedAnswers,
    integritySettings: version.snapshotData.integritySettings,
  };
}
