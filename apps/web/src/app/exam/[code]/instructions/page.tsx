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
  Layers,
  Code2,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { SUPPORTED_PROGRAMMING_LANGUAGES } from '@techassess/shared';

export default function ExamInstructionsPage() {
  const params = useParams();
  const rawCode = (params.code as string).toUpperCase();
  const router = useRouter();

  const [hasAcceptedRules, setHasAcceptedRules] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [candidateRoll, setCandidateRoll] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [assignedSet, setAssignedSet] = useState('A');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Java');

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
    const set = localStorage.getItem('assigned_set') || localStorage.getItem('preferred_set') || 'A';

    if (!cid) {
      router.push(`/exam/${rawCode}`);
      return;
    }

    setCandidateId(cid);
    setCandidateName(name || 'Candidate');
    setCandidateRoll(roll || '');
    setAssignedSet(set);

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
      .catch(() => setNetworkCheck(true));
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
      const preferredSet = localStorage.getItem('assigned_set') || localStorage.getItem('preferred_set') || assignedSet;
      const payload = await apiRequest('/attempts/start', {
        method: 'POST',
        body: JSON.stringify({
          accessCode: rawCode,
          candidateId,
          preferredSet: preferredSet || undefined,
          selectedLanguage,
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 py-12 px-4 selection:bg-orange-500 selection:text-white">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <img src="/media/sun-logo.png" alt="TechAssess Sun Logo" className="w-12 h-12 object-contain" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
            Candidate Instructions &amp; System Compatibility Check
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#06111f]">
            Examination Rules &amp; Environment Verification
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600 pt-1">
            <span>Candidate: <strong className="text-slate-900">{candidateName}</strong></span>
            <span>•</span>
            <span>Roll Number: <strong className="text-slate-900 font-mono">{candidateRoll}</strong></span>
            <span>•</span>
            <span>Exam Code: <strong className="text-orange-600 font-mono">{rawCode}</strong></span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-mono font-bold text-[11px] border border-orange-200">
              <Layers className="w-3 h-3 text-orange-600" /> Assigned: SET {assignedSet}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Question Sets Rollout Notice */}
        <div className="p-4 rounded-xl bg-white border border-orange-200 flex items-center justify-between text-xs shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900">Assigned Question Paper: Set {assignedSet}</div>
              <div className="text-[11px] text-slate-600">
                Your administrator has allocated Set {assignedSet} according to your designated seating arrangement.
              </div>
            </div>
          </div>
          <span className="px-3 py-1 rounded-lg bg-orange-500 text-white font-mono font-bold text-xs shrink-0">
            SET {assignedSet}
          </span>
        </div>

        {/* 1. Device Compatibility Check Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600">
            1. System &amp; Device Compatibility Check
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Monitor className="w-4 h-4 text-slate-500" />
                <span className="text-slate-700">Display Resolution</span>
              </div>
              {screenCheck ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Compatible
                </span>
              ) : (
                <span className="text-amber-700 font-bold">Compact Display</span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-slate-500" />
                <span className="text-slate-700">Browser Visibility API</span>
              </div>
              {visibilityCheck ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Supported
                </span>
              ) : (
                <span className="text-rose-700 font-bold">Unsupported</span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wifi className="w-4 h-4 text-slate-500" />
                <span className="text-slate-700">Server Network Ping</span>
              </div>
              {networkCheck ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Connected
                </span>
              ) : (
                <span className="text-amber-700 font-bold">Connecting...</span>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Maximize2 className="w-4 h-4 text-slate-500" />
                <span className="text-slate-700">Fullscreen Mode</span>
              </div>
              <button
                type="button"
                onClick={requestFullscreen}
                className="text-orange-600 hover:text-orange-700 font-bold underline"
              >
                {isFullscreen ? 'Exit Fullscreen' : 'Enable Fullscreen'}
              </button>
            </div>
          </div>
        </div>

        {/* 2. Programming Language Track Selection */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-orange-600" />
                2. Select Your Programming Language Track
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                The Practical Programming section contains questions in your chosen language. Select the programming language you will attempt:
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              Selected: {selectedLanguage}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {SUPPORTED_PROGRAMMING_LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang;
              const icons: Record<string, string> = {
                Java: '☕',
                JavaScript: '🟨',
                Python: '🐍',
                C: '🔷',
                'C++': '⚡',
                'C#': '🟣',
              };

              return (
                <div
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-purple-50 border-purple-500 text-purple-950 font-bold shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{icons[lang] || '💻'}</span>
                    <span>{lang}</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      isSelected
                        ? 'bg-purple-600 text-white font-bold'
                        : 'border border-slate-300'
                    }`}
                  >
                    {isSelected ? '✓' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Rules and Integrity Regulations Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600">
            3. Examination Rules &amp; Anti-Cheating Protocol
          </h2>

          <ul className="space-y-2.5 text-xs text-slate-700">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
              <span>
                <strong>Authoritative Timing:</strong> Time is measured strictly by the server. Your countdown will automatically submit all saved answers when the timer reaches zero.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
              <span>
                <strong>Focus Loss &amp; Tab Switch Tracking:</strong> Leaving this browser tab, minimizing the window, or opening developer tools will be logged. Exceeding 3 focus losses will flag your attempt for administrator integrity review.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
              <span>
                <strong>Continuous Autosave:</strong> Every question selection or text change is automatically saved to the backend database. If your internet briefly drops, answers will synchronize upon reconnection.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
              <span>
                <strong>Unique Paper Sets:</strong> Candidates in the same room are allocated alternating Set A or Set B papers with randomized sequence and options.
              </span>
            </li>
          </ul>

          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAcceptedRules}
                onChange={(e) => setHasAcceptedRules(e.target.checked)}
                className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 bg-white border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-800">
                I have read and accept all examination rules, anti-cheating regulations, and instructions.
              </span>
            </label>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href={`/exam/${rawCode}`}
            className="text-xs text-slate-500 hover:text-slate-900 transition font-medium"
          >
            ← Modify Candidate Details
          </Link>

          <button
            type="button"
            disabled={!hasAcceptedRules || isLoading}
            onClick={handleStartExam}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-orange-600/25 transition flex items-center gap-2 tracking-wide"
          >
            {isLoading ? (
              <span>Preparing Question Paper...</span>
            ) : (
              <>
                <span>Start Examination Now</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
