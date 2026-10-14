import mongoose, { Document, Schema } from 'mongoose';
import { IntegrityEventType } from '@techassess/shared';

export interface IIntegrityEvent extends Document {
  attemptId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  eventType: IntegrityEventType;
  timestamp: Date;
  durationMs: number;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const IntegrityEventSchema = new Schema<IIntegrityEvent>(
  {
    attemptId: { type: Schema.Types.ObjectId, ref: 'Attempt', required: true, index: true },
    candidateId: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    eventType: {
      type: String,
      enum: Object.values(IntegrityEventType),
      required: true,
      index: true,
    },
    timestamp: { type: Date, default: Date.now },
    durationMs: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const IntegrityEvent = mongoose.model<IIntegrityEvent>(
  'IntegrityEvent',
  IntegrityEventSchema
);
