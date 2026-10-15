'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileCheck2,
  PlusCircle,
  Search,
  Copy,
  Archive,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  Award,
  Layers,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function AssessmentsListPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const { data: assessments, isLoading } = useQuery({
    queryKey: ['assessments', statusFilter],
    queryFn: () => {
      const query = statusFilter ? `?status=${statusFilter}` : '';
      return apiRequest(`/assessments${query}`);
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/assessments/${id}/publish`, { method: 'POST' }),
    onSuccess: (res) => {
      setActionMessage(`Assessment published! Version v${res.assessment.currentVersion} snapshot generated with Sets A & B.`);
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setTimeout(() => setActionMessage(''), 5000);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/assessments/${id}/duplicate`, { method: 'POST' }),
    onSuccess: () => {
      setActionMessage('Assessment duplicated as Draft successfully.');
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setTimeout(() => setActionMessage(''), 5000);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/assessments/${id}/archive`, { method: 'POST' }),
    onSuccess: () => {
      setActionMessage('Assessment archived.');
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setTimeout(() => setActionMessage(''), 5000);
    },
  });

  const filtered = (assessments || []).filter((exam: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      exam.title.toLowerCase().includes(term) ||
      exam.code.toLowerCase().includes(term) ||
      exam.description?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#06111f] flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-[#f37021]" />
            Recruitment Examinations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage assessment schedules, dual Question Sets A &amp; B, snapshots, and grading policies.
          </p>
        </div>

        <Link
          href="/admin/assessments/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-sm transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Assessment</span>
        </Link>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title or exam code..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Assessment Cards List */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading examinations...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
          <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-800">No examinations found.</p>
          <p className="text-xs text-slate-500 mt-1">Try clearing filters or create a new assessment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((exam: any) => (
            <div
              key={exam._id}
              className="bg-white border border-slate-200 hover:border-orange-400 rounded-2xl p-5 sm:p-6 transition shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        exam.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : exam.status === 'DRAFT'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {exam.status}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200">
                      <Layers className="w-3 h-3" />
                      Sets A &amp; B Active
                    </span>

                    <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      v{exam.currentVersion || 0}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">{exam.title}</h2>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 max-w-3xl">
                    {exam.description || 'No instructions provided.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Link
                    href={`/admin/results/${exam._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 text-xs font-bold transition shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Results &amp; Sets</span>
                  </Link>

                  <Link
                    href={`/admin/shortlist/${exam._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold transition shadow-sm"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Shortlist</span>
                  </Link>
                </div>
              </div>

              {/* Assessment Meta Pills */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-mono">Code:</span>
                  <span className="font-mono font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                    {exam.code}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{exam.durationMinutes} Minutes</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {exam.totalMarks} Marks (Pass: {exam.passMarks})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Sections:</span>
                  <span className="font-semibold text-slate-800">
                    {exam.sections?.length || 0}
                  </span>
                </div>
              </div>

              {/* Assessment Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
                <div className="text-[11px] text-slate-500">
                  Direct Link: <code className="text-orange-600 font-bold">/exam/{exam.code}</code>
                </div>

                <div className="flex items-center gap-2">
                  {exam.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={() => publishMutation.mutate(exam._id)}
                      disabled={publishMutation.isPending}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[11px] font-semibold transition flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Publish (Sets A &amp; B)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => duplicateMutation.mutate(exam._id)}
                    disabled={duplicateMutation.isPending}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition"
                    title="Duplicate Examination"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {exam.status !== 'ARCHIVED' && (
                    <button
                      type="button"
                      onClick={() => archiveMutation.mutate(exam._id)}
                      disabled={archiveMutation.isPending}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-rose-600 border border-slate-200 transition"
                      title="Archive Examination"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
