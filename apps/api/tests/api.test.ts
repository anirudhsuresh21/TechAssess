import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User } from '../src/modules/users/user.model';
import { Question } from '../src/modules/questions/question.model';
import { Assessment } from '../src/modules/assessments/assessment.model';
import {
  UserRole,
  QuestionCategory,
  QuestionDifficulty,
  QuestionType,
  IntegrityEventType,
} from '@techassess/shared';

describe('TechAssess API Integration & Workflow Tests', () => {
  let adminToken: string;
  let createdAssessmentId: string;
  let testQuestionId: string;
  let candidateId: string;
  let attemptId: string;
  const examCode = 'TEST_EXAM_2026';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const { config } = await import('../src/config/environment');
    config.mongodbUri = '';
    await connectDatabase();

    // Create Super Admin for test suite
    const passwordHash = await User.hashPassword('Admin@123456');
    await User.deleteMany({});
    await User.create({
      name: 'Test Administrator',
      email: 'admin@test.local',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    });
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('1. Authentication & Security', () => {
    it('should reject login with invalid credentials', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@test.local',
        password: 'WrongPassword',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should authenticate super admin and return JWT', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@test.local',
        password: 'Admin@123456',
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe(UserRole.SUPER_ADMIN);
      adminToken = res.body.data.token;
    });

    it('should access /auth/me with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('admin@test.local');
    });

    it('should block unauthenticated access to protected routes', async () => {
      const res = await request(app).get('/api/v1/assessments');
      expect(res.status).toBe(401);
    });
  });

  describe('2. Question Bank & Bulk Import Validation', () => {
    it('should create an objective single-choice question', async () => {
      const res = await request(app)
        .post('/api/v1/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'What does CPU stand for?',
          text: 'Choose the correct expansion of CPU in computer architecture:',
          category: QuestionCategory.COMPUTER_FUNDAMENTALS,
          topic: 'Hardware Basics',
          difficulty: QuestionDifficulty.EASY,
          type: QuestionType.SINGLE_CHOICE,
          options: [
            { id: 'opt_1', text: 'Central Processing Unit', isCorrect: true },
            { id: 'opt_2', text: 'Computer Personal Unit', isCorrect: false },
            { id: 'opt_3', text: 'Central Performance Utility', isCorrect: false },
            { id: 'opt_4', text: 'Control Processing Universal', isCorrect: false },
          ],
          marks: 2,
          negativeMarks: 0.5,
          explanation: 'CPU stands for Central Processing Unit.',
          tags: ['hardware', 'fundamentals'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data._id).toBeDefined();
      testQuestionId = res.body.data._id;
    });

    it('should reject single-choice questions with zero or multiple correct options', async () => {
      const res = await request(app)
        .post('/api/v1/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalid MCQ Question',
          text: 'This question has no correct option configured:',
          category: QuestionCategory.COMPUTER_FUNDAMENTALS,
          topic: 'Hardware Basics',
          type: QuestionType.SINGLE_CHOICE,
          options: [
            { id: 'opt_1', text: 'Option 1', isCorrect: false },
            { id: 'opt_2', text: 'Option 2', isCorrect: false },
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('exactly one correct option');
    });

    it('should validate CSV import and report row-level errors for invalid rows', async () => {
      const invalidCsv = `title,text,category,topic,difficulty,type,options,correctOptions,marks
Valid Q,What is 2+2?,NUMERICAL_APTITUDE,Math,EASY,SINGLE_CHOICE,3;4;5,2,1
Broken Q,No,INVALID_CAT,Math,EASY,SINGLE_CHOICE,A;B,1,1`;

      const res = await request(app)
        .post('/api/v1/questions/validate-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ csvContent: invalidCsv });

      expect(res.status).toBe(200);
      expect(res.body.data.validCount).toBe(1);
      expect(res.body.data.errorCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.errors[0].row).toBe(3);
    });
  });

  describe('3. Assessment Builder, Sections & Versioning', () => {
    it('should create a recruitment assessment with sections', async () => {
      const res = await request(app)
        .post('/api/v1/assessments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'MCA Tech Recruitment Assessment',
          description: 'Official test examination',
          code: examCode,
          durationMinutes: 30,
          totalMarks: 20,
          passMarks: 10,
          negativeMarkingRate: 0.25,
          allowQuestionReturn: true,
          allowAnswerChange: true,
          randomizeQuestions: true,
          randomizeOptions: true,
          sections: [
            {
              name: 'Fundamentals Section',
              category: QuestionCategory.COMPUTER_FUNDAMENTALS,
              questionIds: [testQuestionId],
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.code).toBe(examCode);
      expect(res.body.data.currentVersion).toBe(0);
      createdAssessmentId = res.body.data._id;
    });

    it('should publish assessment and generate an immutable version snapshot', async () => {
      const res = await request(app)
        .post(`/api/v1/assessments/${createdAssessmentId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.assessment.status).toBe('PUBLISHED');
      expect(res.body.data.assessment.currentVersion).toBe(1);
      expect(res.body.data.version.snapshotData.sections[0].questions.length).toBe(1);
    });
  });

  describe('4. Candidate Flow & Access Code Verification', () => {
    it('should validate the examination code and return public examination rules', async () => {
      const res = await request(app)
        .post('/api/v1/candidate/validate-access-code')
        .send({ code: examCode });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('MCA Tech Recruitment Assessment');
      expect(res.body.data.durationMinutes).toBe(30);
      expect(res.body.data.allowQuestionReturn).toBe(true);
    });

    it('should register candidate details without requiring prior login', async () => {
      const res = await request(app)
        .post('/api/v1/candidate/register')
        .send({
          name: 'Aniket Gupta',
          rollNumber: 'MCA2026-999',
          division: 'A',
          email: 'aniket@example.edu',
          accessCode: examCode,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.candidate.id).toBeDefined();
      expect(res.body.data.candidate.rollNumber).toBe('MCA2026-999');
      candidateId = res.body.data.candidate.id;
    });
  });

  describe('5. Examination Session, Autosave, Sanitization & Anti-Cheating', () => {
    it('should start examination session and strip answer keys from payload', async () => {
      const res = await request(app)
        .post('/api/v1/attempts/start')
        .send({
          accessCode: examCode,
          candidateId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.attemptId).toBeDefined();
      attemptId = res.body.data.attemptId;

      const question = res.body.data.questions[0];
      expect(question).toBeDefined();
      expect(question.title).toBe('What does CPU stand for?');
      // Crucial Security Verification: Candidate payload MUST NOT leak isCorrect or explanation
      question.options.forEach((opt: any) => {
        expect(opt.isCorrect).toBeUndefined();
        expect(opt.explanation).toBeUndefined();
      });
      expect(question.explanation).toBeUndefined();
    });

    it('should restore existing attempt without creating a duplicate attempt on refresh', async () => {
      const res = await request(app)
        .post('/api/v1/attempts/start')
        .send({
          accessCode: examCode,
          candidateId,
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.data.attemptId).toBe(attemptId);
    });

    it('should autosave candidate answers reliably on server with PUT /:id/answers/:questionId', async () => {
      const res = await request(app)
        .put(`/api/v1/attempts/${attemptId}/answers/${testQuestionId}`)
        .send({
          selectedOptionIds: ['opt_1'],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.savedAt).toBeDefined();
    });

    it('should autosave candidate answers reliably with POST /:id/answers (body questionId)', async () => {
      const res = await request(app)
        .post(`/api/v1/attempts/${attemptId}/answers`)
        .send({
          questionId: testQuestionId,
          selectedOptionIds: ['opt_1'],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.success).toBe(true);
      expect(res.body.data.savedAt).toBeDefined();
    });

    it('should record tab switch integrity events and increment warning count', async () => {
      const res = await request(app)
        .post(`/api/v1/attempts/${attemptId}/integrity-events`)
        .send({
          eventType: IntegrityEventType.TAB_SWITCH,
          durationMs: 2500,
          metadata: { windowBlur: true },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.focusLossCount).toBe(1);
      expect(res.body.data.autoSubmitted).toBe(false);
      expect(res.body.data.warning).toContain('Focus loss warning 1 of 3');
    });
  });

  describe('6. Server-Side Submission, Idempotent Scoring & Results', () => {
    it('should submit examination and evaluate answers on server-side', async () => {
      const res = await request(app)
        .post(`/api/v1/attempts/${attemptId}/submit`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.data.attempt.status).toBe('SUBMITTED');
      expect(res.body.data.result.obtainedMarks).toBe(2); // opt_1 was correct (2 marks)
      expect(res.body.data.result.breakdown[0].isCorrect).toBe(true);
    });

    it('should prevent duplicate submission or double scoring (idempotency)', async () => {
      const res = await request(app)
        .post(`/api/v1/attempts/${attemptId}/submit`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.data.alreadySubmitted).toBe(true);
      expect(res.body.data.attempt.obtainedMarks).toBe(2);
    });

    it('should allow admin to inspect candidate rankings and analytics', async () => {
      const res = await request(app)
        .get(`/api/v1/results/assessments/${createdAssessmentId}/results`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].candidate.rollNumber).toBe('MCA2026-999');
      expect(res.body.data[0].rank).toBe(1);
    });

    it('should export candidate results as CSV', async () => {
      const res = await request(app)
        .get(`/api/v1/results/assessments/${createdAssessmentId}/export`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('MCA2026-999');
    });

    it('should shortlist candidate and add reviewer notes', async () => {
      const res = await request(app)
        .post(`/api/v1/shortlist/assessments/${createdAssessmentId}/candidates/${candidateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'SHORTLISTED',
          reviewerNotes: 'Strong computer fundamentals knowledge.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SHORTLISTED');
    });
  });

  describe('7. Question Paper Sets A & B Dual Rollout & Evaluation', () => {
    let candidate2Id: string;
    let attempt2Id: string;

    it('should register a second candidate for the assessment', async () => {
      const res = await request(app).post('/api/v1/candidate/register').send({
        name: 'Set B Candidate',
        rollNumber: 'MCA2026-888',
        division: 'B',
        email: 'setb@test.local',
        accessCode: examCode,
      });

      expect(res.status).toBe(200);
      candidate2Id = res.body.data.candidate.id;
    });

    it('should allocate Set B to the candidate and include set metadata', async () => {
      const res = await request(app).post('/api/v1/attempts/start').send({
        accessCode: examCode,
        candidateId: candidate2Id,
        preferredSet: 'B',
      });

      expect(res.status).toBe(201);
      expect(res.body.data.assignedSet).toBe('B');
      expect(res.body.data.setName).toBe('Set B');
      attempt2Id = res.body.data.attemptId;
    });

    it('should submit Set B examination and record result with assigned set', async () => {
      const res = await request(app)
        .post(`/api/v1/attempts/${attempt2Id}/submit`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.data.attempt.status).toBe('SUBMITTED');
    });

    it('should filter results by Set A and Set B', async () => {
      const resSetA = await request(app)
        .get(`/api/v1/results/assessments/${createdAssessmentId}/results?set=A`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resSetA.status).toBe(200);
      expect(resSetA.body.data.length).toBe(1);
      expect(resSetA.body.data[0].assignedSet).toBe('A');

      const resSetB = await request(app)
        .get(`/api/v1/results/assessments/${createdAssessmentId}/results?set=B`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resSetB.status).toBe(200);
      expect(resSetB.body.data.length).toBe(1);
      expect(resSetB.body.data[0].assignedSet).toBe('B');
    });

    it('should return per-set comparative analytics for Set A vs Set B', async () => {
      const res = await request(app)
        .get(`/api/v1/results/assessments/${createdAssessmentId}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.setAnalytics).toBeDefined();
      expect(res.body.data.setAnalytics['A']).toBeDefined();
      expect(res.body.data.setAnalytics['B']).toBeDefined();
      expect(res.body.data.setAnalytics['A'].totalAttempts).toBeGreaterThanOrEqual(1);
      expect(res.body.data.setAnalytics['B'].totalAttempts).toBeGreaterThanOrEqual(1);
    });
  });

  describe('8. Integrity Violations & Automatic Examination Termination', () => {
    let violatorAttemptId: string;

    it('should register candidate and start attempt for integrity testing', async () => {
      const regRes = await request(app)
        .post('/api/v1/candidate/register')
        .send({
          name: 'Cheating Test Candidate',
          rollNumber: 'MCA2026-CH01',
          division: 'B',
          email: 'cheater@example.edu',
          accessCode: examCode,
        });
      expect(regRes.status).toBe(200);
      const violatorCandidateId = regRes.body.data.candidate.id;

      const startRes = await request(app)
        .post('/api/v1/attempts/start')
        .send({
          accessCode: examCode,
          candidateId: violatorCandidateId,
        });
      expect(startRes.status).toBe(201);
      violatorAttemptId = startRes.body.data.attemptId;
    });

    it('should automatically terminate and submit examination on 3rd integrity violation', async () => {
      // Event 1
      const e1 = await request(app)
        .post(`/api/v1/attempts/${violatorAttemptId}/integrity-events`)
        .send({ eventType: IntegrityEventType.TAB_SWITCH, durationMs: 2000 });
      expect(e1.body.data.focusLossCount).toBe(1);
      expect(e1.body.data.autoSubmitted).toBe(false);

      // Event 2
      const e2 = await request(app)
        .post(`/api/v1/attempts/${violatorAttemptId}/integrity-events`)
        .send({ eventType: IntegrityEventType.WINDOW_BLUR, durationMs: 2000 });
      expect(e2.body.data.focusLossCount).toBe(2);
      expect(e2.body.data.autoSubmitted).toBe(false);

      // Event 3: 3rd violation triggers automatic submission!
      const e3 = await request(app)
        .post(`/api/v1/attempts/${violatorAttemptId}/integrity-events`)
        .send({ eventType: IntegrityEventType.FULLSCREEN_EXIT, durationMs: 0 });
      expect(e3.status).toBe(200);
      expect(e3.body.data.focusLossCount).toBe(3);
      expect(e3.body.data.autoSubmitted).toBe(true);
      expect(e3.body.data.integrityFlagged).toBe(true);
      expect(e3.body.data.submissionResult.attempt.status).toBe('SUBMITTED');
      expect(e3.body.data.submissionResult.attempt.integrityFlagged).toBe(true);
      expect(e3.body.data.warning).toContain('Maximum integrity violations reached (3/3)');

      // Subsequent answer save should be rejected because exam is finalized
      const saveAfterSubmit = await request(app)
        .post(`/api/v1/attempts/${violatorAttemptId}/answers`)
        .send({ questionId: testQuestionId, selectedOptionIds: ['opt_1'] });
      expect(saveAfterSubmit.status).toBe(400);
      expect(saveAfterSubmit.body.error).toContain('finalized');
    });
  });
});
