import mongoose, { Document, Schema } from 'mongoose';

export interface IAttemptAnswer extends Document {
  attemptId: mongoose.Types.ObjectId;
  questionId: string;
  selectedOptionIds: string[];
  textAnswer?: string;
  numericalAnswer?: number;
  codeSubmission?: string;
  isMarkedForReview: boolean;
  lastSavedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttemptAnswerSchema = new Schema<IAttemptAnswer>(
  {
    attemptId: { type: Schema.Types.ObjectId, ref: 'Attempt', required: true, index: true },
    questionId: { type: String, required: true },
    selectedOptionIds: [{ type: String }],
    textAnswer: { type: String },
    numericalAnswer: { type: Number },
    codeSubmission: { type: String },
    isMarkedForReview: { type: Boolean, default: false },
    lastSavedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Unique index to prevent duplicate answer entries for the same question within an attempt
AttemptAnswerSchema.index({ attemptId: 1, questionId: 1 }, { unique: true });

export const AttemptAnswer = mongoose.model<IAttemptAnswer>('AttemptAnswer', AttemptAnswerSchema);
