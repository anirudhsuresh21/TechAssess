'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  ShieldAlert,
  Wifi,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  CandidateAttemptPayload,
  QuestionType,
  IntegrityEventType,
} from '@techassess/shared';
import { formatSeconds } from '@/lib/utils';

export default function LiveExaminationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawCode = (params.code as string).toUpperCase();
  const attemptId = searchParams.get('attemptId');
  const router = useRouter();

  const [attemptData, setAttemptData] = useState<CandidateAttemptPayload | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // Local answers state: questionId -> answer object
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [autosaveStatus, setAutosaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');

  // Authoritative server-calculated remaining seconds
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Focus loss & anti-cheating warning modal
  const [integrityWarning, setIntegrityWarning] = useState<string | null>(null);
  const [focusLossCount, setFocusLossCount] = useState(0);

  // Debounce timer for autosave
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch initial or refreshed attempt state
  useEffect(() => {
    if (!attemptId) {
      router.push(`/exam/${rawCode}`);
      return;
    }

    async function loadAttempt() {
      try {
        const payload: CandidateAttemptPayload = await apiRequest(`/attempts/${attemptId}`);
        setAttemptData(payload);
        setAnswers(payload.savedAnswers || {});

        // Compute remaining seconds from server deadline
        const deadline = new Date(payload.serverDeadline).getTime();
        const now = Date.now();
        const diffSecs = Math.max(0, Math.floor((deadline - now) / 1000));
        setRemainingSeconds(diffSecs);
      } catch (err: any) {
        console.error('Failed to load attempt state:', err);
      }
    }

    loadAttempt();
  }, [attemptId, rawCode, router]);

  // 2. Countdown timer interval
  useEffect(() => {
    if (remainingSeconds === null) return;

    if (remainingSeconds <= 0) {
      // Auto-submit when time reaches 0
      handleFinalSubmit(true);
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds]);

  // 3. Anti-Cheating: Page Visibility and Window Blur monitoring
  useEffect(() => {
    if (!attemptId || !attemptData) return;

    let blurStart = Date.now();

    const handleFocusLoss = async (reason: string) => {
      const durationMs = Date.now() - blurStart;
      try {
        const res = await apiRequest(`/attempts/${attemptId}/integrity-events`, {
          method: 'POST',
          body: JSON.stringify({
            eventType: IntegrityEventType.TAB_SWITCH,
            durationMs,
            metadata: { reason },
          }),
        });

        setFocusLossCount(res.focusLossCount);
        setIntegrityWarning(res.warning);
      } catch (err) {
        console.error('Failed to log integrity event', err);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        blurStart = Date.now();
      } else {
        handleFocusLoss('visibility_change_hidden');
      }
    };

    const onWindowBlur = () => {
      blurStart = Date.now();
      handleFocusLoss('window_blur');
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [attemptId, attemptData]);

  // 4. Autosave logic with debounce
  const triggerSave = useCallback(
    (questionId: string, currentAnswer: any) => {
      setAutosaveStatus('saving');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await apiRequest(`/attempts/${attemptId}/answers/${questionId}`, {
            method: 'PUT',
            body: JSON.stringify(currentAnswer),
          });
          setAutosaveStatus('saved');
        } catch (err) {
          console.error('Autosave error:', err);
          setAutosaveStatus('offline');
        }
      }, 500); // 500ms debounce
    },
    [attemptId]
  );

  const currentQuestion = attemptData?.questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion._id] || {} : {};

  // Handlers for answer changes
  const handleSelectOption = (optId: string) => {
    if (!currentQuestion) return;
    const isMulti = currentQuestion.type === QuestionType.MULTIPLE_CHOICE;
    let newSelected: string[] = [];

    if (isMulti) {
      const prevSelected = currentAnswer.selectedOptionIds || [];
      newSelected = prevSelected.includes(optId)
        ? prevSelected.filter((id: string) => id !== optId)
        : [...prevSelected, optId];
    } else {
      newSelected = [optId];
    }

    const updated = {
      ...currentAnswer,
      selectedOptionIds: newSelected,
    };

    setAnswers((prev) => ({ ...prev, [currentQuestion._id]: updated }));
    triggerSave(currentQuestion._id, updated);
  };

  const handleNumericalChange = (val: string) => {
    if (!currentQuestion) return;
    const num = val === '' ? undefined : parseFloat(val);
    const updated = {
      ...currentAnswer,
      numericalAnswer: num,
    };
    setAnswers((prev) => ({ ...prev, [currentQuestion._id]: updated }));
    triggerSave(currentQuestion._id, updated);
  };

  const handleTextChange = (text: string) => {
    if (!currentQuestion) return;
    const updated = {
      ...currentAnswer,
      textAnswer: text,
    };
    setAnswers((prev) => ({ ...prev, [currentQuestion._id]: updated }));
    triggerSave(currentQuestion._id, updated);
  };

  const handleToggleReview = () => {
    if (!currentQuestion) return;
    const isMarked = !currentAnswer.isMarkedForReview;
    const updated = {
      ...currentAnswer,
      isMarkedForReview: isMarked,
    };
    setAnswers((prev) => ({ ...prev, [currentQuestion._id]: updated }));
    triggerSave(currentQuestion._id, updated);
  };

  const handleClearAnswer = () => {
    if (!currentQuestion) return;
    const updated = {
      selectedOptionIds: [],
      textAnswer: '',
      numericalAnswer: undefined,
      isMarkedForReview: currentAnswer.isMarkedForReview || false,
    };
    setAnswers((prev) => ({ ...prev, [currentQuestion._id]: updated }));
    triggerSave(currentQuestion._id, updated);
  };

  // Submit attempt
  const handleFinalSubmit = async (isAutoExpired = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await apiRequest(`/attempts/${attemptId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ isAutoExpired }),
      });

      // Save submission result and redirect
      sessionStorage.setItem(`result_${attemptId}`, JSON.stringify(res));
      router.push(`/exam/${rawCode}/submitted?attemptId=${attemptId}`);
    } catch (err: any) {
      console.error('Final submission error:', err);
      setIsSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  if (!attemptData || !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Restoring examination session...</span>
        </div>
      </div>
    );
  }

  // Calculate palette counts
  const totalQuestions = attemptData.questions.length;
  let answeredCount = 0;
  let markedCount = 0;

  attemptData.questions.forEach((q) => {
    const a = answers[q._id];
    if (a) {
      if (a.isMarkedForReview) markedCount++;
      if (
        (a.selectedOptionIds && a.selectedOptionIds.length > 0) ||
        a.numericalAnswer !== undefined ||
        (a.textAnswer && a.textAnswer.trim().length > 0)
      ) {
        answeredCount++;
      }
    }
  });

  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white select-none">
      {/* Top Fixed Examination Header */}
      <header className="border-b border-slate-800 bg-[#0c1222] h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight line-clamp-1">
              {attemptData.assessmentTitle}
            </h1>
            <div className="text-[10px] text-slate-400 flex items-center gap-2">
              <span>Exam Code: {rawCode}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {autosaveStatus === 'saved' && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Autosaved
                  </span>
                )}
                {autosaveStatus === 'saving' && (
                  <span className="text-amber-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                  </span>
                )}
                {autosaveStatus === 'offline' && (
                  <span className="text-rose-400 flex items-center gap-1">
                    <Wifi className="w-3 h-3" /> Offline
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Center Countdown Timer */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 font-mono shadow-inner">
          <Clock className={`w-4 h-4 ${remainingSeconds !== null && remainingSeconds < 300 ? 'text-rose-400 animate-pulse' : 'text-indigo-400'}`} />
          <span
            className={`text-sm sm:text-base font-bold tracking-wider ${
              remainingSeconds !== null && remainingSeconds < 300
                ? 'text-rose-400'
                : 'text-white'
            }`}
          >
            {remainingSeconds !== null ? formatSeconds(remainingSeconds) : '--:--'}
          </span>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish Examination</span>
          </button>
        </div>
      </header>

      {/* Main Exam Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Question & Controls (3 cols) */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
          {/* Section Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {attemptData.sections.map((sec, sIdx) => {
              const isActive = sec.questionIndices.includes(currentQuestionIndex);
              return (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => {
                    if (sec.questionIndices.length > 0) {
                      setCurrentQuestionIndex(sec.questionIndices[0]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {sec.name}
                </button>
              );
            })}
          </div>

          {/* Question Card */}
          <div className="flex-1 bg-slate-900/95 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            {/* Question Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  {currentQuestion.category.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {currentQuestion.type}
                </span>
              </div>

              <div className="text-xs font-mono text-slate-400">
                <span className="text-emerald-400">+{currentQuestion.marks} Marks</span>
                {currentQuestion.negativeMarks > 0 && (
                  <span className="text-rose-400 ml-2">-{currentQuestion.negativeMarks} Marks</span>
                )}
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed">
                {currentQuestion.text}
              </p>

              {currentQuestion.codeSnippet && (
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
                  <pre>{currentQuestion.codeSnippet}</pre>
                </div>
              )}
            </div>

            {/* Options / Inputs based on QuestionType */}
            <div className="pt-2 space-y-2.5">
              {currentQuestion.options && currentQuestion.options.length > 0 && (
                <div className="space-y-2">
                  {currentQuestion.options.map((opt) => {
                    const isSelected = (currentAnswer.selectedOptionIds || []).includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        className={`p-3.5 rounded-xl border text-xs sm:text-sm cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-950/70 border-indigo-500 text-white font-medium shadow-md shadow-indigo-950/30'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-indigo-400 bg-indigo-600'
                                : 'border-slate-600 bg-slate-900'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span>{opt.text}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Numerical Question Input */}
              {currentQuestion.type === QuestionType.NUMERICAL && (
                <div className="max-w-xs space-y-2">
                  <label className="block text-xs text-slate-400">Enter Numerical Answer:</label>
                  <input
                    type="number"
                    step="any"
                    value={
                      currentAnswer.numericalAnswer !== undefined ? currentAnswer.numericalAnswer : ''
                    }
                    onChange={(e) => handleNumericalChange(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Text / Fill Blank Input */}
              {(currentQuestion.type === QuestionType.FILL_BLANK ||
                currentQuestion.type === QuestionType.SHORT_TEXT) && (
                <div className="space-y-2">
                  <label className="block text-xs text-slate-400">Enter Your Response:</label>
                  <input
                    type="text"
                    value={currentAnswer.textAnswer || ''}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="Type answer here..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleReview}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
                    currentAnswer.isMarkedForReview
                      ? 'bg-purple-950/60 border-purple-500/60 text-purple-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>
                    {currentAnswer.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleClearAnswer}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-950 border border-slate-800 text-slate-400 hover:text-rose-400 transition"
                >
                  Clear Selection
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0 || !attemptData.allowQuestionReturn}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-medium transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  disabled={currentQuestionIndex === totalQuestions - 1}
                  onClick={() =>
                    setCurrentQuestionIndex((prev) => Math.min(totalQuestions - 1, prev + 1))
                  }
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium shadow-md shadow-indigo-600/20 transition flex items-center gap-1"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette (1 col) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 h-fit">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Question Palette
          </h2>

          {/* Palette Grid */}
          <div className="grid grid-cols-5 gap-2">
            {attemptData.questions.map((q, idx) => {
              const a = answers[q._id];
              const isAnswered =
                a &&
                ((a.selectedOptionIds && a.selectedOptionIds.length > 0) ||
                  a.numericalAnswer !== undefined ||
                  (a.textAnswer && a.textAnswer.trim().length > 0));
              const isMarked = a?.isMarkedForReview;
              const isCurrent = idx === currentQuestionIndex;

              let btnClass = 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700';
              if (isMarked) {
                btnClass = 'bg-purple-950/80 border-purple-500/80 text-purple-300';
              } else if (isAnswered) {
                btnClass = 'bg-emerald-950/80 border-emerald-600/80 text-emerald-300 font-semibold';
              }

              if (isCurrent) {
                btnClass += ' ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900';
              }

              return (
                <button
                  key={q._id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`h-9 rounded-lg border text-xs font-mono transition flex items-center justify-center ${btnClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Palette Legend */}
          <div className="pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Answered
              </span>
              <span className="font-mono text-slate-200">{answeredCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                Marked for Review
              </span>
              <span className="font-mono text-slate-200">{markedCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                Unanswered
              </span>
              <span className="font-mono text-slate-200">{unansweredCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Loss Integrity Alert Modal */}
      {integrityWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/60 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Focus Loss Detected</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{integrityWarning}</p>
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300">
              Violations recorded: {focusLossCount}
            </div>
            <button
              type="button"
              onClick={() => setIntegrityWarning(null)}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-2.5 rounded-xl text-xs transition"
            >
              I Understand &amp; Return to Examination
            </button>
          </div>
        </div>
      )}

      {/* Final Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-white">Final Examination Submission</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to finalize and submit your assessment answers?
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs">
              <div>
                <div className="text-[10px] text-slate-400">Answered</div>
                <div className="text-base font-bold text-emerald-400">{answeredCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Unanswered</div>
                <div className="text-base font-bold text-slate-300">{unansweredCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Marked Review</div>
                <div className="text-base font-bold text-purple-400">{markedCount}</div>
              </div>
            </div>

            <p className="text-[11px] text-amber-400 text-center">
              ⚠️ Once submitted, you cannot change your answers or retake this examination.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
              >
                Keep Answering
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-lg shadow-indigo-600/30 transition"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit Final Answers'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
