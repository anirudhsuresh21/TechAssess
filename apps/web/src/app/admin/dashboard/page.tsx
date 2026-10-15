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
  Sparkles,
  CheckCircle,
  Layers,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-xs font-semibold mb-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            SIESCOMS MCA Recruitment 2026 • Dual Sets A &amp; B Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#06111f]">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Conduct examinations, review candidate performance across Sets A &amp; B, and shortlist MCA students.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/questions/import"
            className="px-3.5 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-orange-600" />
            <span>Import Questions</span>
          </Link>
          <Link
            href="/admin/assessments/new"
            className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Assessment</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Examinations
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {isLoading ? '...' : assessments?.length || 0}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Published and draft question banks</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Question Paper Sets
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>Set A &amp; Set B</span>
          </div>
          <p className="mt-1 text-[11px] text-orange-600 font-medium">Dual concurrent rollout active</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Candidates Registered
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">5+</div>
          <p className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
            <CheckCircle className="w-3 h-3" />
            <span>Active attempts evaluated</span>
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Integrity Monitor
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#004b87] border border-blue-100 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">Tab &amp; Focus Check</div>
          <p className="mt-1 text-[11px] text-slate-500">Real-time focus loss tracking</p>
        </div>
      </div>

      {/* Assessments Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recruitment Examinations</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review candidate scores across Set A and Set B, view analytics, and shortlist candidates.
            </p>
          </div>
          <Link
            href="/admin/assessments"
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading examinations...</div>
        ) : !assessments || assessments.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <p className="text-sm">No assessments found.</p>
            <Link
              href="/admin/assessments/new"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-orange-600 hover:underline font-semibold"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Create your first examination
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-semibold">Title &amp; Code</th>
                  <th className="pb-3 font-semibold">Sets Config</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Version</th>
                  <th className="pb-3 font-semibold">Duration</th>
                  <th className="pb-3 font-semibold">Marks</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assessments.map((exam: any) => (
                  <tr key={exam._id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-slate-900">{exam.title}</div>
                      <div className="text-[11px] font-mono text-orange-600 mt-0.5 font-semibold">
                        Code: {exam.code}
                      </div>
                    </td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                        <Layers className="w-3 h-3" />
                        Set A &amp; B
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          exam.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : exam.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {exam.status}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono text-slate-500">
                      v{exam.currentVersion || 0}
                    </td>
                    <td className="py-3.5 text-slate-600">{exam.durationMinutes} mins</td>
                    <td className="py-3.5 text-slate-600">
                      {exam.totalMarks} (Pass: {exam.passMarks})
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <Link
                        href={`/admin/results/${exam._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition font-bold"
                      >
                        Results &amp; Sets
                      </Link>
                      <Link
                        href={`/admin/shortlist/${exam._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition font-bold"
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
