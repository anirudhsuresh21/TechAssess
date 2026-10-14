'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Terminal,
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
        }),
      });

      // Store candidate info in localStorage for this session
      localStorage.setItem('candidate_id', result.candidate.id);
      localStorage.setItem('candidate_name', result.candidate.name);
      localStorage.setItem('candidate_roll', result.candidate.rollNumber);
      localStorage.setItem('candidate_division', result.candidate.division);
      localStorage.setItem('candidate_email', result.candidate.email);

      router.push(`/exam/${rawCode}/instructions`);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifyingCode) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400 text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying examination code...</span>
        </div>
      </div>
    );
  }

  if (codeError) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Examination Not Available</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {(codeError as any).message || 'Invalid or expired examination code.'}
          </p>
          <Link
            href="/"
            className="inline-block text-xs font-medium text-indigo-400 hover:text-indigo-300 pt-2"
          >
            ← Try another examination code
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-center items-center px-4 py-12 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            Candidate Verification
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {assessmentInfo?.title || 'Examination Registration'}
          </h1>
          <p className="text-xs text-slate-400">
            Please enter your academic credentials to initiate your examination session.
          </p>
        </div>

        {/* Examination Summary Strip */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Duration: {assessmentInfo?.durationMinutes} mins</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Total: {assessmentInfo?.totalMarks} Marks</span>
          </div>
          <div className="font-mono text-indigo-400 font-semibold">
            Code: {rawCode}
          </div>
        </div>

        {/* Candidate Registration Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Roll Number *
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                    placeholder="MCA2026-001"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Division / Section *
                </label>
                <div className="relative">
                  <Layers className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                College / Personal Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="candidate@example.edu"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Contact Phone (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 text-sm mt-2"
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
