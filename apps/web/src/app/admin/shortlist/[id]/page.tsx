'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ArrowLeft,
  Filter,
  Sparkles,
  ShieldAlert,
  MessageSquare,
  Award,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { ShortlistStatus } from '@techassess/shared';

export default function ShortlistDashboardPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const queryClient = useQueryClient();

  // Cutoff Criteria inputs
  const [minScore, setMinScore] = useState(15);
  const [minPercentage, setMinPercentage] = useState(60);
  const [maxWarnings, setMaxWarnings] = useState(3);
  const [actionMessage, setActionMessage] = useState('');

  // Individual Note editing
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState('');

  // 1. Fetch Shortlist Summary Cards
  const { data: summary } = useQuery({
    queryKey: ['shortlistSummary', assessmentId],
    queryFn: () => apiRequest(`/shortlist/assessments/${assessmentId}/summary`),
  });

  // 2. Fetch Candidates Results
  const { data: candidates, isLoading } = useQuery({
    queryKey: ['results', assessmentId],
    queryFn: () => apiRequest(`/results/assessments/${assessmentId}/results?limit=100`),
  });

  // Set individual shortlist decision
  const setShortlistMutation = useMutation({
    mutationFn: ({
      candidateId,
      status,
      notes,
    }: {
      candidateId: string;
      status: ShortlistStatus;
      notes?: string;
    }) =>
      apiRequest(`/shortlist/assessments/${assessmentId}/candidates/${candidateId}`, {
        method: 'POST',
        body: JSON.stringify({ status, reviewerNotes: notes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['shortlistSummary', assessmentId] });
      setEditingCandidateId(null);
    },
  });

  // Bulk Shortlist Mutation
  const bulkShortlistMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/shortlist/assessments/${assessmentId}/bulk`, {
        method: 'POST',
        body: JSON.stringify({
          minTotalScore: Number(minScore),
          minPercentage: Number(minPercentage),
          maxIntegrityWarnings: Number(maxWarnings),
        }),
      }),
    onSuccess: (data) => {
      setActionMessage(`Auto-shortlisted ${data.updatedCount} candidates meeting the criteria!`);
      queryClient.invalidateQueries({ queryKey: ['results', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['shortlistSummary', assessmentId] });
      setTimeout(() => setActionMessage(''), 5000);
    },
  });

  const handleExportCsv = () => {
    window.open(`/api/v1/shortlist/assessments/${assessmentId}/export`, '_blank');
  };

  const list = candidates || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/admin/results/${assessmentId}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Results Dashboard</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-400" />
              Candidate Shortlisting &amp; Selection
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Apply qualification cutoffs, add recruiter interview notes, and export official shortlists.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Shortlist CSV</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Total Candidates
          </span>
          <div className="mt-1 text-2xl font-bold text-white">
            {summary?.total || list.length}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
            Shortlisted
          </span>
          <div className="mt-1 text-2xl font-bold text-emerald-400">
            {summary?.shortlisted || 0}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Pending Review
          </span>
          <div className="mt-1 text-2xl font-bold text-amber-400">
            {summary?.pending || 0}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">
            Rejected
          </span>
          <div className="mt-1 text-2xl font-bold text-rose-400">
            {summary?.rejected || 0}
          </div>
        </div>
      </div>

      {/* Bulk Cutoff Qualification Filter Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider text-indigo-400">
          <Filter className="w-4 h-4" />
          <span>Automated Qualification Cutoff Rule</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 mb-1">Minimum Score (Marks)</label>
            <input
              type="number"
              value={minScore}
              onChange={(e) => setMinScore(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Minimum Percentage (%)</label>
            <input
              type="number"
              value={minPercentage}
              onChange={(e) => setMinPercentage(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Max Integrity Warnings Allowed</label>
            <input
              type="number"
              value={maxWarnings}
              onChange={(e) => setMaxWarnings(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => bulkShortlistMutation.mutate()}
            disabled={bulkShortlistMutation.isPending}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {bulkShortlistMutation.isPending ? 'Processing...' : 'Apply Cutoff & Shortlist Candidates'}
            </span>
          </button>
        </div>
      </div>

      {/* Candidates Shortlisting Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Candidates Review &amp; Selection
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading candidates...</div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No candidates available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="pb-3 pr-2">Rank</th>
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Score &amp; %</th>
                  <th className="pb-3">Integrity Flags</th>
                  <th className="pb-3">Decision</th>
                  <th className="pb-3">Reviewer Notes</th>
                  <th className="pb-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {list.map((c: any) => (
                  <tr key={c.attemptId} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 font-bold text-indigo-400">#{c.rank}</td>
                    <td className="py-3 font-sans">
                      <div className="font-semibold text-slate-200">{c.candidate.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {c.candidate.rollNumber} • Div {c.candidate.division}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="font-bold text-white">
                        {c.obtainedMarks} / {c.totalMarks}
                      </div>
                      <div className="text-[11px] text-emerald-400">{c.percentage}%</div>
                    </td>
                    <td className="py-3 font-sans">
                      {c.integrityFlagged ? (
                        <span className="text-[10px] text-amber-400 font-medium">
                          ⚠ Flagged ({c.focusLossCount}x)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">
                          Clean ({c.focusLossCount}x)
                        </span>
                      )}
                    </td>
                    <td className="py-3 font-sans">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          c.shortlistStatus === 'SHORTLISTED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : c.shortlistStatus === 'REJECTED'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {c.shortlistStatus}
                      </span>
                    </td>
                    <td className="py-3 font-sans max-w-xs">
                      {editingCandidateId === c.candidate.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={currentNote}
                            onChange={(e) => setCurrentNote(e.target.value)}
                            placeholder="Add note..."
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] text-white w-48"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setShortlistMutation.mutate({
                                candidateId: c.candidate.id,
                                status: c.shortlistStatus,
                                notes: currentNote,
                              });
                            }}
                            className="text-xs text-emerald-400"
                          >
                            ✓
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingCandidateId(c.candidate.id);
                            setCurrentNote(c.reviewerNotes || '');
                          }}
                          className="cursor-pointer text-[11px] text-slate-400 hover:text-slate-200 truncate flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{c.reviewerNotes || 'Click to add note'}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-right font-sans space-x-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setShortlistMutation.mutate({
                            candidateId: c.candidate.id,
                            status: ShortlistStatus.SHORTLISTED,
                            notes: c.reviewerNotes,
                          })
                        }
                        className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[11px] border border-emerald-800/60 font-medium transition"
                      >
                        Shortlist
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setShortlistMutation.mutate({
                            candidateId: c.candidate.id,
                            status: ShortlistStatus.REJECTED,
                            notes: c.reviewerNotes,
                          })
                        }
                        className="px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-300 text-[11px] border border-rose-800/60 font-medium transition"
                      >
                        Reject
                      </button>
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
