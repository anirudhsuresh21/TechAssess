'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Hash,
  Layers,
  Mail,
  Phone,
  ArrowRight,
  Clock,
  Award,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function CandidateRegisterPage() {
  const params = useParams();
  const rawCode = (params.code as string).toUpperCase();
  const router = useRouter();

  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [division, setDivision] = useState('A');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredSet, setPreferredSet] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !rollNumber.trim() || !email.trim()) {
      setError('Name, roll number, and email are required');
      return;
    }

    setIsLoading(true);

    try {
      const result = await apiRequest('/candidate/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          rollNumber: rollNumber.trim().toUpperCase(),
          division: division.trim().toUpperCase(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          accessCode: rawCode,
          preferredSet: preferredSet || undefined,
        }),
      });

      // Store candidate info in localStorage for this session
      localStorage.setItem('candidate_id', result.candidate.id);
      localStorage.setItem('candidate_name', result.candidate.name);
      localStorage.setItem('candidate_roll', result.candidate.rollNumber);
      localStorage.setItem('candidate_division', result.candidate.division);
      localStorage.setItem('candidate_email', result.candidate.email);
      if (preferredSet) {
        localStorage.setItem('preferred_set', preferredSet);
      }

      router.push(`/exam/${rawCode}/instructions`);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifyingCode) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-500 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying examination code...</span>
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
            SIESCOMS MCA Recruitment Verification
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#06111f]">
            {assessmentInfo?.title || 'Examination Registration'}
          </h1>
          <p className="text-xs text-slate-600">
            Please enter your candidate credentials to initiate your examination session.
          </p>
        </div>

        {/* Dual Sets Notice Strip */}
        <div className="p-3.5 rounded-xl bg-white border border-orange-200 flex items-center justify-between text-xs text-slate-700 shadow-sm">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-600 shrink-0" />
            <span className="text-[11px] text-slate-600">
              <strong className="text-orange-700 font-mono">Sets A &amp; B Active:</strong> Question papers are automatically and fairly balanced between Set A and Set B.
            </span>
          </div>
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

        {/* Candidate Registration Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Roll Number *
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                    placeholder="MCA2026-001"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-mono uppercase placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Division / Section *
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    disabled={isLoading}
                  >
                    <option value="A">Division A</option>
                    <option value="B">Division B</option>
                    <option value="C">Division C</option>
                    <option value="MCA-1">MCA 1st Year</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                College / Personal Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@example.edu"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contact Phone (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Question Paper Set Allocation
                </label>
                <select
                  value={preferredSet}
                  onChange={(e) => setPreferredSet(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                  disabled={isLoading}
                >
                  <option value="">Auto-Assign (Alternating Set A / B)</option>
                  <option value="A">Set A (Question Paper A)</option>
                  <option value="B">Set B (Question Paper B)</option>
                </select>
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
                <span>Registering Candidate...</span>
              ) : (
                <>
                  <span>Proceed to Instructions &amp; Check</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
