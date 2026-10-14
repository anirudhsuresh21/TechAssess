'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Code2,
  Brain,
  Cpu,
  ShieldCheck,
  Terminal,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Timer,
  Zap,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function LandingPage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setError('Please enter a valid examination code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const code = accessCode.trim().toUpperCase();
      await apiRequest('/candidate/validate-access-code', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      router.push(`/exam/${code}`);
    } catch (err: any) {
      setError(err.message || 'Invalid examination code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0c1222]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Tech<span className="text-indigo-400">Assess</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-mono uppercase tracking-wider">
                Recruitment Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Recruitment Active
            </div>
            <Link
              href="/login"
              className="text-xs font-medium text-slate-300 hover:text-white px-3.5 py-2 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-900/60 transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              Admin Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          MCA Induction & Tech Club Recruitment 2026
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Evaluate Aptitude, Logic &amp; <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
            Technical Fundamentals
          </span>
        </h1>

        <p className="mt-5 text-lg text-slate-400 max-w-2xl leading-relaxed">
          The purpose-built, free, and distraction-minimized examination platform designed
          for recruiting first-year students based on foundational problem-solving and curiosity.
        </p>

        {/* Exam Code Card */}
        <div className="mt-10 w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-indigo-950/30">
          <form onSubmit={handleStartExam} className="space-y-4">
            <div className="text-left">
              <label htmlFor="code" className="block text-xs font-medium text-slate-300 mb-1.5">
                Enter Examination Code
              </label>
              <div className="relative">
                <input
                  id="code"
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MCA_RECRUIT_2026"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-white placeholder-slate-500 font-mono text-center tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p className="mt-2 text-xs text-rose-400 flex items-center gap-1">
                  <span>•</span> {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Validating Code...</span>
              ) : (
                <>
                  <span>Begin Examination</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Sample Exam Code:</span>
            <button
              type="button"
              onClick={() => setAccessCode('MCA_RECRUIT_2026')}
              className="font-mono text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-4"
            >
              MCA_RECRUIT_2026
            </button>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>100% Free &amp; Self-Hosted</span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-indigo-400" />
            <span>Authoritative Server-Side Timing</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Real-time Answer Autosave</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Integrity &amp; Focus Loss Monitoring</span>
          </div>
        </div>

        {/* 5 Assessment Pillars */}
        <section className="mt-24 w-full">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Mixed Aptitude &amp; Technical Curriculum
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Balanced questions tailored specifically for 1st-year MCA recruitment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 text-left hover:border-indigo-500/40 transition">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                <Brain className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-slate-200">Numerical Aptitude</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Profit &amp; loss, percentages, ratios, speed-distance, and binary conversions.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 text-left hover:border-violet-500/40 transition">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center mb-3">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-slate-200">Logical Reasoning</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Patterns, sequences, syllogisms, and deductive problem solving.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 text-left hover:border-emerald-500/40 transition">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <Cpu className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-slate-200">Computer Fundamentals</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                OS concepts, HTTP protocols, Linux commands, SQL, and Git fundamentals.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 text-left hover:border-amber-500/40 transition">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
                <Code2 className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-slate-200">Programming &amp; Debugging</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Output prediction, identifying syntax flaws, loops, and time complexity.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 text-left hover:border-rose-500/40 transition">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-sm text-slate-200">Practical Problem Solving</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Diagnosing network errors, reading log messages, and choosing data structures.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0c1222] py-8 text-center text-xs text-slate-500">
        <p>TechAssess — College Tech Club Recruitment Platform. Built with Next.js, Express, and MongoDB.</p>
      </footer>
    </div>
  );
}
