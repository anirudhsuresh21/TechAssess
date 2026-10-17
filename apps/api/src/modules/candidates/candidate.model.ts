import mongoose, { Document, Schema } from 'mongoose';

export interface ICandidate extends Document {
  name: string;
  rollNumber: string;
  division: string;
  email: string;
  phone?: string;
  accessCode: string;
  assignedSet?: string; // 'A' | 'B'
  isAllowed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>(
  {
    name: { type: String, required: true, trim: true },
    rollNumber: { type: String, required: true, uppercase: true, trim: true, index: true },
    division: { type: String, default: 'A', uppercase: true, trim: true },
    email: { type: String, default: '', lowercase: true, trim: true },
    phone: { type: String, trim: true },
    accessCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    assignedSet: { type: String, enum: ['A', 'B'], uppercase: true },
    isAllowed: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate candidate registration for the same assessment code
CandidateSchema.index({ rollNumber: 1, accessCode: 1 }, { unique: true });

export const Candidate = mongoose.model<ICandidate>('Candidate', CandidateSchema);
