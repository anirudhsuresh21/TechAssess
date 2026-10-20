import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import {
  QuestionCategory,
  QuestionDifficulty,
  QuestionType,
  AuditAction,
  SUPPORTED_PROGRAMMING_LANGUAGES,
} from '@techassess/shared';
import { Question } from './question.model';
import { recordAudit } from '../audit/audit.service';
import mongoose from 'mongoose';

export interface RowValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

export function generateCsvTemplate(): string {
  const sampleHeaders = [
    'title',
    'text',
    'category',
    'topic',
    'difficulty',
    'type',
    'programmingLanguage',
    'options',
    'correctOptions',
    'numericalAnswer',
    'numericalTolerance',
    'correctTextAnswers',
    'marks',
    'negativeMarks',
    'codeSnippet',
    'explanation',
    'tags',
  ];

  const sampleRows = [
    [
      'Percentage Calculation',
      'If an article is bought for $200 and sold for $250, what is the profit percentage?',
      QuestionCategory.NUMERICAL_APTITUDE,
      'Profit and Loss',
      QuestionDifficulty.EASY,
      QuestionType.SINGLE_CHOICE,
      '',
      '20%;25%;30%;15%',
      '2',
      '',
      '0',
      '',
      '1',
      '0.25',
      '',
      'Profit = 50. Profit % = (50/200)*100 = 25%',
      'aptitude,profit,percentages',
    ],
    [
      'Binary to Decimal Conversion',
      'What is the decimal equivalent of binary 10110?',
      QuestionCategory.NUMERICAL_APTITUDE,
      'Number Systems',
      QuestionDifficulty.EASY,
      QuestionType.NUMERICAL,
      '',
      '',
      '',
      '22',
      '0',
      '',
      '1',
      '0',
      '',
      '16 + 0 + 4 + 2 + 0 = 22',
      'binary,math',
    ],
    [
      'HTTP Status Codes',
      'Which HTTP status code indicates "Unauthorized" access?',
      QuestionCategory.COMPUTER_FUNDAMENTALS,
      'HTTP & Web Protocols',
      QuestionDifficulty.EASY,
      QuestionType.SINGLE_CHOICE,
      '',
      '200;401;403;404',
      '2',
      '',
      '0',
      '',
      '1',
      '0.25',
      '',
      '401 indicates Unauthorized; 403 is Forbidden.',
      'http,web,networks',
    ],
    [
      'Python Output Prediction',
      'What is the output of the following Python snippet?',
      QuestionCategory.PROGRAMMING_DEBUGGING,
      'Python Basics',
      QuestionDifficulty.MEDIUM,
      QuestionType.CODE_OUTPUT,
      'Python',
      '1 2 3;0 1 2;Error;None',
      '2',
      '',
      '0',
      '',
      '2',
      '0.5',
      'for i in range(3):\n    print(i, end=" ")',
      'range(3) produces 0, 1, 2.',
      'python,loops',
    ],
    [
      'Java String Immutability',
      'Which of the following statements is true regarding String objects in Java?',
      QuestionCategory.PROGRAMMING_DEBUGGING,
      'Java Strings',
      QuestionDifficulty.EASY,
      QuestionType.SINGLE_CHOICE,
      'Java',
      'Strings are immutable;Strings can be resized directly;Strings are primitive types;Strings are allocated on stack only',
      '1',
      '',
      '0',
      '',
      '2',
      '0.5',
      'String s = "Hello"; s.concat(" World");',
      'In Java, String objects are immutable in the String constant pool.',
      'java,strings,oop',
    ],
  ];

  return stringify([sampleHeaders, ...sampleRows]);
}

