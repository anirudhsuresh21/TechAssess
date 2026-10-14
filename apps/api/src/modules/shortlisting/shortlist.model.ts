import mongoose, { Document, Schema } from 'mongoose';
import { ShortlistStatus } from '@techassess/shared';

export interface IShortlistDecision extends Document {
  candidateId: mongoose.Types.ObjectId;
  assessmentId: mongoose.Types.ObjectId;
  status: ShortlistStatus;
  reviewerNotes: string;
  decidedBy?: mongoose.Types.ObjectId;
  decidedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ShortlistDecisionSchema = new Schema<IShortlistDecision>(
  {
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
    status: {
      type: String,
      enum: Object.values(ShortlistStatus),
      default: ShortlistStatus.PENDING,
      index: true,
    },
    reviewerNotes: { type: String, default: '' },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decidedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

ShortlistDecisionSchema.index({ candidateId: 1, assessmentId: 1 }, { unique: true });

export const ShortlistDecision = mongoose.model<IShortlistDecision>(
  'ShortlistDecision',
  ShortlistDecisionSchema
);
