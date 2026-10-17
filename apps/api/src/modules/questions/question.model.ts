import mongoose, { Document, Schema } from 'mongoose';
import {
  QuestionCategory,
  QuestionDifficulty,
  QuestionType,
} from '@techassess/shared';

export interface IQuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface IQuestion extends Document {
  title: string;
  text: string;
  codeSnippet?: string;
  category: QuestionCategory;
  topic: string;
  difficulty: QuestionDifficulty;
  type: QuestionType;
  programmingLanguage?: string;
  options: IQuestionOption[];
  numericalAnswer?: number;
  numericalTolerance: number;
  correctTextAnswers: string[];
  testCases: ITestCase[];
  marks: number;
  negativeMarks: number;
  explanation?: string;
  estimatedMinutes: number;
  tags: string[];
  isArchived: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionOptionSchema = new Schema<IQuestionOption>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
    explanation: { type: String },
  },
  { _id: false }
);

const TestCaseSchema = new Schema<ITestCase>(
  {
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
  },
  { _id: false }
);

const QuestionSchema = new Schema<IQuestion>(
  {
    title: { type: String, required: true, trim: true },
    text: { type: String, required: true },
    codeSnippet: { type: String },
    category: {
      type: String,
      enum: Object.values(QuestionCategory),
      required: true,
      index: true,
    },
    topic: { type: String, required: true, trim: true, index: true },
    difficulty: {
      type: String,
      enum: Object.values(QuestionDifficulty),
      default: QuestionDifficulty.MEDIUM,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(QuestionType),
      required: true,
      index: true,
    },
    programmingLanguage: {
      type: String,
      enum: ['Java', 'JavaScript', 'Python', 'C', 'C++', 'C#', null],
      trim: true,
      index: true,
    },
    options: [QuestionOptionSchema],
    numericalAnswer: { type: Number },
    numericalTolerance: { type: Number, default: 0 },
    correctTextAnswers: [{ type: String, trim: true }],
    testCases: [TestCaseSchema],
    marks: { type: Number, required: true, default: 1 },
    negativeMarks: { type: Number, default: 0 },
    explanation: { type: String },
    estimatedMinutes: { type: Number, default: 2 },
    tags: [{ type: String, trim: true, index: true }],
    isArchived: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

QuestionSchema.index({ title: 'text', text: 'text', topic: 'text' });

export const Question = mongoose.model<IQuestion>('Question', QuestionSchema);
