"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, ArrowRight, ShieldAlert, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/components/Providers";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      login(result.token, result.user);
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Admin@123456");
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-center items-center px-4 selection:bg-orange-500 selection:text-white relative">
      <div className="w-full max-w-md">
        {/* Logo and College Brand */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-orange-50 border border-orange-100 p-1 shadow-sm flex items-center justify-center">
              <img
                src="/media/sun-logo.png"
                alt="TechAssess Sun Logo"
                className="w-11 h-11 object-contain rounded-xl"
              />
            </div>
            <div className="text-left">
              <span className="text-2xl font-black tracking-tight text-[#06111f] flex items-center gap-1.5">
                Tech<span className="text-[#f37021]">Assess</span>
              </span>
              <span className="text-xs text-slate-500 block -mt-1 font-mono uppercase tracking-wider font-semibold">
                SIESCOMS Admin Console
              </span>
            </div>
          </Link>

          <h2 className="mt-6 text-xl font-bold text-slate-900">
            Sign in to Recruitment Portal
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Access assessments, question banks, Sets A &amp; B evaluation, and
            candidate shortlists.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@techassess.local"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl shadow-md shadow-orange-600/25 transition flex items-center justify-center gap-2 text-sm tracking-wide"
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
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              Quick Fill Demo Accounts:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo("admin@techassess.local")}
                className="text-left p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-400 hover:bg-orange-50/40 transition group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-orange-600">
                  Super Admin
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  admin@techassess.local
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("recruiter@techassess.local")}
                className="text-left p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-orange-400 hover:bg-orange-50/40 transition group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-orange-600">
                  Recruiter Admin
                </div>
                <div className="text-[10px] text-slate-500 truncate">
                  recruiter@techassess.local
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          <Link
            href="/"
            className="hover:text-orange-600 transition font-medium"
          >
            ← Return to Candidate Examination Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
