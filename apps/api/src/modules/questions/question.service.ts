import mongoose from 'mongoose';
import {
  QuestionCategory,
  QuestionDifficulty,
  QuestionType,
  AuditAction,
} from '@techassess/shared';
import { Question, IQuestion } from './question.model';
import { AppError } from '../../middleware/errorHandler';
import { recordAudit } from '../audit/audit.service';

interface QuestionFilterParams {
  category?: QuestionCategory;
  difficulty?: QuestionDifficulty;
  type?: QuestionType;
  topic?: string;
  programmingLanguage?: string;
  search?: string;
  isArchived?: boolean;
  page?: number;
  limit?: number;
}

export async function createQuestion(data: any, userId?: string, ipAddress?: string) {
  // Validate options for choice-based questions
  if (
    (data.type === QuestionType.SINGLE_CHOICE || data.type === QuestionType.MULTIPLE_CHOICE) &&
    (!data.options || data.options.length < 2)
  ) {
    throw new AppError('Multiple-choice questions must have at least 2 options', 400);
  }

  // Validate correct option
  if (data.type === QuestionType.SINGLE_CHOICE) {
    const correctCount = data.options?.filter((o: any) => o.isCorrect).length || 0;
    if (correctCount !== 1) {
      throw new AppError('Single-choice questions must have exactly one correct option', 400);
    }
  }

  if (data.type === QuestionType.MULTIPLE_CHOICE) {
    const correctCount = data.options?.filter((o: any) => o.isCorrect).length || 0;
    if (correctCount < 1) {
      throw new AppError('Multiple-choice questions must have at least one correct option', 400);
    }
  }

  if (data.type === QuestionType.NUMERICAL && data.numericalAnswer === undefined) {
    throw new AppError('Numerical questions require a numericalAnswer value', 400);
  }

  const question = await Question.create({
    ...data,
    createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
  });

  if (userId) {
    await recordAudit({
      userId: new mongoose.Types.ObjectId(userId),
      action: AuditAction.QUESTION_CREATED,
      resourceType: 'Question',
      resourceId: question._id.toString(),
      details: { title: question.title, category: question.category, type: question.type },
      ipAddress,
    });
  }

  return question;
}

export async function getQuestions(filter: QuestionFilterParams) {
  const page = Math.max(1, filter.page || 1);
  const limit = Math.min(1000, Math.max(1, filter.limit || 20));
  const skip = (page - 1) * limit;

  const query: any = {};
  if (filter.category) query.category = filter.category;
  if (filter.difficulty) query.difficulty = filter.difficulty;
  if (filter.type) query.type = filter.type;
  if (filter.programmingLanguage) query.programmingLanguage = filter.programmingLanguage;
  if (filter.topic) query.topic = new RegExp(filter.topic, 'i');
  if (filter.isArchived !== undefined) {
    query.isArchived = filter.isArchived;
  } else {
    query.isArchived = false;
  }

  if (filter.search) {
    const regex = new RegExp(filter.search, 'i');
    query.$or = [{ title: regex }, { text: regex }, { topic: regex }, { tags: regex }];
  }

  const [questions, total] = await Promise.all([
    Question.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Question.countDocuments(query),
  ]);

  return {
    questions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getQuestionById(id: string) {
  const question = await Question.findById(id).lean();
  if (!question) {
    throw new AppError('Question not found', 404);
  }
  return question;
}

export async function updateQuestion(id: string, data: any) {
  const question = await Question.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!question) {
    throw new AppError('Question not found', 404);
  }
  return question;
}

export async function archiveQuestion(id: string) {
  const question = await Question.findByIdAndUpdate(
    id,
    { isArchived: true },
    { new: true }
  );
  if (!question) {
    throw new AppError('Question not found', 404);
  }
  return question;
}

export async function duplicateQuestion(id: string, userId?: string) {
  const original = await Question.findById(id).lean();
  if (!original) {
    throw new AppError('Original question not found', 404);
  }

  const duplicateData = {
    ...original,
    _id: undefined,
    title: `${original.title} (Copy)`,
    createdBy: userId ? new mongoose.Types.ObjectId(userId) : original.createdBy,
    createdAt: undefined,
    updatedAt: undefined,
  };

  return Question.create(duplicateData);
}
