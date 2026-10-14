'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileCheck2,
  Users,
  Award,
  ShieldAlert,
  Download,
  Search,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Sliders,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { apiRequest } from '@/lib/api';
import { formatSeconds, formatDateTime } from '@/lib/utils';

export default function AssessmentResultsPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [shortlistFilter, setShortlistFilter] = useState('');
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  // Manual review modal
  const [reviewResultId, setReviewResultId] = useState<string | null>(null);
  const [reviewQuestionId, setReviewQuestionId] = useState('');
  const [awardedMarks, setAwardedMarks] = useState(0);
  const [reviewerComment, setReviewerComment] = useState('');

  // 1. Fetch Analytics Overview
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['analytics', assessmentId],
    queryFn: () => apiRequest(`/results/assessments/${assessmentId}/analytics`),
  });

  // 2. Fetch Candidate Results Table
  const { data: resultsData, isLoading: isResultsLoading } = useQuery({
    queryKey: ['results', assessmentId, searchTerm, shortlistFilter],
    queryFn: () => {
      const q = new URLSearchParams();
      if (searchTerm) q.set('search', searchTerm);
      if (shortlistFilter) q.set('shortlistStatus', shortlistFilter);
      return apiRequest(`/results/assessments/${assessmentId}/results?${q.toString()}`);
    },
  });

  // 3. Fetch Attempt Details if selected
  const { data: attemptDetail, isLoading: isAttemptLoading } = useQuery({
    queryKey: ['attemptDetail', selectedAttemptId],
    queryFn: () =>
      selectedAttemptId
        ? apiRequest(`/results/attempts/${selectedAttemptId}`)
        : null,
    enabled: !!selectedAttemptId,
  });

  const manualReviewMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/results/${reviewResultId}/review`, {
        method: 'PATCH',
        body: JSON.stringify({
          questionId: reviewQuestionId,
          awardedMarks: Number(awardedMarks),
          comments: reviewerComment,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['results', assessmentId] });
      queryClient.invalidateQueries({ queryKey: ['attemptDetail', selectedAttemptId] });
      setReviewResultId(null);
    },
  });

  const handleExportCsv = () => {
    window.open(`/api/v1/results/assessments/${assessmentId}/export`, '_blank');
  };

  const overview = analytics?.overview || {};
  const candidatesList = resultsData || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/assessments"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Examinations</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-400" />
              Assessment Results &amp; Rankings
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic ranking calculated by highest obtained score, with time spent as secondary tie-breaker.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/admin/shortlist/${assessmentId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition"
            >
              <span>Manage Shortlist</span>
            </Link>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Total Candidates
          </span>
          <div className="mt-2 text-2xl font-bold text-white">
            {overview.totalCandidates ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {overview.submittedCount ?? 0} Submitted • {overview.expiredCount ?? 0} Expired
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Average Score
          </span>
          <div className="mt-2 text-2xl font-bold text-indigo-400">
            {overview.avgScore ?? 0} Marks
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Highest: {overview.highestScore ?? 0} Marks
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Pass Percentage
          </span>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            {overview.passPercentage ?? 0}%
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Met qualification cutoff</div>
        </div>

        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 sm:p-5">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Integrity Review
          </span>
          <div className="mt-2 text-2xl font-bold text-amber-400">
            {overview.integrityFlaggedCount ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Focus loss warnings exceeded</div>
        </div>
      </div>

      {/* Analytics Charts */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              Score Distribution Histogram
            </h2>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="range" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Candidates" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Section-wise Average Performance
            </h2>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.sectionAverages} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={130} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="averagePercentage" fill="#10b981" radius={[0, 4, 4, 0]} name="Avg Score %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Results Table */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search candidate name or roll number..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500"
            />
          </div>

          <div className="flex gap-2 self-start sm:self-auto">
            {['', 'SHORTLISTED', 'PENDING', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setShortlistFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  shortlistFilter === st
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 border border-slate-800'
                }`}
              >
                {st || 'All Candidates'}
              </button>
            ))}
          </div>
        </div>

        {isResultsLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading rankings...</div>
        ) : candidatesList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">No candidate results found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="pb-3 pr-2">Rank</th>
                  <th className="pb-3">Candidate Details</th>
                  <th className="pb-3">Score &amp; %</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Time Spent</th>
                  <th className="pb-3">Integrity Flags</th>
                  <th className="pb-3">Shortlist Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {candidatesList.map((c: any) => (
                  <tr key={c.attemptId} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 pr-2">
                      <span className="font-bold text-indigo-400">#{c.rank}</span>
                    </td>
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
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          c.isPassed
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-800/60'
                        }`}
                      >
                        {c.isPassed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">
                      {formatSeconds(c.timeSpentSeconds)}
                    </td>
                    <td className="py-3 font-sans">
                      {c.integrityFlagged ? (
                        <span className="text-[11px] text-amber-400 flex items-center gap-1 font-medium">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Flagged ({c.focusLossCount}x)</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">
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
                    <td className="py-3 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => setSelectedAttemptId(c.attemptId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600/20 border border-indigo-500/20 text-xs font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Attempt</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate Attempt Detailed Breakdown Modal */}
      {selectedAttemptId && attemptDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">
                  Candidate Examination Breakdown
                </h2>
                <p className="text-xs text-slate-400">
                  {attemptDetail.attempt?.candidateId?.name} (
                  {attemptDetail.attempt?.candidateId?.rollNumber})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAttemptId(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Close
              </button>
            </div>

            {/* Score Summary */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Score:</span>{' '}
                <span className="font-bold text-white">
                  {attemptDetail.result?.obtainedMarks} / {attemptDetail.result?.totalMarks}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Percentage:</span>{' '}
                <span className="font-bold text-emerald-400">
                  {attemptDetail.result?.percentage}%
                </span>
              </div>
              <div>
                <span className="text-slate-400">Time:</span>{' '}
                <span className="font-bold text-slate-300">
                  {formatSeconds(attemptDetail.attempt?.timeSpentSeconds || 0)}
                </span>
              </div>
            </div>

            {/* Question Breakdown List */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Question Responses &amp; Scoring Detail
              </h3>
              <div className="space-y-2">
                {attemptDetail.result?.breakdown?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">
                        Q{idx + 1} ({item.category.replace(/_/g, ' ')})
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            item.status === 'CORRECT'
                              ? 'bg-emerald-950 text-emerald-400'
                              : item.status === 'INCORRECT'
                              ? 'bg-rose-950 text-rose-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.status} ({item.awardedMarks} / {item.maxMarks}m)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setReviewResultId(attemptDetail.result._id);
                            setReviewQuestionId(item.questionId);
                            setAwardedMarks(item.awardedMarks);
                            setReviewerComment('');
                          }}
                          className="text-[10px] text-indigo-400 hover:underline"
                        >
                          Adjust Marks
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      <div>
                        Candidate Answer:{' '}
                        <span className="font-mono text-slate-200">
                          {JSON.stringify(
                            item.candidateAnswer?.selectedOptionIds ||
                              item.candidateAnswer?.numericalAnswer ||
                              item.candidateAnswer?.textAnswer ||
                              'Unanswered'
                          )}
                        </span>
                      </div>
                      {item.correctAnswerSummary && (
                        <div>
                          Answer Key:{' '}
                          <span className="font-mono text-emerald-400">
                            {JSON.stringify(item.correctAnswerSummary)}
                          </span>
                        </div>
                      )}
                      {item.explanation && (
                        <p className="mt-1 text-slate-500 italic">{item.explanation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Manual Review Adjustment Modal */}
            {reviewResultId && (
              <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/50 space-y-3">
                <h4 className="text-xs font-bold text-indigo-400">
                  Manual Review Adjustment
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Awarded Marks</label>
                    <input
                      type="number"
                      value={awardedMarks}
                      onChange={(e) => setAwardedMarks(parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Reviewer Feedback</label>
                    <input
                      type="text"
                      value={reviewerComment}
                      onChange={(e) => setReviewerComment(e.target.value)}
                      placeholder="Reason for adjustment..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setReviewResultId(null)}
                    className="px-3 py-1.5 text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => manualReviewMutation.mutate()}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-medium"
                  >
                    Save Adjustment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
