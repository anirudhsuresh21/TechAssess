import { AssessmentStatus } from '@techassess/shared';
import { Assessment } from '../assessments/assessment.model';
import { Candidate, ICandidate } from './candidate.model';
import { Attempt } from '../attempts/attempt.model';
import { AppError } from '../../middleware/errorHandler';

export async function validateAccessCode(code: string) {
  const normalizedCode = code.trim().toUpperCase();
  const assessment = await Assessment.findOne({ code: normalizedCode });

  if (!assessment) {
    throw new AppError('Invalid examination code. Please check and try again.', 404);
  }

  if (assessment.status !== AssessmentStatus.PUBLISHED && assessment.status !== AssessmentStatus.ACTIVE) {
    throw new AppError(
      `This examination is currently not active (Status: ${assessment.status}). Please contact your assessment administrator.`,
      400
    );
  }

  const now = new Date();
  if (assessment.startDate && now < assessment.startDate) {
    throw new AppError(
      `This examination has not started yet. Scheduled to begin at: ${assessment.startDate.toLocaleString()}`,
      400
    );
  }

  if (assessment.endDate && now > assessment.endDate) {
    throw new AppError(
      `This examination ended on: ${assessment.endDate.toLocaleString()}`,
      400
    );
  }

  if (assessment.maxCandidates) {
    const candidateCount = await Candidate.countDocuments({ accessCode: normalizedCode });
    if (candidateCount >= assessment.maxCandidates) {
      throw new AppError(
        'The candidate capacity limit for this examination has been reached.',
        400
      );
    }
  }

  return {
    assessmentId: assessment._id.toString(),
    title: assessment.title,
    description: assessment.description,
    code: assessment.code,
    durationMinutes: assessment.durationMinutes,
    totalMarks: assessment.totalMarks,
    passMarks: assessment.passMarks,
    allowQuestionReturn: assessment.allowQuestionReturn,
    allowAnswerChange: assessment.allowAnswerChange,
    codingEnabled: assessment.codingEnabled,
    sections: assessment.sections.map((s) => ({
      name: s.name,
      category: s.category,
      questionCount: s.questionIds.length,
      timeLimitMinutes: s.timeLimitMinutes,
    })),
    integritySettings: assessment.integritySettings,
  };
}

export async function registerCandidate(data: {
  name: string;
  rollNumber: string;
  division: string;
  email: string;
  phone?: string;
  accessCode: string;
}) {
  const assessmentInfo = await validateAccessCode(data.accessCode);
  const normalizedRoll = data.rollNumber.trim().toUpperCase();
  const normalizedCode = data.accessCode.trim().toUpperCase();

  let candidate = await Candidate.findOne({
    rollNumber: normalizedRoll,
    accessCode: normalizedCode,
  });

  if (!candidate) {
    candidate = await Candidate.create({
      name: data.name.trim(),
      rollNumber: normalizedRoll,
      division: data.division.trim().toUpperCase(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim(),
      accessCode: normalizedCode,
    });
  } else {
    // Update existing candidate info
    candidate.name = data.name.trim();
    candidate.division = data.division.trim().toUpperCase();
    candidate.email = data.email.trim().toLowerCase();
    if (data.phone) candidate.phone = data.phone.trim();
    await candidate.save();
  }

  // Check if candidate already has an attempt
  const existingAttempt = await Attempt.findOne({
    candidateId: candidate._id,
    assessmentId: assessmentInfo.assessmentId,
  });

  return {
    candidate: {
      id: candidate._id.toString(),
      name: candidate.name,
      rollNumber: candidate.rollNumber,
      division: candidate.division,
      email: candidate.email,
    },
    assessment: assessmentInfo,
    existingAttemptId: existingAttempt?._id.toString(),
    existingAttemptStatus: existingAttempt?.status,
  };
}
