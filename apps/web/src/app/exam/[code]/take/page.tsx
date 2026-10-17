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
  Layers,
  User,
  Code2,
  X,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  CandidateAttemptPayload,
  QuestionType,
  IntegrityEventType,
  SUPPORTED_PROGRAMMING_LANGUAGES,
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
  const [candidateInfo, setCandidateInfo] = useState<{ name: string; roll: string } | null>(null);

  // Language track change modal state
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem('candidate_name');
    const roll = localStorage.getItem('candidate_roll');
    if (name || roll) {
      setCandidateInfo({ name: name || 'Student', roll: roll || '' });
    }
  }, []);

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

    const handleIntegrityViolationResult = (res: any) => {
      setFocusLossCount(res.focusLossCount);
      setIntegrityWarning(res.warning);

      if (res.autoSubmitted || res.focusLossCount >= 3) {
        setIntegrityWarning(
          res.warning || 'Maximum integrity violations reached (3/3). Your examination has been automatically submitted for administrator review.'
        );
        if (res.submissionResult) {
          sessionStorage.setItem(`result_${attemptId}`, JSON.stringify(res.submissionResult));
        }
        setTimeout(() => {
          router.push(`/exam/${rawCode}/submitted?attemptId=${attemptId}&violation=true`);
        }, 2500);
      }
    };

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        blurStart = Date.now();
      } else {
        const durationMs = Date.now() - blurStart;
        try {
          const res = await apiRequest(`/attempts/${attemptId}/integrity-events`, {
            method: 'POST',
            body: JSON.stringify({
              eventType: IntegrityEventType.TAB_SWITCH,
              durationMs,
              metadata: { visibilityState: document.visibilityState },
            }),
          });
          handleIntegrityViolationResult(res);
        } catch (e) {
          console.error('Failed to log visibility event:', e);
        }
      }
    };

    const handleWindowBlur = async () => {
      blurStart = Date.now();
    };

    const handleWindowFocus = async () => {
      const durationMs = Date.now() - blurStart;
      if (durationMs > 1000) {
        try {
          const res = await apiRequest(`/attempts/${attemptId}/integrity-events`, {
            method: 'POST',
            body: JSON.stringify({
              eventType: IntegrityEventType.WINDOW_BLUR,
              durationMs,
            }),
          });
          handleIntegrityViolationResult(res);
        } catch (e) {
          console.error('Failed to log blur event:', e);
        }
      }
    };

    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement) {
        try {
          const res = await apiRequest(`/attempts/${attemptId}/integrity-events`, {
            method: 'POST',
            body: JSON.stringify({
              eventType: IntegrityEventType.FULLSCREEN_EXIT,
              durationMs: 0,
            }),
          });
          handleIntegrityViolationResult(res);
        } catch (e) {
          console.error('Failed to log fullscreen exit event:', e);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [attemptId, attemptData]);

  // Debounced Autosave Trigger
  const triggerAutosave = useCallback(
    (questionId: string, answerPayload: any) => {
      if (!attemptId) return;

      setAutosaveStatus('saving');

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await apiRequest(`/attempts/${attemptId}/answers`, {
            method: 'POST',
            body: JSON.stringify({
              questionId,
              selectedOptionIds: answerPayload.selectedOptionIds,
              numericalAnswer: answerPayload.numericalAnswer,
              textAnswer: answerPayload.textAnswer,
              codeSubmission: answerPayload.codeSubmission,
              isMarkedForReview: answerPayload.isMarkedForReview,
            }),
          });
          setAutosaveStatus('saved');
        } catch (err) {
          console.error('Autosave error:', err);
          setAutosaveStatus('offline');
        }
      }, 400);
    },
    [attemptId]
  );

  const currentQuestion = attemptData?.questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion._id] || {} : {};

  // Handle Option selection (Single or Multiple Choice)
  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;

    let updatedSelection: string[] = [];

    if (currentQuestion.type === QuestionType.SINGLE_CHOICE || currentQuestion.type === QuestionType.CODE_OUTPUT) {
      updatedSelection = [optionId];
    } else {
      const prev = currentAnswer.selectedOptionIds || [];
      updatedSelection = prev.includes(optionId)
        ? prev.filter((id: string) => id !== optionId)
        : [...prev, optionId];
    }

    const updatedAnswer = {
      ...currentAnswer,
      selectedOptionIds: updatedSelection,
    };

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion._id]: updatedAnswer,
    }));

    triggerAutosave(currentQuestion._id, updatedAnswer);
  };

  // Handle Numerical Answer
  const handleNumericalChange = (value: string) => {
    if (!currentQuestion) return;
    const num = value === '' ? undefined : Number(value);

    const updatedAnswer = {
      ...currentAnswer,
      numericalAnswer: num,
    };

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion._id]: updatedAnswer,
    }));

    triggerAutosave(currentQuestion._id, updatedAnswer);
  };

  // Handle Short Text / Fill blank Answer
  const handleTextChange = (value: string) => {
    if (!currentQuestion) return;

    const updatedAnswer = {
      ...currentAnswer,
      textAnswer: value,
    };

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion._id]: updatedAnswer,
    }));

    triggerAutosave(currentQuestion._id, updatedAnswer);
  };

  // Toggle Mark for Review
  const handleToggleReview = () => {
    if (!currentQuestion) return;

    const updatedAnswer = {
      ...currentAnswer,
      isMarkedForReview: !currentAnswer.isMarkedForReview,
    };

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion._id]: updatedAnswer,
    }));

    triggerAutosave(currentQuestion._id, updatedAnswer);
  };

  // Clear answer
  const handleClearAnswer = () => {
    if (!currentQuestion) return;

    const updatedAnswer = {
      ...currentAnswer,
      selectedOptionIds: [],
      numericalAnswer: undefined,
      textAnswer: undefined,
    };

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion._id]: updatedAnswer,
    }));

    triggerAutosave(currentQuestion._id, updatedAnswer);
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

  // Switch candidate programming language track dynamically
  const handleSwitchLanguage = async (newLang: string) => {
    if (!attemptId) return;
    try {
      const updatedPayload: CandidateAttemptPayload = await apiRequest(`/attempts/${attemptId}/language`, {
        method: 'PATCH',
        body: JSON.stringify({ selectedLanguage: newLang }),
      });
      setAttemptData(updatedPayload);
      if (currentQuestionIndex >= updatedPayload.questions.length) {
        setCurrentQuestionIndex(0);
      }
      setShowLanguageModal(false);
    } catch (err: any) {
      console.error('Failed to change language:', err);
    }
  };

  if (!attemptData || !currentQuestion) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-500 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-orange-500 selection:text-white select-none">
      {/* Top Fixed Examination Header */}
      <header className="border-b border-slate-200 bg-white/95 h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 p-0.5 shadow-sm flex items-center justify-center">
            <img src="/media/sun-logo.png" alt="Sun Logo" className="w-8 h-8 object-contain rounded-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight line-clamp-1">
                {attemptData.assessmentTitle}
              </h1>
              {/* Question Paper Set Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 font-mono font-bold text-xs shadow-sm">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span>{attemptData.setName ? attemptData.setName.toUpperCase() : `SET ${attemptData.assignedSet || 'A'}`}</span>
              </div>
              {/* Programming Language Track Badge & Switcher */}
              {attemptData.selectedLanguage && (
                <button
                  type="button"
                  onClick={() => setShowLanguageModal(true)}
                  title="Click to change programming track"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-mono font-bold text-xs shadow-sm transition"
                >
                  <Code2 className="w-3 h-3 text-purple-600" />
                  <span>Track: {attemptData.selectedLanguage}</span>
                  <span className="text-[9px] underline text-purple-500 font-normal">Change</span>
                </button>
              )}
            </div>
            <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Code: {rawCode}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                {autosaveStatus === 'saved' && (
                  <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Autosaved
                  </span>
                )}
                {autosaveStatus === 'saving' && (
                  <span className="text-amber-700 flex items-center gap-1 font-semibold">
                    <RefreshCw className="w-3 h-3 animate-spin text-amber-600" /> Saving...
                  </span>
                )}
                {autosaveStatus === 'offline' && (
                  <span className="text-rose-700 flex items-center gap-1 font-semibold">
                    <Wifi className="w-3 h-3 text-rose-600" /> Offline
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Center Countdown Timer */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-mono shadow-sm">
          <Clock
            className={`w-4 h-4 ${
              remainingSeconds !== null && remainingSeconds < 300
                ? 'text-rose-600 animate-pulse'
                : 'text-orange-600'
            }`}
          />
          <span
            className={`text-sm sm:text-base font-bold tracking-wider ${
              remainingSeconds !== null && remainingSeconds < 300
                ? 'text-rose-600'
                : 'text-slate-900'
            }`}
          >
            {remainingSeconds !== null ? formatSeconds(remainingSeconds) : '--:--'}
          </span>
        </div>

        {/* Candidate Info & Finish Examination Button */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {candidateInfo && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <User className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <div className="leading-tight">
                <span className="font-bold text-slate-800">{candidateInfo.name}</span>
                <span className="font-mono text-slate-500 text-[11px] ml-1.5">({candidateInfo.roll})</span>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 shrink-0"
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
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200 shadow-sm'
                  }`}
                >
                  {sec.name}
                </button>
              );
            })}
          </div>

          {/* Question Card */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            {/* Question Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-900">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                  {currentQuestion.category.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {currentQuestion.type}
                </span>
                {currentQuestion.programmingLanguage ? (
                  <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {currentQuestion.programmingLanguage} Track
                  </span>
                ) : (
                  attemptData.hasLanguageTracks && currentQuestion.category === 'PROGRAMMING_DEBUGGING' && (
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Common Programming
                    </span>
                  )
                )}
                <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {attemptData.setName || `Set ${attemptData.assignedSet || 'A'}`}
                </span>
              </div>

              <div className="text-xs font-mono font-semibold">
                <span className="text-emerald-700">+{currentQuestion.marks} Marks</span>
                {currentQuestion.negativeMarks > 0 && (
                  <span className="text-rose-700 ml-2">-{currentQuestion.negativeMarks} Marks</span>
                )}
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-4">
              <p className="text-sm sm:text-base text-slate-900 font-medium leading-relaxed">
                {currentQuestion.text}
              </p>

              {currentQuestion.codeSnippet && (
                <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 font-mono text-xs text-orange-300 overflow-x-auto shadow-inner">
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
                            ? 'bg-orange-50 border-orange-500 text-orange-950 font-semibold shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-orange-300 hover:bg-orange-50/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-orange-500 bg-orange-500'
                                : 'border-slate-300 bg-slate-100'
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

              {/* Numerical Answer input */}
              {currentQuestion.type === QuestionType.NUMERICAL && (
                <div className="max-w-xs space-y-1.5">
                  <label className="text-xs text-slate-600 font-semibold">Your Numerical Answer:</label>
                  <input
                    type="number"
                    step="any"
                    value={
                      currentAnswer.numericalAnswer !== undefined
                        ? currentAnswer.numericalAnswer
                        : ''
                    }
                    onChange={(e) => handleNumericalChange(e.target.value)}
                    placeholder="Enter numerical value..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  />
                </div>
              )}

              {/* Text / Fill blank input */}
              {(currentQuestion.type === QuestionType.FILL_BLANK ||
                currentQuestion.type === QuestionType.SHORT_TEXT) && (
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-600 font-semibold">Your Answer:</label>
                  <textarea
                    rows={3}
                    value={currentAnswer.textAnswer || ''}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="Type your response here..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
                  />
                </div>
              )}
            </div>

            {/* Bottom Actions for Current Question */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleReview}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    currentAnswer.isMarkedForReview
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
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
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-600 hover:text-rose-600 transition"
                >
                  Clear Selection
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0 || !attemptData.allowQuestionReturn}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 disabled:opacity-40 text-slate-700 text-xs font-bold transition flex items-center gap-1 shadow-sm"
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
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-500 disabled:opacity-40 text-white text-xs font-bold shadow-sm transition flex items-center gap-1"
                >
                  <span>Next Question</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette (1 col) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 h-fit shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Question Palette
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200">
              {attemptData.setName || `Set ${attemptData.assignedSet || 'A'}`}
            </span>
          </div>

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

              let btnClass = 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100';
              if (isMarked) {
                btnClass = 'bg-amber-500 border-amber-600 text-white font-bold shadow-sm';
              } else if (isAnswered) {
                btnClass = 'bg-emerald-600 border-emerald-700 text-white font-bold shadow-sm';
              }

              if (isCurrent) {
                btnClass += ' ring-2 ring-orange-500 ring-offset-2 ring-offset-white border-orange-500 font-bold';
              }

              return (
                <button
                  key={q._id}
                  type="button"
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`h-9 rounded-xl border text-xs font-mono transition flex items-center justify-center ${btnClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Palette Legend */}
          <div className="pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-600 font-medium">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Answered
              </span>
              <span className="font-mono text-slate-900 font-bold">{answeredCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Marked for Review
              </span>
              <span className="font-mono text-slate-900 font-bold">{markedCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                Unanswered
              </span>
              <span className="font-mono text-slate-900 font-bold">{unansweredCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Loss Integrity Alert Modal */}
      {integrityWarning && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl border ${
            focusLossCount >= 3 ? 'border-rose-400' : 'border-amber-400'
          }`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto border ${
              focusLossCount >= 3
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {focusLossCount >= 3 ? 'Examination Auto-Terminated' : 'Focus Loss Detected'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">{integrityWarning}</p>
            <div className={`p-3 rounded-xl border text-[11px] font-mono ${
              focusLossCount >= 3
                ? 'bg-rose-50 border-rose-200 text-rose-800 font-bold'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              Violations recorded: {focusLossCount} / 3 {focusLossCount >= 3 ? '(Limit Reached)' : ''}
            </div>
            {focusLossCount >= 3 ? (
              <button
                type="button"
                onClick={() => router.push(`/exam/${rawCode}/submitted?attemptId=${attemptId}&violation=true`)}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
              >
                Proceed to Examination Summary
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIntegrityWarning(null)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
              >
                I Understand &amp; Return to Examination
              </button>
            )}
          </div>
        </div>
      )}

      {/* Final Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">Final Examination Submission</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to finalize and submit your assessment answers for{' '}
                <span className="text-orange-600 font-mono font-bold">
                  {attemptData.setName || `Set ${attemptData.assignedSet || 'A'}`}
                </span>
                ?
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs">
              <div>
                <div className="text-[10px] text-slate-500">Answered</div>
                <div className="text-base font-bold text-emerald-700">{answeredCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Unanswered</div>
                <div className="text-base font-bold text-slate-700">{unansweredCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Marked Review</div>
                <div className="text-base font-bold text-amber-700">{markedCount}</div>
              </div>
            </div>

            <p className="text-[11px] text-amber-700 text-center font-medium bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              ⚠️ Once submitted, you cannot change your answers or retake this examination.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold shadow-sm"
              >
                Keep Answering
              </button>
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-orange-600/25 transition"
              >
                {isSubmitting ? 'Submitting...' : 'Yes, Submit Final Answers'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switch Programming Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Change Programming Language Track
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLanguageModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Select the programming language track you want to attempt. Questions for your selected language will immediately replace the previous language track:
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {SUPPORTED_PROGRAMMING_LANGUAGES.map((lang) => {
                const isSelected = attemptData.selectedLanguage === lang;
                const icons: Record<string, string> = {
                  Java: '☕',
                  JavaScript: '🟨',
                  Python: '🐍',
                  C: '🔷',
                  'C++': '⚡',
                  'C#': '🟣',
                };

                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleSwitchLanguage(lang)}
                    className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{icons[lang] || '💻'}</span>
                      <span>{lang}</span>
                    </span>
                    {isSelected && <span className="text-purple-600 font-bold">✓</span>}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLanguageModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
