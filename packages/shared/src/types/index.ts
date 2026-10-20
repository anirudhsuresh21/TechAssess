import { z } from 'zod';
import {
  UserRole,
  AssessmentStatus,
  QuestionCategory,
  QuestionDifficulty,
  QuestionType,
  AttemptStatus,
  IntegrityEventType,
  ShortlistStatus,
  AuditAction,
} from '../constants';
import {
  LoginSchema,
  RegisterUserSchema,
  QuestionOptionSchema,
  TestCaseSchema,
  CreateQuestionSchema,
  UpdateQuestionSchema,
  AssessmentSectionSchema,
  AssessmentSetSchema,
  CreateAssessmentSchema,
  UpdateAssessmentSchema,
  CandidateRegisterSchema,
  CandidateLoginSchema,
  AdminAddCandidateSchema,
  AdminBulkAddCandidatesSchema,
  AdminAssignSetSchema,
  StartAttemptSchema,
  SelectLanguageSchema,
  SaveAnswerSchema,
  IntegrityEventSchema,
  ShortlistCandidateSchema,
  BulkShortlistCriteriaSchema,
  ManualReviewSchema,
} from '../schemas';

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;
export type QuestionOption = z.infer<typeof QuestionOptionSchema>;
export type TestCase = z.infer<typeof TestCaseSchema>;
export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionSchema>;
export type AssessmentSection = z.infer<typeof AssessmentSectionSchema>;
export type AssessmentSet = z.infer<typeof AssessmentSetSchema>;
export type CreateAssessmentInput = z.infer<typeof CreateAssessmentSchema>;
export type UpdateAssessmentInput = z.infer<typeof UpdateAssessmentSchema>;
export type CandidateRegisterInput = z.infer<typeof CandidateRegisterSchema>;
export type CandidateLoginInput = z.infer<typeof CandidateLoginSchema>;
export type AdminAddCandidateInput = z.infer<typeof AdminAddCandidateSchema>;
export type AdminBulkAddCandidatesInput = z.infer<typeof AdminBulkAddCandidatesSchema>;
export type AdminAssignSetInput = z.infer<typeof AdminAssignSetSchema>;
export type StartAttemptInput = z.infer<typeof StartAttemptSchema>;
export type SelectLanguageInput = z.infer<typeof SelectLanguageSchema>;
export type SaveAnswerInput = z.infer<typeof SaveAnswerSchema>;
export type IntegrityEventInput = z.infer<typeof IntegrityEventSchema>;
export type ShortlistCandidateInput = z.infer<typeof ShortlistCandidateSchema>;
export type BulkShortlistCriteriaInput = z.infer<typeof BulkShortlistCriteriaSchema>;
export type ManualReviewInput = z.infer<typeof ManualReviewSchema>;

export interface SanitizedCandidateQuestion {
  _id: string;
  title: string;
  text: string;
  codeSnippet?: string;
  category: QuestionCategory;
  topic: string;
  difficulty: QuestionDifficulty;
  type: QuestionType;
  programmingLanguage?: string;
  options?: Array<{
    id: string;
    text: string;
  }>;
  marks: number;
  negativeMarks: number;
  sectionIndex?: number;
}

export interface CandidateAttemptPayload {
  attemptId: string;
  status?: AttemptStatus;
  assessmentTitle: string;
  assessmentDescription?: string;
  durationMinutes: number;
  startTime: string;
  serverDeadline: string;
  allowQuestionReturn: boolean;
  allowAnswerChange: boolean;
  codingEnabled: boolean;
  assignedSet?: string; // 'A' | 'B'
  setName?: string;     // 'Set A' | 'Set B'
  selectedLanguage?: string;
  availableLanguages?: string[];
  hasLanguageTracks?: boolean;
  sections: Array<{
    name: string;
    category: QuestionCategory;
    hasLanguageTracks?: boolean;
    languageOptions?: Record<string, string[]>;
    questionIndices: number[];
  }>;
  questions: SanitizedCandidateQuestion[];
  savedAnswers: Record<string, {
    selectedOptionIds?: string[];
    textAnswer?: string;
    numericalAnswer?: number;
    codeSubmission?: string;
    isMarkedForReview?: boolean;
    lastSavedAt?: string;
  }>;
  integritySettings: {
    maxFocusLossCount: number;
    flagOnFocusLoss: boolean;
    enforceFullscreen: boolean;
  };
}

export interface ScoreBreakdownItem {
  questionId: string;
  category: QuestionCategory;
  type: QuestionType;
  maxMarks: number;
  awardedMarks: number;
  isCorrect: boolean;
  isPartiallyCorrect?: boolean;
  isAnswered: boolean;
  negativeMarksDeducted: number;
  status: 'CORRECT' | 'INCORRECT' | 'UNANSWERED' | 'PENDING_REVIEW';
  candidateAnswer: any;
  correctAnswerSummary?: any;
  explanation?: string;
}

export interface AttemptResultSummary {
  attemptId: string;
  candidate: {
    _id: string;
    name: string;
    rollNumber: string;
    division: string;
    email: string;
  };
  assessmentId: string;
  assessmentTitle: string;
  assignedSet?: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  isPassed: boolean;
  rank?: number;
  timeSpentSeconds: number;
  startTime: string;
  submissionTime: string;
  status: AttemptStatus;
  focusLossCount: number;
  integrityFlagged: boolean;
  shortlistStatus: ShortlistStatus;
  reviewerNotes?: string;
  sectionScores: Record<string, {
    obtained: number;
    total: number;
    percentage: number;
    answered: number;
    correct: number;
  }>;
  breakdown?: ScoreBreakdownItem[];
}
