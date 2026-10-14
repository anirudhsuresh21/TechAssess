import mongoose, { Document, Schema } from 'mongoose';
import { AttemptStatus } from '@techassess/shared';

export interface IAttempt extends Document {
  candidateId: mongoose.Types.ObjectId;
  assessmentId: mongoose.Types.ObjectId;
  versionId: mongoose.Types.ObjectId;
  versionNumber: number;
  status: AttemptStatus;
  startTime: Date;
  serverDeadline: Date;
  submissionTime?: Date;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  focusLossCount: number;
  integrityFlagged: boolean;
  randomizedQuestionOrder: string[]; // List of question IDs in candidate's randomized sequence
  randomizedOptionMap: Record<string, string[]>; // questionId -> randomized optionIds
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AttemptSchema = new Schema<IAttempt>(
  {
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    assessmentId: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true, index: true },
    versionId: { type: Schema.Types.ObjectId, ref: 'AssessmentVersion', required: true },
    versionNumber: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(AttemptStatus),
      default: AttemptStatus.IN_PROGRESS,
      index: true,
    },
    startTime: { type: Date, required: true },
    serverDeadline: { type: Date, required: true },
    submissionTime: { type: Date },
    totalMarks: { type: Number, default: 0 },
    obtainedMarks: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    isPassed: { type: Boolean, default: false },
    timeSpentSeconds: { type: Number, default: 0 },
    focusLossCount: { type: Number, default: 0 },
    integrityFlagged: { type: Boolean, default: false },
    randomizedQuestionOrder: [{ type: String }],
    randomizedOptionMap: { type: Schema.Types.Mixed, default: {} },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attempts for the same candidate and assessment
AttemptSchema.index({ candidateId: 1, assessmentId: 1 }, { unique: true });

export const Attempt = mongoose.model<IAttempt>('Attempt', AttemptSchema);
