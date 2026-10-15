import {
  QuestionType,
  QuestionCategory,
  ScoreBreakdownItem,
} from '@techassess/shared';
import { IAssessmentVersionSnapshot } from '../assessments/assessmentVersion.model';

export interface EvaluatedScoreResult {
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  isPassed: boolean;
  sectionScores: Record<string, {
    obtained: number;
    total: number;
    percentage: number;
    answered: number;
    correct: number;
  }>;
  breakdown: ScoreBreakdownItem[];
}

export function evaluateAttemptAnswers(
  snapshot: IAssessmentVersionSnapshot,
  answersMap: Record<string, {
    selectedOptionIds?: string[];
    textAnswer?: string;
    numericalAnswer?: number;
    codeSubmission?: string;
  }>,
  assignedSet?: string
): EvaluatedScoreResult {
  let totalAssessmentMarks = 0;
  let totalObtainedMarks = 0;
  const breakdown: ScoreBreakdownItem[] = [];
  const sectionScores: Record<string, {
    obtained: number;
    total: number;
    percentage: number;
    answered: number;
    correct: number;
  }> = {};

  const targetSections =
    (assignedSet && snapshot.sets?.find((s) => s.setCode === assignedSet)?.sections) ||
    snapshot.sections;

  for (const section of targetSections) {
    let sectionObtained = 0;
    let sectionTotal = 0;
    let sectionAnswered = 0;
    let sectionCorrect = 0;

    for (const question of section.questions) {
      const qId = question._id.toString();
      const maxMarks = question.marks || 1;
      const negativeMarks =
        question.negativeMarks !== undefined
          ? question.negativeMarks
          : (snapshot.negativeMarkingRate || 0) * maxMarks;

      sectionTotal += maxMarks;
      totalAssessmentMarks += maxMarks;

      const candidateAnswer = answersMap[qId];
      let isAnswered = false;
      let isCorrect = false;
      let isPartiallyCorrect = false;
      let awardedMarks = 0;
      let negativeDeducted = 0;
      let status: 'CORRECT' | 'INCORRECT' | 'UNANSWERED' | 'PENDING_REVIEW' = 'UNANSWERED';
      let correctAnswerSummary: any = null;

      if (candidateAnswer) {
        if (
          question.type === QuestionType.SINGLE_CHOICE ||
          question.type === QuestionType.TRUE_FALSE ||
          question.type === QuestionType.CODE_OUTPUT
        ) {
          const selected = candidateAnswer.selectedOptionIds;
          if (selected && selected.length > 0) {
            isAnswered = true;
            const correctOption = question.options?.find((o: any) => o.isCorrect);
            correctAnswerSummary = correctOption ? correctOption.text : null;

            if (correctOption && selected.includes(correctOption.id)) {
              isCorrect = true;
              awardedMarks = maxMarks;
              status = 'CORRECT';
            } else {
              isCorrect = false;
              negativeDeducted = negativeMarks;
              awardedMarks = -negativeMarks;
              status = 'INCORRECT';
            }
          }
        } else if (question.type === QuestionType.MULTIPLE_CHOICE) {
          const selected = candidateAnswer.selectedOptionIds || [];
          if (selected.length > 0) {
            isAnswered = true;
            const correctOptionIds = (question.options || [])
              .filter((o: any) => o.isCorrect)
              .map((o: any) => o.id);

            correctAnswerSummary = (question.options || [])
              .filter((o: any) => o.isCorrect)
              .map((o: any) => o.text);

            const hasAllCorrect =
              correctOptionIds.length === selected.length &&
              correctOptionIds.every((id: string) => selected.includes(id));

            if (hasAllCorrect) {
              isCorrect = true;
              awardedMarks = maxMarks;
              status = 'CORRECT';
            } else {
              // Check partial correctness
              const correctlySelectedCount = selected.filter((id: string) =>
                correctOptionIds.includes(id)
              ).length;
              const wrongCount = selected.filter((id: string) =>
                !correctOptionIds.includes(id)
              ).length;

              if (correctlySelectedCount > 0 && wrongCount === 0) {
                // Award proportional partial credit without penalty
                isPartiallyCorrect = true;
                awardedMarks = Math.round((correctlySelectedCount / correctOptionIds.length) * maxMarks * 100) / 100;
                status = 'CORRECT';
              } else {
                negativeDeducted = negativeMarks;
                awardedMarks = -negativeMarks;
                status = 'INCORRECT';
              }
            }
          }
        } else if (question.type === QuestionType.NUMERICAL) {
          if (candidateAnswer.numericalAnswer !== undefined && candidateAnswer.numericalAnswer !== null) {
            isAnswered = true;
            const expected = question.numericalAnswer;
            const tolerance = question.numericalTolerance || 0;
            correctAnswerSummary = `${expected} (±${tolerance})`;

            if (
              expected !== undefined &&
              Math.abs(candidateAnswer.numericalAnswer - expected) <= tolerance
            ) {
              isCorrect = true;
              awardedMarks = maxMarks;
              status = 'CORRECT';
            } else {
              negativeDeducted = negativeMarks;
              awardedMarks = -negativeMarks;
              status = 'INCORRECT';
            }
          }
        } else if (
          question.type === QuestionType.FILL_BLANK ||
          question.type === QuestionType.SHORT_TEXT
        ) {
          if (candidateAnswer.textAnswer && candidateAnswer.textAnswer.trim().length > 0) {
            isAnswered = true;
            const cleanedCandidateText = candidateAnswer.textAnswer.trim().toLowerCase();
            const acceptedAnswers = (question.correctTextAnswers || []).map((t: string) =>
              t.trim().toLowerCase()
            );
            correctAnswerSummary = question.correctTextAnswers;

            if (acceptedAnswers.includes(cleanedCandidateText)) {
              isCorrect = true;
              awardedMarks = maxMarks;
              status = 'CORRECT';
            } else {
              // If subjective short text with no predefined answer key, send to manual review
              if (acceptedAnswers.length === 0) {
                status = 'PENDING_REVIEW';
                awardedMarks = 0;
              } else {
                negativeDeducted = negativeMarks;
                awardedMarks = -negativeMarks;
                status = 'INCORRECT';
              }
            }
          }
        } else if (question.type === QuestionType.CODE_WRITING) {
          if (candidateAnswer.codeSubmission && candidateAnswer.codeSubmission.trim().length > 0) {
            isAnswered = true;
            status = 'PENDING_REVIEW';
            awardedMarks = 0;
          }
        }
      }

      if (isAnswered) {
        sectionAnswered++;
      }
      if (isCorrect) {
        sectionCorrect++;
      }

      sectionObtained += awardedMarks;
      totalObtainedMarks += awardedMarks;

      breakdown.push({
        questionId: qId,
        category: question.category,
        type: question.type,
        maxMarks,
        awardedMarks,
        isCorrect,
        isPartiallyCorrect,
        isAnswered,
        negativeMarksDeducted: negativeDeducted,
        status,
        candidateAnswer,
        correctAnswerSummary,
        explanation: question.explanation,
      });
    }

    // Floor section scores at 0 so excessive negative marks don't corrupt aggregates below zero
    const finalSectionObtained = Math.max(0, Math.round(sectionObtained * 100) / 100);
    const sectionPct =
      sectionTotal > 0 ? Math.round((finalSectionObtained / sectionTotal) * 1000) / 10 : 0;

    sectionScores[section.name] = {
      obtained: finalSectionObtained,
      total: sectionTotal,
      percentage: sectionPct,
      answered: sectionAnswered,
      correct: sectionCorrect,
    };
  }

  // Ensure total score is not negative
  const finalTotalObtained = Math.max(0, Math.round(totalObtainedMarks * 100) / 100);
  const percentage =
    totalAssessmentMarks > 0
      ? Math.round((finalTotalObtained / totalAssessmentMarks) * 1000) / 10
      : 0;

  const isPassed = finalTotalObtained >= (snapshot.passMarks || 40);

  return {
    totalMarks: totalAssessmentMarks,
    obtainedMarks: finalTotalObtained,
    percentage,
    isPassed,
    sectionScores,
    breakdown,
  };
}
