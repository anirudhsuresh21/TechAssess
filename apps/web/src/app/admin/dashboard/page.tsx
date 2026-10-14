'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FileCheck2,
  Users,
  Award,
  ShieldAlert,
  ArrowRight,
  PlusCircle,
  Upload,
  BookOpen,
  Sparkles,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/components/Providers';

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const { data: assessments, isLoading } = useQuery({
    queryKey: ['assessments'],
    queryFn: () => apiRequest('/assessments?limit=5'),
  });

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Recruitment Season 2026
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Conduct examinations, review candidate performance, and shortlist first-year students.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/questions/import"
            className="px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import Questions</span>
          </Link>
          <Link
            href="/admin/assessments/new"
            className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Assessment</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Assessments
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">
            {isLoading ? '...' : assessments?.length || 0}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Active and draft examinations</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Recruitment Candidates
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">5+</div>
          <p className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Active candidates registered</span>
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Average Score
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">72.8%</div>
          <p className="mt-1 text-[11px] text-slate-500">Across aptitude &amp; technical questions</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Integrity Status
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-white">Focus Monitor</div>
          <p className="mt-1 text-[11px] text-slate-500">Non-invasive visibility checking active</p>
        </div>
      </div>

      {/* Assessments Section */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-white">Active Examinations</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an assessment to review candidate scores, analytics, and shortlists.
            </p>
          </div>
          <Link
            href="/admin/assessments"
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading examinations...</div>
        ) : !assessments || assessments.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm">No assessments found.</p>
            <Link
              href="/admin/assessments/new"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Create your first examination
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-medium">Title &amp; Code</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Version</th>
                  <th className="pb-3 font-medium">Duration</th>
                  <th className="pb-3 font-medium">Marks</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {assessments.map((exam: any) => (
                  <tr key={exam._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 pr-4">
                      <div className="font-semibold text-slate-200">{exam.title}</div>
                      <div className="text-[11px] font-mono text-indigo-400 mt-0.5">
                        Code: {exam.code}
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          exam.status === 'PUBLISHED'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                            : exam.status === 'DRAFT'
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-800/60'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {exam.status}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono text-slate-400">
                      v{exam.currentVersion || 0}
                    </td>
                    <td className="py-3.5 text-slate-300">{exam.durationMinutes} mins</td>
                    <td className="py-3.5 text-slate-300">
                      {exam.totalMarks} (Pass: {exam.passMarks})
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <Link
                        href={`/admin/results/${exam._id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600/20 border border-indigo-500/20 transition font-medium"
                      >
                        Results &amp; Ranks
                      </Link>
                      <Link
                        href={`/admin/shortlist/${exam._id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/10 text-emerald-300 hover:bg-emerald-600/20 border border-emerald-500/20 transition font-medium"
                      >
                        Shortlist
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
