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
} from '../constants';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(UserRole).default(UserRole.ASSESSMENT_ADMIN),
});

export const QuestionOptionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Option text is required'),
  isCorrect: z.boolean().default(false),
  explanation: z.string().optional(),
});

export const TestCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  isHidden: z.boolean().default(false),
});

export const CreateQuestionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  text: z.string().min(5, 'Question text is required'),
  codeSnippet: z.string().optional(),
  category: z.nativeEnum(QuestionCategory),
  topic: z.string().min(2, 'Topic is required'),
  difficulty: z.nativeEnum(QuestionDifficulty).default(QuestionDifficulty.MEDIUM),
  type: z.nativeEnum(QuestionType),
  options: z.array(QuestionOptionSchema).optional().default([]),
  numericalAnswer: z.number().optional(),
  numericalTolerance: z.number().min(0).default(0),
  correctTextAnswers: z.array(z.string()).optional().default([]),
  testCases: z.array(TestCaseSchema).optional().default([]),
  marks: z.number().min(0.5, 'Marks must be at least 0.5').default(1),
  negativeMarks: z.number().min(0, 'Negative marks cannot be negative').default(0),
  explanation: z.string().optional(),
  estimatedMinutes: z.number().min(1).default(2),
  tags: z.array(z.string()).default([]),
  programmingLanguage: z.string().optional(),
});

export const UpdateQuestionSchema = CreateQuestionSchema.partial();

export const AssessmentSectionSchema = z.object({
  name: z.string().min(2, 'Section name is required'),
  category: z.nativeEnum(QuestionCategory),
  description: z.string().optional(),
  timeLimitMinutes: z.number().optional(),
  questionIds: z.array(z.string()).default([]), // Common questions
  hasLanguageTracks: z.boolean().default(false),
  languageOptions: z.record(z.array(z.string())).optional().default({}),
});

export const AssessmentSetSchema = z.object({
  setCode: z.string().min(1).default('A'), // 'A', 'B', etc.
  name: z.string().min(1).default('Set A'),
  description: z.string().optional(),
  sections: z.array(AssessmentSectionSchema).default([]),
});

export const CreateAssessmentSchema = z.object({
  title: z.string().min(3, 'Assessment title is required'),
  description: z.string().optional().default(''),
  code: z.string().min(4, 'Code must be at least 4 characters').regex(/^[A-Z0-9_-]+$/, 'Code must be alphanumeric uppercase'),
  durationMinutes: z.number().min(5, 'Duration must be at least 5 minutes').max(360, 'Duration cannot exceed 6 hours'),
  passMarks: z.number().min(0).default(40),
  totalMarks: z.number().min(1).default(100),
  negativeMarkingRate: z.number().min(0).max(1).default(0.25),
  allowQuestionReturn: z.boolean().default(true),
  allowAnswerChange: z.boolean().default(true),
  randomizeQuestions: z.boolean().default(true),
  randomizeOptions: z.boolean().default(true),
  showResultsImmediately: z.boolean().default(false),
  allowReviewAnswers: z.boolean().default(false),
  isPublic: z.boolean().default(true),
  allowRetake: z.boolean().default(false),
  codingEnabled: z.boolean().default(false),
  unansweredZeroMarks: z.boolean().default(true),
  setsEnabled: z.boolean().default(true),
  sets: z.array(AssessmentSetSchema).default([]),
  maxCandidates: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sections: z.array(AssessmentSectionSchema).default([]),
  integritySettings: z.object({
    maxFocusLossCount: z.number().min(1).default(3),
    flagOnFocusLoss: z.boolean().default(true),
    enforceFullscreen: z.boolean().default(false),
  }).default({
    maxFocusLossCount: 3,
    flagOnFocusLoss: true,
    enforceFullscreen: false,
  }),
});

export const UpdateAssessmentSchema = CreateAssessmentSchema.partial();

export const CandidateRegisterSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  rollNumber: z.string().min(1, 'Roll number is required').toUpperCase(),
  division: z.string().optional().default('A'),
  email: z.string().optional().default(''),
  phone: z.string().optional(),
  accessCode: z.string().min(4, 'Access code is required').toUpperCase(),
  preferredSet: z.string().optional(),
  assignedSet: z.enum(['A', 'B']).optional().default('A'),
});

export const CandidateLoginSchema = z.object({
  accessCode: z.string().min(4, 'Access code is required').toUpperCase(),
  rollNumber: z.string().min(1, 'Roll number is required').toUpperCase(),
  password: z.string().optional(),
});

export const AdminAddCandidateSchema = z.object({
  name: z.string().min(2, 'Full student name is required'),
  rollNumber: z.string().min(1, 'Roll number is required').toUpperCase(),
  division: z.string().optional().default('A'),
  email: z.string().optional(),
  phone: z.string().optional(),
  assignedSet: z.enum(['A', 'B']).optional().default('A'),
});

export const AdminBulkAddCandidatesSchema = z.object({
  candidates: z.array(AdminAddCandidateSchema),
});

export const AdminAssignSetSchema = z.object({
  assignedSet: z.enum(['A', 'B']),
});

export const StartAttemptSchema = z.object({
  accessCode: z.string().min(4),
  candidateId: z.string().min(1),
  preferredSet: z.string().optional(),
  selectedLanguage: z.string().optional(),
});

export const SelectLanguageSchema = z.object({
  selectedLanguage: z.string().min(1, 'Programming language is required'),
});

export const SaveAnswerSchema = z.object({
  questionId: z.string().optional(),
  selectedOptionIds: z.array(z.string()).optional(),
  textAnswer: z.string().optional(),
  numericalAnswer: z.number().optional(),
  codeSubmission: z.string().optional(),
  isMarkedForReview: z.boolean().optional(),
});

export const IntegrityEventSchema = z.object({
  eventType: z.nativeEnum(IntegrityEventType),
  timestamp: z.string().default(() => new Date().toISOString()),
  durationMs: z.number().optional().default(0),
  metadata: z.record(z.any()).optional().default({}),
});

export const ShortlistCandidateSchema = z.object({
  status: z.nativeEnum(ShortlistStatus),
  reviewerNotes: z.string().optional().default(''),
});

export const BulkShortlistCriteriaSchema = z.object({
  minTotalScore: z.number().min(0),
  minPercentage: z.number().min(0).max(100).optional(),
  maxIntegrityWarnings: z.number().optional(),
});

export const ManualReviewSchema = z.object({
  awardedMarks: z.number().min(0),
  reviewerComments: z.string().optional().default(''),
});
