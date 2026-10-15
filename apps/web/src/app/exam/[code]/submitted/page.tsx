'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Home,
  Layers,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { formatSeconds } from '@/lib/utils';

export default function ExamSubmittedPage() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attemptId');
  const [resultData, setResultData] = useState<any>(null);

  const attempt = resultData?.attempt;
  const result = resultData?.result;
  const showImmediate = resultData?.showResultsImmediately;
  const assignedSet = attempt?.setName || result?.setName || (attempt?.assignedSet ? `Set ${attempt.assignedSet}` : 'Set A');

  const isViolation =
    searchParams.get('violation') === 'true' ||
    Boolean(attempt?.integrityFlagged) ||
    Boolean(attempt?.focusLossCount && attempt.focusLossCount >= 3) ||
    attempt?.metadata?.terminationReason === 'INTEGRITY_VIOLATION_LIMIT_REACHED' ||
    attempt?.metadata?.autoSubmittedDueToViolations === true;

  useEffect(() => {
    if (attemptId) {
      const stored = sessionStorage.getItem(`result_${attemptId}`);
      if (stored) {
        try {
          setResultData(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, [attemptId]);

  useEffect(() => {
    // Only fire celebratory confetti when NOT flagged for cheating
    if (!isViolation) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f37021', '#ff7a00', '#f59e0b', '#004b87', '#10b981'],
      });
    }
  }, [isViolation]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-center items-center px-4 py-12 selection:bg-orange-500 selection:text-white">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Sun Branding */}
        <div className="flex justify-center">
          <img src="/media/sun-logo.png" alt="TechAssess Sun Logo" className="w-14 h-14 object-contain" />
        </div>

        {/* Celebration or Warning Badge */}
        {isViolation ? (
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 shadow-md">
            <ShieldAlert className="w-8 h-8" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        )}

        <div className="space-y-1.5">
          <h1 className="text-2xl font-black tracking-tight text-[#06111f]">
            {isViolation ? 'Examination Auto-Submitted' : 'Examination Submitted!'}
          </h1>
          <p className="text-xs text-slate-600">
            {isViolation
              ? 'Your answers have been finalized and recorded. The examination was terminated due to integrity policy violations.'
              : 'Your responses have been securely received, evaluated, and permanently recorded on the assessment server.'}
          </p>
        </div>

        {/* Security Violation Alert Box */}
        {isViolation && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-left flex items-start gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-bold text-rose-900">Integrity Violation Limit Reached (3/3)</div>
              <p className="text-rose-700 leading-relaxed text-[11px]">
                The anti-cheating monitor logged 3 tab-switching or focus loss violations. Your examination has been automatically submitted and flagged for administrative review.
              </p>
            </div>
          </div>
        )}

        {/* Candidate & Timing info */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5 text-xs text-left shadow-lg shadow-slate-200/50">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Submission Status:</span>
            {isViolation ? (
              <span className="font-bold text-rose-700 flex items-center gap-1 font-mono">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                FLAGGED FOR REVIEW
              </span>
            ) : (
              <span className="font-bold text-emerald-700 flex items-center gap-1 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                CONFIRMED
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Question Paper Set:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200">
              <Layers className="w-3 h-3" />
              {assignedSet}
            </span>
          </div>

          {isViolation && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Integrity Violations:</span>
              <span className="text-rose-700 font-mono font-bold">
                {attempt?.focusLossCount || 3} / 3 (Limit Exceeded)
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Submission Timestamp:</span>
            <span className="text-slate-800 font-mono">
              {attempt?.submissionTime
                ? new Date(attempt.submissionTime).toLocaleTimeString()
                : new Date().toLocaleTimeString()}
            </span>
          </div>

          {attempt?.timeSpentSeconds && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Time Taken:</span>
              <span className="text-slate-800 font-mono">
                {formatSeconds(attempt.timeSpentSeconds)}
              </span>
            </div>
          )}

          {/* If immediate result release is enabled */}
          {showImmediate && result && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Total Score:</span>
                <span className="font-bold text-slate-900 text-sm font-mono">
                  {result.obtainedMarks} / {result.totalMarks}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Percentage:</span>
                <span className="font-bold text-emerald-700 font-mono text-sm">
                  {result.percentage}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Result Status:</span>
                <span
                  className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] ${
                    result.isPassed
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {result.isPassed ? 'QUALIFIED / PASSED' : 'DID NOT MEET CUTOFF'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition shadow-sm"
          >
            <Home className="w-4 h-4 text-orange-600" />
            <span>Return to Recruitment Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
