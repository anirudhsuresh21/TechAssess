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
} from 'lucide-react';
import { formatSeconds } from '@/lib/utils';

export default function ExamSubmittedPage() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attemptId');
  const [resultData, setResultData] = useState<any>(null);

  useEffect(() => {
    // Fire celebratory confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    if (attemptId) {
      const stored = sessionStorage.getItem(`result_${attemptId}`);
      if (stored) {
        try {
          setResultData(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, [attemptId]);

  const attempt = resultData?.attempt;
  const result = resultData?.result;
  const showImmediate = resultData?.showResultsImmediately;

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-center items-center px-4 py-12 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Celebration Badge */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-xl shadow-emerald-950/40">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Examination Submitted!
          </h1>
          <p className="text-xs text-slate-400">
            Your responses have been securely received and recorded on the assessment server.
          </p>
        </div>

        {/* Candidate & Timing info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5 text-xs text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <span className="text-slate-400">Submission Status:</span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              CONFIRMED
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Submission Timestamp:</span>
            <span className="text-slate-200 font-mono">
              {attempt?.submissionTime
                ? new Date(attempt.submissionTime).toLocaleTimeString()
                : new Date().toLocaleTimeString()}
            </span>
          </div>

          {attempt?.timeSpentSeconds && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Time Taken:</span>
              <span className="text-slate-200 font-mono">
                {formatSeconds(attempt.timeSpentSeconds)}
              </span>
            </div>
          )}

          {/* If immediate result release is enabled */}
          {showImmediate && result && (
            <div className="pt-3 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Score:</span>
                <span className="font-bold text-white text-sm font-mono">
                  {result.obtainedMarks} / {result.totalMarks}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Percentage:</span>
                <span className="font-bold text-emerald-400 text-sm font-mono">
                  {result.percentage}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Induction Cutoff Result:</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    result.isPassed
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {result.isPassed ? 'QUALIFIED' : 'NOT QUALIFIED'}
                </span>
              </div>
            </div>
          )}

          {!showImmediate && (
            <p className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 italic text-center">
              Candidate scores will be announced following review by the Technical Recruitment Committee.
            </p>
          )}
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
        >
          <Home className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    </div>
  );
}
