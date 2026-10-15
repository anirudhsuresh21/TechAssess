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
  Layers,
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
          href="/admin/assessments"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Examinations</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#06111f] flex items-center gap-2">
              <Users className="w-6 h-6 text-[#f37021]" />
              Recruitment Candidate Shortlist
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Filter top performers across Sets A &amp; B, apply automated cutoff thresholds, and record review notes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/admin/results/${assessmentId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition shadow-sm"
            >
              <Award className="w-3.5 h-3.5 text-orange-600" />
              <span>View Results &amp; Sets</span>
            </Link>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Shortlist CSV</span>
            </button>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Evaluated
          </span>
          <div className="mt-1 text-2xl font-black text-slate-900">
            {summary?.totalCandidates ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across Sets A &amp; B</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Shortlisted
          </span>
          <div className="mt-1 text-2xl font-black text-emerald-600">
            {summary?.shortlisted ?? 0}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Approved for Tech Club interview</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Pending Review
          </span>
          <div className="mt-1 text-2xl font-black text-amber-600">
            {summary?.pending ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Awaiting decision</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Rejected
          </span>
          <div className="mt-1 text-2xl font-black text-rose-600">
            {summary?.rejected ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Did not meet cutoff</div>
        </div>
      </div>

      {/* Bulk Automated Shortlist Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-orange-600" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Automated Cutoff Rule Engine
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Minimum Score (Marks)</label>
            <input
              type="number"
              value={minScore}
              onChange={(e) => setMinScore(parseFloat(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Minimum Percentage (%)</label>
            <input
              type="number"
              value={minPercentage}
              onChange={(e) => setMinPercentage(parseFloat(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Max Warnings Allowed</label>
            <input
              type="number"
              value={maxWarnings}
              onChange={(e) => setMaxWarnings(parseInt(e.target.value, 10))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => bulkShortlistMutation.mutate()}
            disabled={bulkShortlistMutation.isPending}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {bulkShortlistMutation.isPending ? 'Processing...' : 'Apply Cutoff & Shortlist Candidates'}
            </span>
          </button>
        </div>
      </div>

      {/* Candidates Shortlisting Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
          Candidates Review &amp; Selection
        </h2>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading candidates...</div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No candidates available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="pb-3 pr-2">Rank</th>
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Paper Set</th>
                  <th className="pb-3">Score &amp; %</th>
                  <th className="pb-3">Integrity Flags</th>
                  <th className="pb-3">Decision</th>
                  <th className="pb-3">Reviewer Notes</th>
                  <th className="pb-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {list.map((c: any) => (
                  <tr key={c.attemptId} className="hover:bg-slate-50 transition">
                    <td className="py-3 font-bold text-orange-600">#{c.rank}</td>
                    <td className="py-3 font-sans">
                      <div className="font-bold text-slate-900">{c.candidate.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {c.candidate.rollNumber} • Div {c.candidate.division}
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          (c.assignedSet || 'A').toUpperCase() === 'A'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        Set {c.assignedSet || 'A'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="font-bold text-slate-900">
                        {c.obtainedMarks} / {c.totalMarks}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold">{c.percentage}%</div>
                    </td>
                    <td className="py-3 font-sans">
                      {c.integrityFlagged ? (
                        <span className="text-[10px] text-amber-700 font-bold">
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
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          c.shortlistStatus === 'SHORTLISTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : c.shortlistStatus === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
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
                            className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-900 w-full focus:bg-white"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShortlistMutation.mutate({
                                candidateId: c.candidate.id,
                                status: c.shortlistStatus,
                                notes: currentNote,
                              })
                            }
                            className="text-[10px] px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded font-bold shadow-sm"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingCandidateId(c.candidate.id);
                            setCurrentNote(c.reviewerNotes || '');
                          }}
                          className="cursor-pointer text-[11px] text-slate-600 hover:text-slate-900 truncate"
                        >
                          {c.reviewerNotes || <span className="italic text-slate-400">Add note...</span>}
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
                          })
                        }
                        className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold transition"
                      >
                        Shortlist
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setShortlistMutation.mutate({
                            candidateId: c.candidate.id,
                            status: ShortlistStatus.REJECTED,
                          })
                        }
                        className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[10px] font-bold transition"
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
