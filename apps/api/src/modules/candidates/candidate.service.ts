import { AssessmentStatus, AttemptStatus } from '@techassess/shared';
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
  division?: string;
  email?: string;
  phone?: string;
  accessCode: string;
  preferredSet?: string;
  assignedSet?: 'A' | 'B';
}) {
  const assessmentInfo = await validateAccessCode(data.accessCode);
  const normalizedRoll = data.rollNumber.trim().toUpperCase();
  const normalizedCode = data.accessCode.trim().toUpperCase();

  const assignedSet = data.assignedSet || (data.preferredSet && ['A', 'B'].includes(data.preferredSet.toUpperCase()) ? data.preferredSet.toUpperCase() as 'A' | 'B' : undefined);

  let candidate = await Candidate.findOne({
    rollNumber: normalizedRoll,
    accessCode: normalizedCode,
  });

  if (!candidate) {
    candidate = await Candidate.create({
      name: data.name.trim(),
      rollNumber: normalizedRoll,
      division: (data.division || 'A').trim().toUpperCase(),
      email: (data.email || `${normalizedRoll.toLowerCase()}@student.local`).trim().toLowerCase(),
      phone: data.phone?.trim(),
      accessCode: normalizedCode,
      assignedSet,
      isAllowed: true,
    });
  } else {
    // Update existing candidate info
    candidate.name = data.name.trim();
    if (data.division) candidate.division = data.division.trim().toUpperCase();
    if (data.email) candidate.email = data.email.trim().toLowerCase();
    if (data.phone) candidate.phone = data.phone.trim();
    if (data.assignedSet) candidate.assignedSet = data.assignedSet;
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
      assignedSet: candidate.assignedSet || 'A',
    },
    assessment: assessmentInfo,
    existingAttemptId: existingAttempt?._id.toString(),
    existingAttemptStatus: existingAttempt?.status,
  };
}

export async function candidateLogin(data: {
  accessCode: string;
  rollNumber: string;
  password?: string;
}) {
  const assessmentInfo = await validateAccessCode(data.accessCode);
  const normalizedRoll = data.rollNumber.trim().toUpperCase();
  const normalizedCode = data.accessCode.trim().toUpperCase();

  // If password provided, it must match the student's Roll Number
  if (data.password && data.password.trim().length > 0) {
    if (data.password.trim().toUpperCase() !== normalizedRoll) {
      throw new AppError('Invalid password. Your password is your roll number.', 401);
    }
  }

  const candidate = await Candidate.findOne({
    rollNumber: normalizedRoll,
    accessCode: normalizedCode,
  });

  if (!candidate) {
    throw new AppError(
      `Roll number "${normalizedRoll}" is not authorized for this examination. The administrator must pre-register your student profile before you can log in.`,
      403
    );
  }

  if (candidate.isAllowed === false) {
    throw new AppError(
      `Student account for roll number "${normalizedRoll}" has been deactivated for this examination.`,
      403
    );
  }

  // Check existing attempt
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
      assignedSet: candidate.assignedSet || 'A',
    },
    assessment: assessmentInfo,
    existingAttemptId: existingAttempt?._id.toString(),
    existingAttemptStatus: existingAttempt?.status,
  };
}

export async function getCandidatesForAssessment(code: string) {
  const normalizedCode = code.trim().toUpperCase();
  const assessment = await Assessment.findOne({ code: normalizedCode });
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  const candidates = await Candidate.find({ accessCode: normalizedCode })
    .sort({ rollNumber: 1 })
    .lean();

  const attempts = await Attempt.find({ assessmentId: assessment._id }).lean();
  const attemptsByCandidate = new Map<string, any>();
  for (const att of attempts) {
    attemptsByCandidate.set(att.candidateId.toString(), att);
  }

  return candidates.map((c) => {
    const att = attemptsByCandidate.get(c._id.toString());
    return {
      id: c._id.toString(),
      name: c.name,
      rollNumber: c.rollNumber,
      division: c.division,
      email: c.email,
      phone: c.phone,
      assignedSet: c.assignedSet || 'A',
      isAllowed: c.isAllowed !== false,
      attemptId: att?._id.toString(),
      attemptStatus: att?.status || 'NOT_STARTED',
      obtainedMarks: att?.obtainedMarks,
      totalMarks: att?.totalMarks,
      percentage: att?.percentage,
      focusLossCount: att?.focusLossCount || 0,
      integrityFlagged: att?.integrityFlagged || false,
      startTime: att?.startTime,
      submissionTime: att?.submissionTime,
    };
  });
}

