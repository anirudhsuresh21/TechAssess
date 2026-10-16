import mongoose from 'mongoose';
import {
  UserRole,
  AssessmentStatus,
  QuestionCategory,
  QuestionDifficulty,
  QuestionType,
  ShortlistStatus,
} from '@techassess/shared';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../modules/users/user.model';
import { Question } from '../modules/questions/question.model';
import { Assessment } from '../modules/assessments/assessment.model';
import { publishAssessment } from '../modules/assessments/assessment.service';
import { Candidate } from '../modules/candidates/candidate.model';
import { Attempt } from '../modules/attempts/attempt.model';
import { AttemptAnswer } from '../modules/attempts/attemptAnswer.model';
import { submitAttempt } from '../modules/attempts/attempt.service';
import { setCandidateShortlist } from '../modules/shortlisting/shortlist.service';
import { logger } from '../utils/logger';

async function seed() {
  try {
    await connectDatabase();
    logger.info('Connected to database. Starting seeding...');

    // 1. Create Admins
    const adminPasswordHash = await User.hashPassword('Admin@123456');
    const superAdmin = await User.findOneAndUpdate(
      { email: 'admin@techassess.local' },
      {
        name: 'Tech Club President (Super Admin)',
        email: 'admin@techassess.local',
        passwordHash: adminPasswordHash,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    const recruiter = await User.findOneAndUpdate(
      { email: 'recruiter@techassess.local' },
      {
        name: 'Technical Lead (Assessment Admin)',
        email: 'recruiter@techassess.local',
        passwordHash: adminPasswordHash,
        role: UserRole.ASSESSMENT_ADMIN,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    logger.info('Created Admin accounts');

    // 2. Curated Question Bank
    const sampleQuestions = [
      // NUMERICAL APTITUDE
      {
        title: 'Percentage Profit Calculation',
        text: 'A merchant buys a graphics card for $400 and sells it for $500. What is the merchant\'s profit percentage?',
        category: QuestionCategory.NUMERICAL_APTITUDE,
        topic: 'Profit and Loss',
        difficulty: QuestionDifficulty.EASY,
        type: QuestionType.SINGLE_CHOICE,
        options: [
          { id: 'opt_1', text: '20%', isCorrect: false },
          { id: 'opt_2', text: '25%', isCorrect: true, explanation: 'Profit = $100. (100 / 400) * 100 = 25%' },
          { id: 'opt_3', text: '30%', isCorrect: false },
          { id: 'opt_4', text: '15%', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: 'Profit = Selling Price - Cost Price = 500 - 400 = 100. Profit % = (100/400) * 100 = 25%.',
        tags: ['aptitude', 'profit', 'percentages'],
        createdBy: superAdmin._id,
      },
      {
        title: 'Binary to Decimal Conversion',
        text: 'What is the decimal equivalent of the binary number (11010)₂?',
        category: QuestionCategory.NUMERICAL_APTITUDE,
        topic: 'Number Systems',
        difficulty: QuestionDifficulty.EASY,
        type: QuestionType.NUMERICAL,
        numericalAnswer: 26,
        numericalTolerance: 0,
        marks: 2,
        negativeMarks: 0,
        explanation: '(1 * 16) + (1 * 8) + (0 * 4) + (1 * 2) + (0 * 1) = 16 + 8 + 2 = 26.',
        tags: ['binary', 'conversions', 'math'],
        createdBy: superAdmin._id,
      },
      {
        title: 'Time and Distance Calculation',
        text: 'A data packet travels through 5 routers spaced 200 km apart. If the signal velocity is 200,000 km/s and each router introduces a 1ms processing delay, what is the total transit time in milliseconds?',
        category: QuestionCategory.NUMERICAL_APTITUDE,
        topic: 'Speed & Delay',
        difficulty: QuestionDifficulty.MEDIUM,
        type: QuestionType.NUMERICAL,
        numericalAnswer: 10,
        numericalTolerance: 0.5,
        marks: 3,
        negativeMarks: 0.75,
        explanation: 'Distance = 5 * 200 = 1000 km. Transmission time = 1000 / 200000 = 0.005 s = 5 ms. Processing delay = 5 * 1 ms = 5 ms. Total = 10 ms.',
        tags: ['speed', 'networks', 'math'],
        createdBy: superAdmin._id,
      },

      // LOGICAL REASONING
      {
        title: 'Alpha-Numeric Sequence Pattern',
        text: 'Look at this series: A2, B4, C8, D16, ... What should come next?',
        category: QuestionCategory.LOGICAL_REASONING,
        topic: 'Series Completion',
        difficulty: QuestionDifficulty.EASY,
        type: QuestionType.SINGLE_CHOICE,
        options: [
          { id: 'opt_1', text: 'E24', isCorrect: false },
          { id: 'opt_2', text: 'E32', isCorrect: true, explanation: 'Letters increment by 1 (A->B->C->D->E); numbers double (2->4->8->16->32).' },
          { id: 'opt_3', text: 'F32', isCorrect: false },
          { id: 'opt_4', text: 'E64', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: 'Letter sequence advances by 1 position (E). Number sequence doubles each time (16 * 2 = 32).',
        tags: ['reasoning', 'patterns'],
        createdBy: superAdmin._id,
      },
      {
        title: 'Logical Deduction on Access Control',
        text: 'All admins have root privileges. Some engineers are admins. No intern has root privileges. Which of the following statements MUST be true?',
        category: QuestionCategory.LOGICAL_REASONING,
        topic: 'Syllogisms',
        difficulty: QuestionDifficulty.MEDIUM,
        type: QuestionType.SINGLE_CHOICE,
        options: [
          { id: 'opt_1', text: 'No intern is an engineer.', isCorrect: false },
          { id: 'opt_2', text: 'Some engineers have root privileges.', isCorrect: true },
          { id: 'opt_3', text: 'All engineers are admins.', isCorrect: false },
          { id: 'opt_4', text: 'Some interns are admins.', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: 'Since some engineers are admins and all admins have root privileges, at least those engineers who are admins have root privileges.',
        tags: ['logic', 'syllogism'],
        createdBy: superAdmin._id,
      },

      // COMPUTER FUNDAMENTALS
      {
        title: 'HTTP Status Code for Authentication',
        text: 'Which standard HTTP status code signifies that the client must authenticate itself to get the requested response?',
        category: QuestionCategory.COMPUTER_FUNDAMENTALS,
        topic: 'HTTP Protocols',
        difficulty: QuestionDifficulty.EASY,
        type: QuestionType.SINGLE_CHOICE,
        options: [
          { id: 'opt_1', text: '200 OK', isCorrect: false },
          { id: 'opt_2', text: '401 Unauthorized', isCorrect: true },
          { id: 'opt_3', text: '403 Forbidden', isCorrect: false },
          { id: 'opt_4', text: '404 Not Found', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: '401 indicates Unauthorized (authentication missing or invalid). 403 means Forbidden (authenticated, but lack permissions).',
        tags: ['http', 'web', 'fundamentals'],
        createdBy: superAdmin._id,
      },
      {
        title: 'Linux File Permissions Command',
        text: 'Which command grants read, write, and execute permissions to the file owner, and read-only permissions to group and others for a file named script.sh?',
        category: QuestionCategory.COMPUTER_FUNDAMENTALS,
        topic: 'Linux & OS',
        difficulty: QuestionDifficulty.MEDIUM,
        type: QuestionType.SINGLE_CHOICE,
        options: [
          { id: 'opt_1', text: 'chmod 777 script.sh', isCorrect: false },
          { id: 'opt_2', text: 'chmod 744 script.sh', isCorrect: true, explanation: 'Owner: 7 (rwx), Group: 4 (r--), Others: 4 (r--).' },
          { id: 'opt_3', text: 'chmod 644 script.sh', isCorrect: false },
          { id: 'opt_4', text: 'chown 744 script.sh', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: 'In octal notation: r=4, w=2, x=1. 4+2+1=7 for owner; 4 for group; 4 for others -> 744.',
        tags: ['linux', 'os', 'permissions'],
        createdBy: superAdmin._id,
      },
      {
        title: 'SQL Relational Operations',
        text: 'Select ALL SQL operations that return rows from the left table even if there are no matching rows in the right table:',
        category: QuestionCategory.COMPUTER_FUNDAMENTALS,
        topic: 'Databases & SQL',
        difficulty: QuestionDifficulty.MEDIUM,
        type: QuestionType.MULTIPLE_CHOICE,
        options: [
          { id: 'opt_1', text: 'LEFT JOIN', isCorrect: true },
          { id: 'opt_2', text: 'FULL OUTER JOIN', isCorrect: true },
          { id: 'opt_3', text: 'INNER JOIN', isCorrect: false },
          { id: 'opt_4', text: 'CROSS JOIN', isCorrect: false },
        ],
        marks: 3,
        negativeMarks: 0.75,
        explanation: 'Both LEFT JOIN and FULL OUTER JOIN guarantee that left table rows appear in the result set regardless of matches in the right table.',
        tags: ['sql', 'database'],
        createdBy: superAdmin._id,
      },

      // PROGRAMMING & DEBUGGING
      {
        title: 'Python Slicing Output Prediction',
        text: 'What is the output of the following Python program snippet?',
        codeSnippet: 'text = "TechClub"\nprint(text[1:5])',
        category: QuestionCategory.PROGRAMMING_DEBUGGING,
        topic: 'Python Basics',
        difficulty: QuestionDifficulty.EASY,
        type: QuestionType.CODE_OUTPUT,
        options: [
          { id: 'opt_1', text: 'echC', isCorrect: true },
          { id: 'opt_2', text: 'Tech', isCorrect: false },
          { id: 'opt_3', text: 'echCl', isCorrect: false },
          { id: 'opt_4', text: 'ech', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: 'Python slicing text[1:5] starts at index 1 ("e") and stops before index 5 ("l"), yielding "echC".',
        tags: ['python', 'strings'],
        createdBy: superAdmin._id,
      },
      {
        title: 'Identify the Bug in Loop',
        text: 'Consider this JavaScript function intended to sum numbers from 1 to n:\n\nfunction sumToN(n) {\n    let total = 0;\n    for (let i = 1; i < n; i++) {\n        total += i;\n    }\n    return total;\n}\n\nWhat is the flaw in this implementation?',
        category: QuestionCategory.PROGRAMMING_DEBUGGING,
        topic: 'Code Debugging',
        difficulty: QuestionDifficulty.EASY,
        type: QuestionType.SINGLE_CHOICE,
        options: [
          { id: 'opt_1', text: 'Total should be initialized to 1', isCorrect: false },
          { id: 'opt_2', text: 'The condition should be i <= n to include n', isCorrect: true },
          { id: 'opt_3', text: 'The increment operator should be i = i + 2', isCorrect: false },
          { id: 'opt_4', text: 'JavaScript does not support let inside loops', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: 'Using i < n causes an off-by-one bug where the final integer n is omitted from the sum.',
        tags: ['debugging', 'javascript', 'loops'],
        createdBy: superAdmin._id,
      },

      // PRACTICAL PROBLEM SOLVING
      {
        title: 'Diagnosing Network Connectivity Issue',
        text: 'A student machine can ping an external server IP directly (e.g. 8.8.8.8) but cannot open websites using domain names like "google.com" in the browser. What is the most likely root cause?',
        category: QuestionCategory.PRACTICAL_PROBLEM_SOLVING,
        topic: 'Network Troubleshooting',
        difficulty: QuestionDifficulty.EASY,
        type: QuestionType.SINGLE_CHOICE,
        options: [
          { id: 'opt_1', text: 'The network interface card is physically broken', isCorrect: false },
          { id: 'opt_2', text: 'DNS resolution is misconfigured or failing', isCorrect: true },
          { id: 'opt_3', text: 'The default gateway is completely down', isCorrect: false },
          { id: 'opt_4', text: 'The CPU is throttling', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: 'Because IP-based ping works, physical connectivity, IP routing, and the gateway are functional. Failing to resolve human-readable domain names points directly to DNS.',
        tags: ['troubleshooting', 'dns', 'networking'],
        createdBy: superAdmin._id,
      },
      {
        title: 'Selecting Optimal Data Structure',
        text: 'You need to store 100,000 student roll numbers and instantly verify if a roll number exists in O(1) average time. Which data structure is best suited?',
        category: QuestionCategory.PRACTICAL_PROBLEM_SOLVING,
        topic: 'Data Structure Selection',
        difficulty: QuestionDifficulty.EASY,
        type: QuestionType.SINGLE_CHOICE,
        options: [
          { id: 'opt_1', text: 'Singly Linked List', isCorrect: false },
          { id: 'opt_2', text: 'Hash Set (or Hash Table)', isCorrect: true },
          { id: 'opt_3', text: 'Binary Search Tree', isCorrect: false },
          { id: 'opt_4', text: 'Stack', isCorrect: false },
        ],
        marks: 2,
        negativeMarks: 0.5,
        explanation: 'Hash Sets utilize hash functions to provide O(1) average time complexity for element lookups and insertion.',
        tags: ['dsa', 'performance'],
        createdBy: superAdmin._id,
      },
    ];

    const savedQuestions = [];
    for (const qData of sampleQuestions) {
      let q = await Question.findOne({ title: qData.title });
      if (!q) {
        q = await Question.create(qData);
      }
      savedQuestions.push(q);
    }
    logger.info(`Seeded ${savedQuestions.length} curated questions across 5 recruitment categories`);

    // 3. Create Sample Assessment
    const assessmentCode = 'MCA_RECRUIT_2026';
    let assessment = await Assessment.findOne({ code: assessmentCode });

    const qMapByCategory: Record<string, mongoose.Types.ObjectId[]> = {};
    savedQuestions.forEach((q) => {
      if (!qMapByCategory[q.category]) qMapByCategory[q.category] = [];
      qMapByCategory[q.category].push(q._id as any);
    });

    // Split questions per category into distinct non-overlapping question papers for Set A and Set B
    const setASections = [
      {
        name: 'Aptitude & Logical Reasoning (Set A)',
        category: QuestionCategory.NUMERICAL_APTITUDE,
        description: 'Set A: Quantitative aptitude, sequence analysis, and logical deduction.',
        timeLimitMinutes: 20,
        questionIds: [
          ...((qMapByCategory[QuestionCategory.NUMERICAL_APTITUDE] || []).filter((_, idx) => idx % 2 === 0)),
          ...((qMapByCategory[QuestionCategory.LOGICAL_REASONING] || []).filter((_, idx) => idx % 2 === 0)),
        ],
      },
      {
        name: 'Computer Fundamentals (Set A)',
        category: QuestionCategory.COMPUTER_FUNDAMENTALS,
        description: 'Set A: Operating Systems, Computer Networks, and Linux internals.',
        timeLimitMinutes: 20,
        questionIds: (qMapByCategory[QuestionCategory.COMPUTER_FUNDAMENTALS] || []).filter((_, idx) => idx % 2 === 0),
      },
      {
        name: 'Programming & Practical Debugging (Set A)',
        category: QuestionCategory.PROGRAMMING_DEBUGGING,
        description: 'Set A: Code execution tracing and system troubleshooting.',
        timeLimitMinutes: 20,
        questionIds: [
          ...((qMapByCategory[QuestionCategory.PROGRAMMING_DEBUGGING] || []).filter((_, idx) => idx % 2 === 0)),
          ...((qMapByCategory[QuestionCategory.PRACTICAL_PROBLEM_SOLVING] || []).filter((_, idx) => idx % 2 === 0)),
        ],
      },
    ];

    const setBSections = [
      {
        name: 'Aptitude & Logical Reasoning (Set B)',
        category: QuestionCategory.NUMERICAL_APTITUDE,
        description: 'Set B: Quantitative aptitude, sequence analysis, and logical deduction.',
        timeLimitMinutes: 20,
        questionIds: [
          ...((qMapByCategory[QuestionCategory.NUMERICAL_APTITUDE] || []).filter((_, idx) => idx % 2 !== 0)),
          ...((qMapByCategory[QuestionCategory.LOGICAL_REASONING] || []).filter((_, idx) => idx % 2 !== 0)),
        ],
      },
      {
        name: 'Computer Fundamentals (Set B)',
        category: QuestionCategory.COMPUTER_FUNDAMENTALS,
        description: 'Set B: Operating Systems, Computer Networks, and Linux internals.',
        timeLimitMinutes: 20,
        questionIds: (qMapByCategory[QuestionCategory.COMPUTER_FUNDAMENTALS] || []).filter((_, idx) => idx % 2 !== 0),
      },
      {
        name: 'Programming & Practical Debugging (Set B)',
        category: QuestionCategory.PROGRAMMING_DEBUGGING,
        description: 'Set B: Code execution tracing and system troubleshooting.',
        timeLimitMinutes: 20,
        questionIds: [
          ...((qMapByCategory[QuestionCategory.PROGRAMMING_DEBUGGING] || []).filter((_, idx) => idx % 2 !== 0)),
          ...((qMapByCategory[QuestionCategory.PRACTICAL_PROBLEM_SOLVING] || []).filter((_, idx) => idx % 2 !== 0)),
        ],
      },
    ];

    if (!assessment) {
      assessment = await Assessment.create({
        title: 'MCA Tech Club Recruitment Assessment 2026',
        description:
          'Comprehensive 1st-year induction assessment covering quantitative aptitude, logical reasoning, computer fundamentals, and practical debugging.',
        code: assessmentCode,
        durationMinutes: 45,
        totalMarks: 25,
        passMarks: 12,
        negativeMarkingRate: 0.25,
        allowQuestionReturn: true,
        allowAnswerChange: true,
        randomizeQuestions: true,
        randomizeOptions: true,
        showResultsImmediately: true,
        allowReviewAnswers: true,
        isPublic: true,
        allowRetake: false,
        setsEnabled: true,
        sets: [
          {
            setCode: 'A',
            name: 'Set A',
            description: 'Recruitment Set A — Distinct Question Paper A',
            sections: setASections,
          },
          {
            setCode: 'B',
            name: 'Set B',
            description: 'Recruitment Set B — Distinct Question Paper B',
            sections: setBSections,
          },
        ],
        sections: setASections,
        integritySettings: {
          maxFocusLossCount: 3,
          flagOnFocusLoss: true,
          enforceFullscreen: false,
        },
        createdBy: superAdmin._id,
      });
    }

    // Publish to create immutable version snapshot
    const pubResult = await publishAssessment(assessment._id.toString(), superAdmin._id.toString());
    logger.info(`Published assessment ${assessment.code} version ${pubResult.assessment.currentVersion}`);

    // 4. Create Sample Candidates and Attempts for immediate dashboard visibility
    const candidatesData = [
      {
        name: 'Aarav Sharma',
        rollNumber: 'MCA2026-001',
        division: 'A',
        email: 'aarav.sharma@example.edu',
        scorePct: 92,
        focusLoss: 0,
        assignedSet: 'A',
        setName: 'Set A',
        hasAttempted: true,
      },
      {
        name: 'Priya Patel',
        rollNumber: 'MCA2026-002',
        division: 'A',
        email: 'priya.patel@example.edu',
        scorePct: 84,
        focusLoss: 1,
        assignedSet: 'B',
        setName: 'Set B',
        hasAttempted: true,
      },
      {
        name: 'Rohan Deshmukh',
        rollNumber: 'MCA2026-003',
        division: 'B',
        email: 'rohan.d@example.edu',
        scorePct: 68,
        focusLoss: 4, // Exceeds threshold to show integrity warning flag!
        assignedSet: 'A',
        setName: 'Set A',
        hasAttempted: true,
      },
      {
        name: 'Sneha Kulkarni',
        rollNumber: 'MCA2026-004',
        division: 'B',
        email: 'sneha.k@example.edu',
        scorePct: 44,
        focusLoss: 0,
        assignedSet: 'B',
        setName: 'Set B',
        hasAttempted: true,
      },
      {
        name: 'Vikram Joshi',
        rollNumber: 'MCA2026-005',
        division: 'A',
        email: 'vikram.j@example.edu',
        scorePct: 76,
        focusLoss: 2,
        assignedSet: 'A',
        setName: 'Set A',
        hasAttempted: true,
      },
      {
        name: 'Devansh Verma',
        rollNumber: 'MCA2026-010',
        division: 'A',
        email: 'devansh.v@example.edu',
        scorePct: 0,
        focusLoss: 0,
        assignedSet: 'A',
        setName: 'Set A',
        hasAttempted: false,
      },
      {
        name: 'Ananya Sen',
        rollNumber: 'MCA2026-011',
        division: 'B',
        email: 'ananya.s@example.edu',
        scorePct: 0,
        focusLoss: 0,
        assignedSet: 'B',
        setName: 'Set B',
        hasAttempted: false,
      },
    ];

    for (const cData of candidatesData) {
      let cand = await Candidate.findOne({ rollNumber: cData.rollNumber, accessCode: assessmentCode });
      if (!cand) {
        cand = await Candidate.create({
          name: cData.name,
          rollNumber: cData.rollNumber,
          division: cData.division,
          email: cData.email,
          accessCode: assessmentCode,
          assignedSet: cData.assignedSet,
          isAllowed: true,
        });
      }

      if (!cData.hasAttempted) {
        continue;
      }

      let att = await Attempt.findOne({ candidateId: cand._id, assessmentId: assessment._id });
      if (!att) {
        const startTime = new Date(Date.now() - 35 * 60 * 1000);
        const serverDeadline = new Date(startTime.getTime() + 45 * 60 * 1000);

        att = await Attempt.create({
          candidateId: cand._id,
          assessmentId: assessment._id,
          versionId: pubResult.version._id,
          versionNumber: pubResult.version.versionNumber,
          status: 'IN_PROGRESS',
          startTime,
          serverDeadline,
          assignedSet: cData.assignedSet,
          setName: cData.setName,
          focusLossCount: cData.focusLoss,
          integrityFlagged: cData.focusLoss >= 3,
        });

        // Simulate answers according to target score
        let qIndex = 0;
        for (const q of savedQuestions) {
          const isRight = (qIndex / savedQuestions.length) * 100 <= cData.scorePct;
          const qId = q._id.toString();

          let selectedOptionIds: string[] = [];
          let numericalAnswer: number | undefined;

          if (q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.CODE_OUTPUT) {
            const correctOpt = q.options?.find((o: any) => o.isCorrect);
            const wrongOpt = q.options?.find((o: any) => !o.isCorrect);
            selectedOptionIds = [isRight ? correctOpt?.id || 'opt_1' : wrongOpt?.id || 'opt_2'];
          } else if (q.type === QuestionType.MULTIPLE_CHOICE) {
            selectedOptionIds = isRight
              ? q.options?.filter((o: any) => o.isCorrect).map((o: any) => o.id) || []
              : ['opt_3'];
          } else if (q.type === QuestionType.NUMERICAL) {
            numericalAnswer = isRight ? q.numericalAnswer : (q.numericalAnswer || 10) + 5;
          }

          await AttemptAnswer.create({
            attemptId: att._id,
            questionId: qId,
            selectedOptionIds,
            numericalAnswer,
            lastSavedAt: new Date(),
          });
          qIndex++;
        }

        // Submit and evaluate
        await submitAttempt(att._id.toString(), false);

        // Auto-shortlist top performers
        if (cData.scorePct >= 80) {
          await setCandidateShortlist(
            assessment._id.toString(),
            cand._id.toString(),
            ShortlistStatus.SHORTLISTED,
            'High aptitude and excellent fundamentals in induction assessment.'
          );
        }
      }
    }

    logger.info('Seeded candidates, completed attempts, scores, and shortlists');

    console.log('\n======================================================');
    console.log('           TECHASSESS SEED COMPLETED                  ');
    console.log('======================================================');
    console.log('Sample Assessment Code: MCA_RECRUIT_2026');
    console.log('Super Admin Login:      admin@techassess.local / Admin@123456');
    console.log('Recruiter Admin Login:  recruiter@techassess.local / Admin@123456');
    console.log('Sample Candidate:       Roll: MCA2026-001 | Code: MCA_RECRUIT_2026');
    console.log('======================================================\n');

    await disconnectDatabase();
    process.exit(0);
  } catch (error: any) {
    logger.error('Seeding failed', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

seed();
