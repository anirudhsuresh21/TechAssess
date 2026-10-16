'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Hash,
  Layers,
  Lock,
  ArrowRight,
  Clock,
  Award,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function CandidateLoginPage() {
  const params = useParams();
  const rawCode = (params.code as string).toUpperCase();
  const router = useRouter();

  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Verified Candidate State (display name after login)
  const [verifiedCandidate, setVerifiedCandidate] = useState<{
    id: string;
    name: string;
    rollNumber: string;
    division: string;
    email: string;
    assignedSet: string;
  } | null>(null);

  // Validate access code & get public assessment details
  const { data: assessmentInfo, isLoading: isVerifyingCode, error: codeError } = useQuery({
    queryKey: ['validateCode', rawCode],
    queryFn: () =>
      apiRequest('/candidate/validate-access-code', {
        method: 'POST',
        body: JSON.stringify({ code: rawCode }),
      }),
    retry: false,
  });

  // Check if candidate is already verified in this session
  useEffect(() => {
    const savedRoll = localStorage.getItem('candidate_roll');
    const savedName = localStorage.getItem('candidate_name');
    const savedId = localStorage.getItem('candidate_id');
    const savedSet = localStorage.getItem('assigned_set') || 'A';
    const savedDiv = localStorage.getItem('candidate_division') || 'A';

    if (savedRoll && savedName && savedId) {
      setVerifiedCandidate({
        id: savedId,
        name: savedName,
        rollNumber: savedRoll,
        division: savedDiv,
        email: localStorage.getItem('candidate_email') || '',
        assignedSet: savedSet,
      });
      setRollNumber(savedRoll);
      setPassword(savedRoll);
    }
  }, []);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!rollNumber.trim()) {
      setError('Please enter your Student Roll Number.');
      return;
    }

    setIsLoading(true);

    try {
      const normalizedRoll = rollNumber.trim().toUpperCase();
      const enteredPassword = password.trim() ? password.trim().toUpperCase() : normalizedRoll;

      // Verify roll number with backend candidate login endpoint
      const result = await apiRequest('/candidate/login', {
        method: 'POST',
        body: JSON.stringify({
          accessCode: rawCode,
          rollNumber: normalizedRoll,
          password: enteredPassword,
        }),
      });

      const cand = result.candidate;
      setVerifiedCandidate(cand);

      // Store in localStorage
      localStorage.setItem('candidate_id', cand.id);
      localStorage.setItem('candidate_name', cand.name);
      localStorage.setItem('candidate_roll', cand.rollNumber);
      localStorage.setItem('candidate_division', cand.division || 'A');
      localStorage.setItem('candidate_email', cand.email || '');
      localStorage.setItem('assigned_set', cand.assignedSet || 'A');

    } catch (err: any) {
      setError(
        err.message || 'Roll number not authorized. Please check your credentials or contact the administrator.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceedToExam = () => {
    router.push(`/exam/${rawCode}/instructions`);
  };

  const handleClearSession = () => {
    localStorage.removeItem('candidate_id');
    localStorage.removeItem('candidate_name');
    localStorage.removeItem('candidate_roll');
    localStorage.removeItem('candidate_division');
    localStorage.removeItem('candidate_email');
    localStorage.removeItem('assigned_set');
    setVerifiedCandidate(null);
    setRollNumber('');
    setPassword('');
  };

  if (isVerifyingCode) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-500 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying examination session...</span>
        </div>
      </div>
    );
  }

  if (codeError) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Examination Not Available</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {(codeError as any).message || 'Invalid or expired examination code.'}
          </p>
          <Link
            href="/"
            className="inline-block text-xs font-bold text-orange-600 hover:text-orange-700 pt-2"
          >
            ← Try another examination code
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-center items-center px-4 py-12 selection:bg-orange-500 selection:text-white relative">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-1">
            <img src="/media/sun-logo.png" alt="TechAssess Sun Logo" className="w-12 h-12 object-contain" />
          </div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
            SIESCOMS MCA Student Examination Portal
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#06111f]">
            {assessmentInfo?.title || 'Examination Login'}
          </h1>
          <p className="text-xs text-slate-600">
            Sign in using your <strong>Student Roll Number</strong> as your login ID and password.
          </p>
        </div>

        {/* Examination Summary Strip */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs text-slate-700 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <span>Duration: {assessmentInfo?.durationMinutes} mins</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Total: {assessmentInfo?.totalMarks} Marks</span>
          </div>
          <div className="font-mono text-orange-700 font-bold">
            Code: {rawCode}
          </div>
        </div>

        {/* State A: Student Verified Card (Displays Name, Roll Number & Assigned Set) */}
        {verifiedCandidate ? (
          <div className="bg-white border-2 border-orange-400 rounded-2xl p-6 sm:p-8 shadow-xl shadow-orange-500/10 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold text-lg shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
                  Identity Verified
                </span>
                <h2 className="text-xl font-black text-slate-900 truncate">
                  {verifiedCandidate.name}
                </h2>
                <span className="font-mono text-xs text-slate-500 block">
                  Roll No: <strong>{verifiedCandidate.rollNumber}</strong> • Div: {verifiedCandidate.division}
                </span>
              </div>
            </div>

            {/* Assigned Paper Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-semibold block">
                  Assigned Question Paper
                </span>
                <span className="text-lg font-black text-orange-700">
                  Paper Set {verifiedCandidate.assignedSet || 'A'}
                </span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-orange-600 text-white font-mono font-black text-sm shadow-sm">
                SET {verifiedCandidate.assignedSet || 'A'}
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Your examination question paper has been allocated according to the seating arrangement. Click below to review examination rules and enter fullscreen mode.
            </p>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleProceedToExam}
                className="w-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-orange-600/25 transition flex items-center justify-center gap-2 text-sm tracking-wide"
              >
                <span>Proceed to Examination Instructions</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleClearSession}
                className="w-full text-xs text-slate-500 hover:text-slate-800 transition py-1 text-center"
              >
                Not {verifiedCandidate.name}? Sign in with a different Roll Number
              </button>
            </div>
          </div>
        ) : (
          /* State B: Student Roll Number Login Form */
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-4">
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Student Roll Number (Username) *
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setRollNumber(val);
                      // Default password to roll number automatically
                      if (!password || password === rollNumber) {
                        setPassword(val);
                      }
                    }}
                    placeholder="e.g. MCA2026-001"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-mono uppercase font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Password *</span>
                  <span className="text-[11px] text-orange-600 font-normal">
                    (Default: Your Roll Number)
                  </span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value.toUpperCase())}
                    placeholder="Enter your roll number"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-md shadow-orange-600/25 transition flex items-center justify-center gap-2 text-sm mt-2 tracking-wide"
              >
                {isLoading ? (
                  <span>Verifying Roll Number...</span>
                ) : (
                  <>
                    <span>Verify Student Identity &amp; Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
              <span>Candidate not on the roster? Contact the examination administrator to be registered.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