export function parseAndValidateQuestions(
  csvContent: string,
  defaultLanguage?: string
): {
  validQuestions: any[];
  errors: RowValidationError[];
} {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const validQuestions: any[] = [];
  const errors: RowValidationError[] = [];

  records.forEach((row: any, idx: number) => {
    const rowNum = idx + 2; // +1 for 0-index, +1 for header row

    const rowErrors: RowValidationError[] = [];

    // Validate title
    if (!row.title || row.title.length < 3) {
      rowErrors.push({
        row: rowNum,
        field: 'title',
        message: 'Title is required and must have at least 3 characters',
        value: row.title,
      });
    }

    // Validate text
    if (!row.text || row.text.length < 5) {
      rowErrors.push({
        row: rowNum,
        field: 'text',
        message: 'Question text is required and must have at least 5 characters',
        value: row.text,
      });
    }

    // Validate category
    if (!Object.values(QuestionCategory).includes(row.category)) {
      rowErrors.push({
        row: rowNum,
        field: 'category',
        message: `Invalid category. Must be one of: ${Object.values(QuestionCategory).join(', ')}`,
        value: row.category,
      });
    }

    // Validate difficulty
    const difficulty = row.difficulty?.toUpperCase() || QuestionDifficulty.MEDIUM;
    if (!Object.values(QuestionDifficulty).includes(difficulty)) {
      rowErrors.push({
        row: rowNum,
        field: 'difficulty',
        message: `Invalid difficulty. Must be EASY, MEDIUM, or HARD`,
        value: row.difficulty,
      });
    }

    // Validate question type
    if (!Object.values(QuestionType).includes(row.type)) {
      rowErrors.push({
        row: rowNum,
        field: 'type',
        message: `Invalid question type. Must be one of: ${Object.values(QuestionType).join(', ')}`,
        value: row.type,
      });
    }

    // Parse options & correct options (supports both ';' and '|' delimiters)
    const optDelim = (row.options && row.options.includes('|') && !row.options.includes(';')) ? '|' : ';';
    const rawOptions = row.options ? row.options.split(optDelim).map((s: string) => s.trim()).filter(Boolean) : [];
    const correctDelim = (row.correctOptions && row.correctOptions.includes('|') && !row.correctOptions.includes(';')) ? '|' : ';';
    const rawCorrect = row.correctOptions ? row.correctOptions.split(correctDelim).map((s: string) => s.trim()) : [];

    const isChoiceType =
      row.type === QuestionType.SINGLE_CHOICE ||
      row.type === QuestionType.MULTIPLE_CHOICE ||
      row.type === QuestionType.CODE_OUTPUT ||
      row.type === QuestionType.TRUE_FALSE;

    if (isChoiceType && rawOptions.length < 2) {
      rowErrors.push({
        row: rowNum,
        field: 'options',
        message: 'Choice-based questions must provide at least 2 semicolon-separated options',
        value: row.options,
      });
    }

    const optionsList = rawOptions.map((optText: string, optIdx: number) => {
      const optId = `opt_${optIdx + 1}`;
      const isCorrect =
        rawCorrect.includes(String(optIdx + 1)) ||
        rawCorrect.includes(String.fromCharCode(65 + optIdx)) || // 'A', 'B', etc.
        rawCorrect.includes(optText);

      return {
        id: optId,
        text: optText,
        isCorrect,
      };
    });

    if (row.type === QuestionType.SINGLE_CHOICE || row.type === QuestionType.CODE_OUTPUT || row.type === QuestionType.TRUE_FALSE) {
      const correctCount = optionsList.filter((o: any) => o.isCorrect).length;
      if (correctCount !== 1) {
        rowErrors.push({
          row: rowNum,
          field: 'correctOptions',
          message: `Expected exactly 1 correct option index, found ${correctCount}`,
          value: row.correctOptions,
        });
      }
    }

    let numericalVal: number | undefined;
    if (row.type === QuestionType.NUMERICAL) {
      numericalVal = parseFloat(row.numericalAnswer);
      if (isNaN(numericalVal)) {
        rowErrors.push({
          row: rowNum,
          field: 'numericalAnswer',
          message: 'Numerical questions require a valid numerical answer',
          value: row.numericalAnswer,
        });
      }
    }

    const marks = parseFloat(row.marks) || 1;
    const negativeMarks = parseFloat(row.negativeMarks) || 0;

    const tags = row.tags
      ? row.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];

    // Validate programming language if provided (either in row or via defaultLanguage)
    const rawLang = (row.programmingLanguage || row.language || defaultLanguage || '').trim();
    let programmingLanguage: string | undefined = undefined;

    if (rawLang) {
      const matched = SUPPORTED_PROGRAMMING_LANGUAGES.find(
        (l) => l.toLowerCase() === rawLang.toLowerCase()
      );
      if (!matched) {
        rowErrors.push({
          row: rowNum,
          field: 'programmingLanguage',
          message: `Invalid programming language "${rawLang}". Supported options: ${SUPPORTED_PROGRAMMING_LANGUAGES.join(', ')}`,
          value: rawLang,
        });
      } else {
        programmingLanguage = matched;
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      validQuestions.push({
        title: row.title,
        text: row.text,
        category: row.category,
        topic: row.topic || 'General',
        difficulty,
        type: row.type,
        programmingLanguage: programmingLanguage || undefined,
        options: optionsList,
        numericalAnswer: numericalVal,
        numericalTolerance: parseFloat(row.numericalTolerance) || 0,
        correctTextAnswers: row.correctTextAnswers
          ? row.correctTextAnswers.split(';').map((t: string) => t.trim().toLowerCase())
          : [],
        marks,
        negativeMarks,
        codeSnippet: row.codeSnippet || undefined,
        explanation: row.explanation || undefined,
        tags,
        estimatedMinutes: 2,
      });
    }
  });

  return { validQuestions, errors };
}

export async function bulkInsertQuestions(
  questions: any[],
  userId?: string,
  ipAddress?: string
) {
  const docs = questions.map((q) => ({
    ...q,
    createdBy: userId ? new mongoose.Types.ObjectId(userId) : undefined,
  }));

  const inserted = await Question.insertMany(docs);

  if (userId) {
    await recordAudit({
      userId: new mongoose.Types.ObjectId(userId),
      action: AuditAction.QUESTION_IMPORTED,
      resourceType: 'Question',
      details: { count: inserted.length },
      ipAddress,
    });
  }

  return inserted;
}