export async function addCandidateToAssessment(
  code: string,
  data: {
    name: string;
    rollNumber: string;
    division?: string;
    email?: string;
    phone?: string;
    assignedSet?: 'A' | 'B';
  }
) {
  const normalizedCode = code.trim().toUpperCase();
  const assessment = await Assessment.findOne({ code: normalizedCode });
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  const normalizedRoll = data.rollNumber.trim().toUpperCase();
  const assignedSet = data.assignedSet || 'A';

  const candidate = await Candidate.findOneAndUpdate(
    { rollNumber: normalizedRoll, accessCode: normalizedCode },
    {
      $set: {
        name: data.name.trim(),
        division: (data.division || 'A').trim().toUpperCase(),
        email: (data.email || `${normalizedRoll.toLowerCase()}@student.local`).trim().toLowerCase(),
        phone: data.phone?.trim(),
        assignedSet,
        isAllowed: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return candidate;
}

export async function bulkAddCandidatesToAssessment(
  code: string,
  candidatesList: Array<{
    name: string;
    rollNumber: string;
    division?: string;
    email?: string;
    phone?: string;
    assignedSet?: 'A' | 'B';
  }>
) {
  const normalizedCode = code.trim().toUpperCase();
  const assessment = await Assessment.findOne({ code: normalizedCode });
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  let addedCount = 0;
  for (const c of candidatesList) {
    if (!c.rollNumber || !c.name) continue;
    const normalizedRoll = c.rollNumber.trim().toUpperCase();
    await Candidate.findOneAndUpdate(
      { rollNumber: normalizedRoll, accessCode: normalizedCode },
      {
        $set: {
          name: c.name.trim(),
          division: (c.division || 'A').trim().toUpperCase(),
          email: (c.email || `${normalizedRoll.toLowerCase()}@student.local`).trim().toLowerCase(),
          phone: c.phone?.trim(),
          assignedSet: c.assignedSet || 'A',
          isAllowed: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    addedCount++;
  }

  return { success: true, count: addedCount };
}

export async function assignCandidateSet(candidateId: string, assignedSet: 'A' | 'B') {
  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new AppError('Candidate not found', 404);
  }

  candidate.assignedSet = assignedSet;
  await candidate.save();

  // If candidate has an in-progress attempt, also update attempt's assignedSet
  await Attempt.updateMany(
    { candidateId: candidate._id, status: AttemptStatus.IN_PROGRESS },
    { $set: { assignedSet, setName: `Set ${assignedSet}` } }
  );

  return candidate;
}

export async function autoAssignSetsAlternating(code: string) {
  const normalizedCode = code.trim().toUpperCase();
  const candidates = await Candidate.find({ accessCode: normalizedCode }).sort({ rollNumber: 1 });

  let setACount = 0;
  let setBCount = 0;

  for (let i = 0; i < candidates.length; i++) {
    const assignedSet: 'A' | 'B' = i % 2 === 0 ? 'A' : 'B';
    candidates[i].assignedSet = assignedSet;
    await candidates[i].save();

    if (assignedSet === 'A') setACount++;
    else setBCount++;
  }

  return {
    total: candidates.length,
    assignedCount: candidates.length,
    setACount,
    setBCount,
  };
}

export async function deleteCandidate(candidateId: string) {
  const candidate = await Candidate.findById(candidateId);
  if (!candidate) {
    throw new AppError('Candidate not found', 404);
  }

  // Check if candidate already submitted attempt
  const submittedAttempt = await Attempt.findOne({
    candidateId: candidate._id,
    status: { $in: [AttemptStatus.SUBMITTED, AttemptStatus.EVALUATED] },
  });

  if (submittedAttempt) {
    throw new AppError('Cannot delete a student who has already submitted the examination.', 400);
  }

  await Attempt.deleteMany({ candidateId: candidate._id });
  await Candidate.findByIdAndDelete(candidateId);

  return { success: true };
}
