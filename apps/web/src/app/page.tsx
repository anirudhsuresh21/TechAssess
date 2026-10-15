"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Code2,
  Brain,
  Cpu,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Timer,
  Zap,
  Layers,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

export default function LandingPage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStartExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setError("Please enter a valid examination code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const code = accessCode.trim().toUpperCase();
      await apiRequest("/candidate/validate-access-code", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      router.push(`/exam/${code}`);
    } catch (err: any) {
      setError(err.message || "Invalid examination code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col selection:bg-orange-500 selection:text-white relative overflow-hidden">
      {/* Background Campus Illustration Watermark */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04] bg-no-repeat bg-center bg-cover"
        style={{ backgroundImage: `url('/media/campus-banner.png')` }}
      />

      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            {/* Sun Logo Branding */}
            <div className="relative w-11 h-11 rounded-xl p-0.5 shadow-md shadow-orange-500/10 flex items-center justify-center bg-orange-50 border border-orange-100">
              <img
                src="/media/sun-logo.png"
                alt="Tech Club Sun Emblem"
                className="w-10 h-10 object-contain rounded-lg drop-shadow-sm"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-[#06111f]">
                  Tech<span className="text-[#f37021]">Assess</span>
                </span>
                <img
                  src="/media/college-logo.png"
                  alt="SIES College Logo"
                  className="h-9 w-auto object-contain rounded"
                />
              </div>
              <span className="text-[10px] text-slate-500 block font-mono">
                Department of Computer Applications • MCA 25th Year
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-orange-400 bg-white hover:bg-slate-50 transition flex items-center gap-1.5 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5 text-[#f37021]" />
              Admin Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 flex flex-col items-center text-center relative z-10">
        {/* College & Department Emblem Badge */}
        <div className="mb-6 inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white border border-slate-200 shadow-sm backdrop-blur">
          <img
            src="/media/college-logo.png"
            alt="SIES College Logo"
            className="h-9 w-auto object-contain rounded"
          />
          <div className="text-left border-l border-slate-200 pl-3">
            <div className="text-xs font-bold text-[#06111f] tracking-wide">
              SIES College of Management Studies
            </div>
            <div className="text-[10px] text-orange-600 font-medium">
              MCA Tech Club Student Recruitment 2026
            </div>
          </div>
        </div>

        {/* <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          Sets A &amp; B Dual Question Paper Rollout Supported
        </div> */}

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight text-[#06111f]">
          Evaluate Aptitude, Logic &amp; <br />
          <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
            Technical Fundamentals
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
          The purpose-built, free, and distraction-minimized examination
          platform designed for recruiting first-year MCA students based on
          foundational problem-solving and curiosity.
        </p>

        {/* Exam Code Card */}
        <div className="mt-10 w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xl shadow-slate-200/50 backdrop-blur">
          <form onSubmit={handleStartExam} className="space-y-4">
            <div className="text-left">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="code"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Enter Examination Code
                </label>
                <span className="text-[10px] font-mono text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 font-bold">
                  Sets A / B
                </span>
              </div>
              <div className="relative">
                <input
                  id="code"
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="e.g. MCA_RECRUIT_2026"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 font-mono text-center tracking-wider text-base font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition shadow-sm"
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p className="mt-2 text-xs text-rose-600 flex items-center gap-1 font-medium">
                  <span>•</span> {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-orange-600/25 transition flex items-center justify-center gap-2 text-sm tracking-wide"
            >
              {isLoading ? (
                <span>Validating Examination Code...</span>
              ) : (
                <>
                  <span>Begin Examination</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Demo Test Code:</span>
            <button
              type="button"
              onClick={() => setAccessCode("MCA_RECRUIT_2026")}
              className="font-mono text-orange-600 hover:text-orange-700 font-bold underline underline-offset-4"
            >
              MCA_RECRUIT_2026
            </button>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-700">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>100% Free &amp; Self-Hosted</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
            <Layers className="w-4 h-4 text-orange-600" />
            <span>Sets A &amp; B Dual Question Papers</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
            <Timer className="w-4 h-4 text-amber-600" />
            <span>Authoritative Server-Side Timing</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
            <Zap className="w-4 h-4 text-orange-600" />
            <span>Real-time Answer Autosave</span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-[#004b87]" />
            <span>Anti-Cheating &amp; Focus Loss Monitor</span>
          </div>
        </div>

        {/* 5 Assessment Pillars */}
        <section className="mt-20 w-full">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#06111f]">
              Comprehensive 5-Pillar Assessment Curriculum
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Tailored for 1st-year MCA recruitment, testing aptitude, logic,
              and fundamental understanding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 text-left">
            <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-orange-400 hover:shadow-md transition shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-3 border border-orange-100">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900">
                Numerical Aptitude
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Percentages, ratios, profit &amp; loss, speed-distance, and
                binary conversions.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-orange-400 hover:shadow-md transition shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 border border-amber-100">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900">
                Logical Reasoning
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Patterns, sequences, syllogisms, and deductive problem solving.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-orange-400 hover:shadow-md transition shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#004b87] flex items-center justify-center mb-3 border border-blue-100">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900">
                Computer Fundamentals
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Operating systems, HTTP protocols, Linux commands, SQL, and Git
                basics.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-orange-400 hover:shadow-md transition shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3 border border-amber-100">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900">
                Programming &amp; Debugging
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Output prediction, identifying syntax flaws, loops, and time
                complexity.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-orange-400 hover:shadow-md transition shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-3 border border-orange-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm text-slate-900">
                Practical Problem Solving
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Network diagnostics, reading error logs, and choosing optimal
                data structures.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/media/sun-logo.png"
              alt="Sun Logo"
              className="w-5 h-5 object-contain"
            />
            <span className="font-semibold text-slate-800">TechAssess</span>
            <span>—</span>
            <span>SIES College of Management Studies (MCA Department)</span>
          </div>
          <p className="text-slate-500 font-mono text-[11px]">
            Equipped with Sets A &amp; B Dual Assessment Engine
          </p>
        </div>
      </footer>
    </div>
  );
}
