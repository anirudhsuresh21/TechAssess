'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Terminal, Lock, Mail, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/components/Providers';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      login(result.token, result.user);
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Admin@123456');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-center items-center px-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
                Tech<span className="text-indigo-400">Assess</span>
              </span>
              <span className="text-xs text-slate-400 block -mt-1 font-mono uppercase tracking-wider">
                Admin Console
              </span>
            </div>
          </Link>
          <h2 className="mt-6 text-xl font-semibold text-slate-200">
            Sign in to Recruitment Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Access assessments, question banks, candidate evaluations, and shortlists.
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@techassess.local"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Fill */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Quick Fill Demo Accounts:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin@techassess.local')}
                className="text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-indigo-500/40 transition group"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                  Super Admin
                </div>
                <div className="text-[10px] text-slate-500 truncate">admin@techassess.local</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('recruiter@techassess.local')}
                className="text-left p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-indigo-500/40 transition group"
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                  Recruiter Admin
                </div>
                <div className="text-[10px] text-slate-500 truncate">recruiter@techassess.local</div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300 transition">
            ← Return to Candidate Examination Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
