import mongoose, { Document, Schema } from 'mongoose';
import { AuditAction } from '@techassess/shared';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  userEmail?: string;
  role?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userEmail: { type: String },
    role: { type: String },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },
    resourceType: { type: String, required: true, index: true },
    resourceId: { type: String, index: true },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
