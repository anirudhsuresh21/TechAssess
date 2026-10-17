import mongoose, { Document, Schema } from 'mongoose';
import { AssessmentStatus, QuestionCategory } from '@techassess/shared';

export interface IAssessmentSection {
  name: string;
  category: QuestionCategory;
  description?: string;
  timeLimitMinutes?: number;
  questionIds: mongoose.Types.ObjectId[];
  hasLanguageTracks?: boolean;
  languageOptions?: Record<string, mongoose.Types.ObjectId[]>;
}

export interface IAssessmentSet {
  setCode: string; // 'A' | 'B'
  name: string;   // 'Set A' | 'Set B'
  description?: string;
  sections: IAssessmentSection[];
}

export interface IAssessmentIntegritySettings {
  maxFocusLossCount: number;
  flagOnFocusLoss: boolean;
  enforceFullscreen: boolean;
}

export interface IAssessment extends Document {
  title: string;
  description: string;
  code: string;
  status: AssessmentStatus;
  currentVersion: number;
  durationMinutes: number;
  passMarks: number;
  totalMarks: number;
  negativeMarkingRate: number;
  allowQuestionReturn: boolean;
  allowAnswerChange: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showResultsImmediately: boolean;
  allowReviewAnswers: boolean;
  isPublic: boolean;
  allowRetake: boolean;
  codingEnabled: boolean;
  unansweredZeroMarks: boolean;
  setsEnabled: boolean;
  sets: IAssessmentSet[];
  maxCandidates?: number;
  startDate?: Date;
  endDate?: Date;
  sections: IAssessmentSection[];
  integritySettings: IAssessmentIntegritySettings;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSectionSchema = new Schema<IAssessmentSection>(
  {
    name: { type: String, required: true },
    category: { type: String, enum: Object.values(QuestionCategory), required: true },
    description: { type: String },
    timeLimitMinutes: { type: Number },
    questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    hasLanguageTracks: { type: Boolean, default: false },
    languageOptions: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const AssessmentSetSchema = new Schema<IAssessmentSet>(
  {
    setCode: { type: String, required: true, default: 'A' },
    name: { type: String, required: true, default: 'Set A' },
    description: { type: String },
    sections: [AssessmentSectionSchema],
  },
  { _id: false }
);

const AssessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(AssessmentStatus),
      default: AssessmentStatus.DRAFT,
      index: true,
    },
    currentVersion: { type: Number, default: 0 },
    durationMinutes: { type: Number, required: true, default: 60 },
    passMarks: { type: Number, required: true, default: 40 },
    totalMarks: { type: Number, required: true, default: 100 },
    negativeMarkingRate: { type: Number, default: 0.25 },
    allowQuestionReturn: { type: Boolean, default: true },
    allowAnswerChange: { type: Boolean, default: true },
    randomizeQuestions: { type: Boolean, default: true },
    randomizeOptions: { type: Boolean, default: true },
    showResultsImmediately: { type: Boolean, default: false },
    allowReviewAnswers: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: true },
    allowRetake: { type: Boolean, default: false },
    codingEnabled: { type: Boolean, default: false },
    unansweredZeroMarks: { type: Boolean, default: true },
    setsEnabled: { type: Boolean, default: true },
    sets: [AssessmentSetSchema],
    maxCandidates: { type: Number },
    startDate: { type: Date },
    endDate: { type: Date },
    sections: [AssessmentSectionSchema],
    integritySettings: {
      maxFocusLossCount: { type: Number, default: 3 },
      flagOnFocusLoss: { type: Boolean, default: true },
      enforceFullscreen: { type: Boolean, default: false },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

export const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema);
