import mongoose, { Document, Schema } from 'mongoose';
import { IQuestion } from '../questions/question.model';
import { IAssessmentIntegritySettings } from './assessment.model';

export interface IVersionSectionSnapshot {
  name: string;
  category: string;
  description?: string;
  timeLimitMinutes?: number;
  questions: any[]; // Full frozen question documents with options and answer keys
}

export interface IAssessmentVersionSnapshot {
  title: string;
  description: string;
  code: string;
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
  integritySettings: IAssessmentIntegritySettings;
  sections: IVersionSectionSnapshot[];
}

export interface IAssessmentVersion extends Document {
  assessmentId: mongoose.Types.ObjectId;
  versionNumber: number;
  snapshotData: IAssessmentVersionSnapshot;
  publishedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const AssessmentVersionSchema = new Schema<IAssessmentVersion>(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
    versionNumber: { type: Number, required: true },
    snapshotData: { type: Schema.Types.Mixed, required: true },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AssessmentVersionSchema.index({ assessmentId: 1, versionNumber: 1 }, { unique: true });

export const AssessmentVersion = mongoose.model<IAssessmentVersion>(
  'AssessmentVersion',
  AssessmentVersionSchema
);
