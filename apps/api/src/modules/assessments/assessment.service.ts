import mongoose from 'mongoose';
import { AssessmentStatus, AuditAction } from '@techassess/shared';
import { Assessment, IAssessment } from './assessment.model';
import { AssessmentVersion } from './assessmentVersion.model';
import { Question } from '../questions/question.model';
import { Attempt } from '../attempts/attempt.model';
import { AppError } from '../../middleware/errorHandler';
import { recordAudit } from '../audit/audit.service';

export async function createAssessment(data: any, userId?: string, ipAddress?: string) {
  // Ensure code is unique uppercase
  data.code = data.code.trim().toUpperCase();
  const existing = await Assessment.findOne({ code: data.code });
  if (existing) {
    throw new AppError(`Assessment code "${data.code}" is already in use`, 409);
  }

  const assessment = await Assessment.create({
    ...data,
    createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
  });

  if (userId) {
    await recordAudit({
      userId: new mongoose.Types.ObjectId(userId),
      action: AuditAction.ASSESSMENT_CREATED,
      resourceType: 'Assessment',
      resourceId: assessment._id.toString(),
      details: { title: assessment.title, code: assessment.code },
      ipAddress,
    });
  }

  return assessment;
}

export async function getAssessments(filter: {
  status?: AssessmentStatus;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, filter.page || 1);
  const limit = Math.min(100, Math.max(1, filter.limit || 20));
  const skip = (page - 1) * limit;

  const query: any = {};
  if (filter.status) query.status = filter.status;
  if (filter.search) {
    const regex = new RegExp(filter.search, 'i');
    query.$or = [{ title: regex }, { code: regex }, { description: regex }];
  }

  const [assessments, total] = await Promise.all([
    Assessment.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Assessment.countDocuments(query),
  ]);

  return {
    assessments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAssessmentById(id: string) {
  const assessment = await Assessment.findById(id)
    .populate('sections.questionIds')
    .populate('sets.sections.questionIds')
    .populate('createdBy', 'name email')
    .lean();
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  const populateLanguageOptions = async (section: any) => {
    if (section.hasLanguageTracks && section.languageOptions) {
      const populated: Record<string, any[]> = {};
      for (const [lang, qIds] of Object.entries(section.languageOptions)) {
        if (Array.isArray(qIds) && qIds.length > 0) {
          const docs = await Question.find({ _id: { $in: qIds } }).lean();
          populated[lang] = docs;
        } else {
          populated[lang] = [];
        }
      }
      section.languageOptionsPopulated = populated;
    }
  };

  for (const s of ((assessment.sections || []) as any[])) {
    await populateLanguageOptions(s);
  }
  for (const set of ((assessment.sets || []) as any[])) {
    for (const s of (set.sections || [])) {
      await populateLanguageOptions(s);
    }
  }

  return assessment;
}

export async function updateAssessment(id: string, data: any, userId?: string, ipAddress?: string) {
  const assessment = await Assessment.findById(id);
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  if (data.code && data.code.toUpperCase() !== assessment.code) {
    const existing = await Assessment.findOne({
      code: data.code.toUpperCase(),
      _id: { $ne: id },
    });
    if (existing) {
      throw new AppError(`Assessment code "${data.code}" is already in use`, 409);
    }
    data.code = data.code.toUpperCase();
  }

  // If questions are modified while published, check if active attempts depend on it
  if (data.sections && assessment.status === AssessmentStatus.PUBLISHED) {
    const activeAttemptsCount = await Attempt.countDocuments({
      assessmentId: id,
      status: 'IN_PROGRESS',
    });
    if (activeAttemptsCount > 0) {
      // Allowed because attempts are pinned to immutable AssessmentVersion!
      // But log a warning
    }
  }

  Object.assign(assessment, data);
  await assessment.save();

  if (userId) {
    await recordAudit({
      userId: new mongoose.Types.ObjectId(userId),
      action: AuditAction.ASSESSMENT_UPDATED,
      resourceType: 'Assessment',
      resourceId: assessment._id.toString(),
      details: { updatedFields: Object.keys(data) },
      ipAddress,
    });
  }

  return assessment;
}

export async function publishAssessment(id: string, userId?: string, ipAddress?: string) {
  const assessment = await Assessment.findById(id).populate('sections.questionIds');
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  // Validate sections and questions
  if (!assessment.sections || assessment.sections.length === 0) {
    throw new AppError('Cannot publish an assessment with zero sections', 400);
  }

  let totalQuestionsCount = 0;
  const versionSections = [];

  for (const section of assessment.sections) {
    if (!section.questionIds || section.questionIds.length === 0) {
      throw new AppError(`Section "${section.name}" has no questions assigned`, 400);
    }
    totalQuestionsCount += section.questionIds.length;

    // Fetch full question data
    const questionDocs = await Question.find({
      _id: { $in: section.questionIds },
      isArchived: false,
    }).lean();

    if (questionDocs.length !== section.questionIds.length) {
      throw new AppError(`Some questions in section "${section.name}" are archived or missing`, 400);
    }

    const langSnapshotMap: Record<string, any[]> = {};
    if (section.hasLanguageTracks && section.languageOptions) {
      for (const [lang, qIds] of Object.entries(section.languageOptions as Record<string, any>)) {
        if (Array.isArray(qIds) && qIds.length > 0) {
          const langDocs = await Question.find({
            _id: { $in: qIds },
            isArchived: false,
          }).lean();
          langSnapshotMap[lang] = langDocs;
        }
      }
    }

    versionSections.push({
      name: section.name,
      category: section.category,
      description: section.description,
      timeLimitMinutes: section.timeLimitMinutes,
      questions: questionDocs,
      hasLanguageTracks: !!section.hasLanguageTracks,
      languageOptions: langSnapshotMap,
    });
  }

  if (totalQuestionsCount === 0) {
    throw new AppError('Cannot publish an assessment without any questions', 400);
  }

  const nextVersionNumber = assessment.currentVersion + 1;

  // Build Sets snapshot (Set A and Set B)
  const snapshotSets: any[] = [];
  if (assessment.sets && assessment.sets.length > 0) {
    for (const set of assessment.sets) {
      const setSections = [];
      for (const section of (set.sections || [])) {
        const qDocs = await Question.find({
          _id: { $in: section.questionIds },
          isArchived: false,
        }).lean();

        const setLangMap: Record<string, any[]> = {};
        if (section.hasLanguageTracks && section.languageOptions) {
          for (const [lang, qIds] of Object.entries(section.languageOptions as Record<string, any>)) {
            if (Array.isArray(qIds) && qIds.length > 0) {
              const langDocs = await Question.find({ _id: { $in: qIds }, isArchived: false }).lean();
              setLangMap[lang] = langDocs;
            }
          }
        }

        setSections.push({
          name: section.name,
          category: section.category,
          description: section.description,
          timeLimitMinutes: section.timeLimitMinutes,
          questions: qDocs,
          hasLanguageTracks: !!section.hasLanguageTracks,
          languageOptions: setLangMap,
        });
      }
      snapshotSets.push({
        setCode: set.setCode || 'A',
        name: set.name || `Set ${set.setCode || 'A'}`,
        description: set.description,
        sections: setSections.length > 0 ? setSections : versionSections,
      });
    }
  } else {
    // Default dual Set A and Set B configuration
    snapshotSets.push({
      setCode: 'A',
      name: 'Set A',
      description: 'Standard Question Paper (Set A)',
      sections: versionSections,
    });
    snapshotSets.push({
      setCode: 'B',
      name: 'Set B',
      description: 'Alternate Question Paper (Set B)',
      sections: versionSections.map(s => {
        const reversedLangOptions: Record<string, any[]> = {};
        if (s.languageOptions) {
          for (const [lang, list] of Object.entries(s.languageOptions)) {
            reversedLangOptions[lang] = [...list].reverse();
          }
        }
        return {
          name: s.name,
          category: s.category,
          description: s.description,
          timeLimitMinutes: s.timeLimitMinutes,
          questions: [...s.questions].reverse(),
          hasLanguageTracks: s.hasLanguageTracks,
          languageOptions: reversedLangOptions,
        };
      }),
    });
  }

  // Create immutable snapshot
  const snapshotData = {
    title: assessment.title,
    description: assessment.description,
    code: assessment.code,
    durationMinutes: assessment.durationMinutes,
    passMarks: assessment.passMarks,
    totalMarks: assessment.totalMarks,
    negativeMarkingRate: assessment.negativeMarkingRate,
    allowQuestionReturn: assessment.allowQuestionReturn,
    allowAnswerChange: assessment.allowAnswerChange,
    randomizeQuestions: assessment.randomizeQuestions,
    randomizeOptions: assessment.randomizeOptions,
    showResultsImmediately: assessment.showResultsImmediately,
    allowReviewAnswers: assessment.allowReviewAnswers,
    isPublic: assessment.isPublic,
    allowRetake: assessment.allowRetake,
    codingEnabled: assessment.codingEnabled,
    unansweredZeroMarks: assessment.unansweredZeroMarks,
    setsEnabled: assessment.setsEnabled !== false,
    sets: snapshotSets,
    integritySettings: assessment.integritySettings,
    sections: versionSections,
  };

  const versionDoc = await AssessmentVersion.create({
    assessmentId: assessment._id,
    versionNumber: nextVersionNumber,
    snapshotData,
    publishedBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
  });

  assessment.status = AssessmentStatus.PUBLISHED;
  assessment.currentVersion = nextVersionNumber;
  await assessment.save();

  if (userId) {
    await recordAudit({
      userId: new mongoose.Types.ObjectId(userId),
      action: AuditAction.ASSESSMENT_PUBLISHED,
      resourceType: 'Assessment',
      resourceId: assessment._id.toString(),
      details: { versionNumber: nextVersionNumber, totalQuestions: totalQuestionsCount },
      ipAddress,
    });
  }

  return {
    assessment,
    version: versionDoc,
  };
}

export async function archiveAssessment(id: string, userId?: string, ipAddress?: string) {
  const assessment = await Assessment.findByIdAndUpdate(
    id,
    { status: AssessmentStatus.ARCHIVED },
    { new: true }
  );
  if (!assessment) {
    throw new AppError('Assessment not found', 404);
  }

  if (userId) {
    await recordAudit({
      userId: new mongoose.Types.ObjectId(userId),
      action: AuditAction.ASSESSMENT_ARCHIVED,
      resourceType: 'Assessment',
      resourceId: assessment._id.toString(),
      ipAddress,
    });
  }

  return assessment;
}

export async function duplicateAssessment(id: string, userId?: string) {
  const original = await Assessment.findById(id).lean();
  if (!original) {
    throw new AppError('Assessment not found', 404);
  }

  let newCode = `${original.code}_COPY`;
  let counter = 1;
  while (await Assessment.findOne({ code: newCode })) {
    newCode = `${original.code}_COPY${counter++}`;
  }

  const duplicated = await Assessment.create({
    ...original,
    _id: undefined,
    title: `${original.title} (Copy)`,
    code: newCode,
    status: AssessmentStatus.DRAFT,
    currentVersion: 0,
    createdBy: userId ? new mongoose.Types.ObjectId(userId) : original.createdBy,
    createdAt: undefined,
    updatedAt: undefined,
  });

  return duplicated;
}
