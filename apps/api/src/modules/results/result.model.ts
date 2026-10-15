import mongoose, { Document, Schema } from 'mongoose';
import { ScoreBreakdownItem } from '@techassess/shared';

export interface IManualReviewItem {
  questionId: string;
  reviewerId: mongoose.Types.ObjectId;
  awardedMarks: number;
  comments: string;
  reviewedAt: Date;
}

export interface IResult extends Document {
  attemptId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  assessmentId: mongoose.Types.ObjectId;
  assignedSet?: string;
  setName?: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  rank?: number;
  sectionScores: Record<string, {
    obtained: number;
    total: number;
    percentage: number;
    answered: number;
    correct: number;
  }>;
  breakdown: ScoreBreakdownItem[];
  manualReviews: IManualReviewItem[];
  createdAt: Date;
  updatedAt: Date;
}

const ResultSchema = new Schema<IResult>(
  {
    attemptId: {
      type: Schema.Types.ObjectId,
      ref: 'Attempt',
      required: true,
      unique: true,
      index: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    assignedSet: { type: String, default: 'A', index: true },
    setName: { type: String, default: 'Set A' },
    totalMarks: { type: Number, required: true },
    obtainedMarks: { type: Number, required: true, index: true },
    percentage: { type: Number, required: true },
    isPassed: { type: Boolean, default: false },
    timeSpentSeconds: { type: Number, default: 0 },
    rank: { type: Number },
    sectionScores: { type: Schema.Types.Mixed, default: {} },
    breakdown: [{ type: Schema.Types.Mixed }],
    manualReviews: [
      {
        questionId: { type: String, required: true },
        reviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
        awardedMarks: { type: Number, required: true },
        comments: { type: String, default: '' },
        reviewedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

ResultSchema.index({ assessmentId: 1, obtainedMarks: -1, timeSpentSeconds: 1 });

export const Result = mongoose.model<IResult>('Result', ResultSchema);
