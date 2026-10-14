'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Monitor,
  Wifi,
  Eye,
  Maximize2,
  ArrowRight,
  Info,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function ExamInstructionsPage() {
  const params = useParams();
  const rawCode = (params.code as string).toUpperCase();
  const router = useRouter();

  const [hasAcceptedRules, setHasAcceptedRules] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [candidateRoll, setCandidateRoll] = useState('');
  const [candidateId, setCandidateId] = useState('');

  // Device compatibility checks state
  const [screenCheck, setScreenCheck] = useState(false);
  const [visibilityCheck, setVisibilityCheck] = useState(false);
  const [networkCheck, setNetworkCheck] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Read candidate details
    const cid = localStorage.getItem('candidate_id');
    const name = localStorage.getItem('candidate_name');
    const roll = localStorage.getItem('candidate_roll');

    if (!cid) {
      router.push(`/exam/${rawCode}`);
      return;
    }

    setCandidateId(cid);
    setCandidateName(name || 'Candidate');
    setCandidateRoll(roll || '');

    // 1. Screen resolution check
    if (typeof window !== 'undefined') {
      setScreenCheck(window.screen.width >= 768);
    }

    // 2. Page visibility API check
    if (typeof document !== 'undefined' && typeof document.hidden !== 'undefined') {
      setVisibilityCheck(true);
    }

    // 3. Network connectivity test
    fetch('/health')
      .then((res) => {
        if (res.ok) setNetworkCheck(true);
      })
      .catch(() => setNetworkCheck(true)); // fallback ok
  }, [rawCode, router]);

  const requestFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  };

  const handleStartExam = async () => {
    if (!hasAcceptedRules) {
      setError('You must accept the examination rules before proceeding');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const payload = await apiRequest('/attempts/start', {
        method: 'POST',
        body: JSON.stringify({
          accessCode: rawCode,
          candidateId,
        }),
      });

      // Save initial attempt payload into sessionStorage
      sessionStorage.setItem(`attempt_${payload.attemptId}`, JSON.stringify(payload));

      router.push(`/exam/${rawCode}/take?attemptId=${payload.attemptId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to initialize examination session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 py-12 px-4 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            Candidate Instructions &amp; System Compatibility Check
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Examination Rules &amp; Environment Verification
          </h1>
          <p className="text-xs text-slate-400">
            Candidate: <strong className="text-slate-200">{candidateName}</strong> ({candidateRoll}) • Exam Code: <strong className="text-indigo-400 font-mono">{rawCode}</strong>
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Device Compatibility Check Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider text-indigo-400">
            1. System &amp; Device Compatibility Check
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Monitor className="w-4 h-4 text-slate-400" />
                <span>Display Resolution</span>
              </div>
              {screenCheck ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Compatible
                </span>
              ) : (
                <span className="text-amber-400 font-medium">Compact Display</span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-slate-400" />
                <span>Browser Visibility API</span>
              </div>
              {visibilityCheck ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Supported
                </span>
              ) : (
                <span className="text-rose-400 font-medium">Unsupported</span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wifi className="w-4 h-4 text-slate-400" />
                <span>Server Network Ping</span>
              </div>
              {networkCheck ? (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="text-amber-400 font-medium">Connecting...</span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Maximize2 className="w-4 h-4 text-slate-400" />
                <span>Fullscreen Mode</span>
              </div>
              <button
                type="button"
                onClick={requestFullscreen}
                className="text-indigo-400 hover:text-indigo-300 font-medium underline"
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Enable Fullscreen'}
              </button>
            </div>
          </div>
        </div>

        {/* 2. Rules and Integrity Regulations Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
          <h2 className="text-xs font-semibold text-white uppercase tracking-wider text-indigo-400">
            2. General Instructions &amp; Examination Integrity Rules
          </h2>

          <ul className="space-y-2.5 text-slate-300 list-disc pl-5 leading-relaxed">
            <li>
              <strong className="text-white">Authoritative Server Timer:</strong> The examination countdown is determined by the central server. Never rely on your laptop clock. When the timer reaches 00:00, your exam will be automatically submitted.
            </li>
            <li>
              <strong className="text-white">Real-Time Autosave:</strong> Every answer selection is automatically and asynchronously saved to the server. You can also manually review saved status anytime.
            </li>
            <li>
              <strong className="text-white">Session Recovery:</strong> If your browser accidentally refreshes or your network briefly drops, simply reload the page—your attempt and saved answers will be automatically restored.
            </li>
            <li>
              <strong className="text-white">Negative Marking Policy:</strong> Incorrect answers for marked objective questions carry a penalty. Unanswered questions receive 0 marks with no penalty.
            </li>
            <li>
              <strong className="text-white">Focus Loss &amp; Tab Switch Monitoring:</strong> The examination window monitors visibility changes and window blur events. Switching away to another tab or application will display a warning and is recorded in the integrity audit log.
            </li>
          </ul>

          <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Transparency notice: TechAssess uses standard browser Page Visibility events as diagnostic signals. No camera, microphone, or invasive device screen recordings are collected.
            </span>
          </div>
        </div>

        {/* 3. Acceptance and Start */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              checked={hasAcceptedRules}
              onChange={(e) => setHasAcceptedRules(e.target.checked)}
              className="mt-0.5 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <span>
              I have verified my system compatibility, read the examination instructions, understand the integrity monitoring rules, and agree to start my timed session.
            </span>
          </label>

          <button
            type="button"
            onClick={handleStartExam}
            disabled={!hasAcceptedRules || isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 text-sm"
          >
            {isLoading ? (
              <span>Initializing Examination Session...</span>
            ) : (
              <>
                <span>Start Timed Examination</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
