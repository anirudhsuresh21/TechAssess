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
      setActionMessage(`Assessment published! Version v${res.assessment.currentVersion} snapshot generated.`);
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
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-indigo-400" />
            Recruitment Examinations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage assessment schedules, question snapshots, candidate permissions, and grading rules.
          </p>
        </div>

        <Link
          href="/admin/assessments/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-lg shadow-indigo-600/20 transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Assessment</span>
        </Link>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by assessment title or exam code..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-2">
          {['', 'PUBLISHED', 'DRAFT', 'ARCHIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st || 'All Statuses'}
            </button>
          ))}
        </div>
      </div>

      {/* Assessments Cards / Table */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-500">Loading assessments...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm">No assessments match your filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filtered.map((exam: any) => (
              <div
                key={exam._id}
                className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-800/20 transition"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-white tracking-tight">{exam.title}</h2>
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
                    <span className="font-mono text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                      v{exam.currentVersion || 0}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{exam.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
                    <span className="text-indigo-400 font-semibold">
                      Code: {exam.code}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3.5 h-3.5" />
                      {exam.durationMinutes} mins
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Award className="w-3.5 h-3.5" />
                      {exam.totalMarks} Marks (Pass: {exam.passMarks})
                    </span>
                    <span>•</span>
                    <span>Negative: {exam.negativeMarkingRate * 100}%</span>
                    <span>•</span>
                    <span>{exam.sections?.length || 0} Sections</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:self-center">
                  {exam.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={() => publishMutation.mutate(exam._id)}
                      disabled={publishMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish</span>
                    </button>
                  )}

                  <Link
                    href={`/admin/results/${exam._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600/20 border border-indigo-500/20 text-xs font-medium transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Results</span>
                  </Link>

                  <Link
                    href={`/admin/shortlist/${exam._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/10 text-emerald-300 hover:bg-emerald-600/20 border border-emerald-500/20 text-xs font-medium transition"
                  >
                    <span>Shortlist</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => duplicateMutation.mutate(exam._id)}
                    title="Duplicate as draft"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {exam.status !== 'ARCHIVED' && (
                    <button
                      type="button"
                      onClick={() => archiveMutation.mutate(exam._id)}
                      title="Archive assessment"
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
