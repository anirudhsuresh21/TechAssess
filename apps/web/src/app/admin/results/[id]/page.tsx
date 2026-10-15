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
  Layers,
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
  const [setFilter, setSetFilter] = useState('');
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
    queryKey: ['results', assessmentId, searchTerm, shortlistFilter, setFilter],
    queryFn: () => {
      const q = new URLSearchParams();
      if (searchTerm) q.set('search', searchTerm);
      if (shortlistFilter) q.set('shortlistStatus', shortlistFilter);
      if (setFilter) q.set('set', setFilter);
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
  const setAnalytics = analytics?.setAnalytics || {};
  const candidatesList = resultsData || [];

  return (
    <div className="space-y-8">
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
              <Award className="w-6 h-6 text-[#f37021]" />
              Assessment Results &amp; Sets Analysis
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic ranking calculated by highest obtained score, with comparative Set A vs Set B evaluation metrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/admin/shortlist/${assessmentId}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
            >
              <span>Manage Shortlist</span>
            </Link>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-orange-600" />
              <span>Export CSV (with Sets)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Candidates
          </span>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {overview.totalCandidates ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {overview.submittedCount ?? 0} Submitted • {overview.expiredCount ?? 0} Expired
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Overall Average Score
          </span>
          <div className="mt-2 text-2xl font-black text-orange-600">
            {overview.avgScore ?? 0} Marks
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Highest: {overview.highestScore ?? 0} Marks
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Pass Percentage
          </span>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {overview.passPercentage ?? 0}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Met qualification cutoff</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Integrity Review
          </span>
          <div className="mt-2 text-2xl font-black text-amber-600">
            {overview.integrityFlaggedCount ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Focus loss warnings exceeded</div>
        </div>
      </div>

      {/* Comparative Set A vs Set B Analysis Card */}
      {setAnalytics && (setAnalytics['A'] || setAnalytics['B']) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-600" />
              Comparative Paper Performance: Question Set A vs Question Set B
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">
              Evaluates test balance &amp; parity across sets
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Set A Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200">
                  Question Paper — Set A
                </span>
                <span className="text-xs text-slate-500">
                  {setAnalytics['A']?.submittedCount || 0} Submissions
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Average Score</div>
                  <div className="text-lg font-bold text-slate-900 font-mono">
                    {setAnalytics['A']?.avgScore || 0}m
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Highest Score</div>
                  <div className="text-lg font-bold text-orange-600 font-mono">
                    {setAnalytics['A']?.highestScore || 0}m
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Pass Rate</div>
                  <div className="text-lg font-bold text-emerald-600 font-mono">
                    {setAnalytics['A']?.passPercentage || 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Set B Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Question Paper — Set B
                </span>
                <span className="text-xs text-slate-500">
                  {setAnalytics['B']?.submittedCount || 0} Submissions
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Average Score</div>
                  <div className="text-lg font-bold text-slate-900 font-mono">
                    {setAnalytics['B']?.avgScore || 0}m
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Highest Score</div>
                  <div className="text-lg font-bold text-amber-600 font-mono">
                    {setAnalytics['B']?.highestScore || 0}m
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Pass Rate</div>
                  <div className="text-lg font-bold text-emerald-600 font-mono">
                    {setAnalytics['B']?.passPercentage || 0}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-600" />
              Score Distribution Histogram
            </h2>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="range" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#0f172a',
                    }}
                  />
                  <Bar dataKey="count" fill="#f37021" radius={[4, 4, 0, 0]} name="Candidates" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              Section-wise Average Performance
            </h2>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.sectionAverages} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={130} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: 8,
                      fontSize: 12,
                      color: '#0f172a',
                    }}
                  />
                  <Bar dataKey="averagePercentage" fill="#ff7a00" radius={[0, 4, 4, 0]} name="Avg Score %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Results Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search candidate name or roll number..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Set Filter */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSetFilter('')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  setFilter === '' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Sets
              </button>
              <button
                type="button"
                onClick={() => setSetFilter('A')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition ${
                  setFilter === 'A' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Set A
              </button>
              <button
                type="button"
                onClick={() => setSetFilter('B')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition ${
                  setFilter === 'B' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Set B
              </button>
            </div>

            {/* Shortlist Filter */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {['', 'SHORTLISTED', 'PENDING', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setShortlistFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    shortlistFilter === st
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st || 'All'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isResultsLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading rankings...</div>
        ) : candidatesList.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">No candidate results found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="pb-3 pr-2">Rank</th>
                  <th className="pb-3">Candidate Details</th>
                  <th className="pb-3">Question Set</th>
                  <th className="pb-3">Score &amp; %</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Time Spent</th>
                  <th className="pb-3">Integrity Flags</th>
                  <th className="pb-3">Shortlist Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {candidatesList.map((c: any) => (
                  <tr key={c.attemptId} className="hover:bg-slate-50 transition">
                    <td className="py-3 pr-2">
                      <span className="font-bold text-orange-600">#{c.rank}</span>
                    </td>
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
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          c.isPassed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {c.isPassed ? 'PASSED' : 'FAILED'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600">
                      {formatSeconds(c.timeSpentSeconds)}
                    </td>
                    <td className="py-3 font-sans">
                      {c.integrityFlagged ? (
                        <span className="text-[11px] text-amber-700 flex items-center gap-1 font-semibold">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
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
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
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
                    <td className="py-3 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => setSelectedAttemptId(c.attemptId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 text-xs font-bold transition shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Candidate Examination Breakdown
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200">
                    Set {attemptDetail.attempt?.assignedSet || 'A'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {attemptDetail.attempt?.candidateId?.name} (
                  {attemptDetail.attempt?.candidateId?.rollNumber})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAttemptId(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕ Close
              </button>
            </div>

            {/* Score Summary */}
            <div className="grid grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Score:</span>{' '}
                <span className="font-bold text-slate-900">
                  {attemptDetail.result?.obtainedMarks} / {attemptDetail.result?.totalMarks}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Percentage:</span>{' '}
                <span className="font-bold text-emerald-600">
                  {attemptDetail.result?.percentage}%
                </span>
              </div>
              <div>
                <span className="text-slate-500">Paper Set:</span>{' '}
                <span className="font-bold text-orange-600 font-mono">
                  {attemptDetail.result?.setName || `Set ${attemptDetail.attempt?.assignedSet || 'A'}`}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Time:</span>{' '}
                <span className="font-bold text-slate-700">
                  {formatSeconds(attemptDetail.attempt?.timeSpentSeconds || 0)}
                </span>
              </div>
            </div>

            {/* Question Breakdown List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Question Responses &amp; Scoring Detail
              </h3>
              <div className="space-y-2">
                {attemptDetail.result?.breakdown?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        Q{idx + 1} ({item.category.replace(/_/g, ' ')})
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'CORRECT'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'INCORRECT'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
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
                          className="text-[10px] text-orange-600 hover:underline font-semibold"
                        >
                          Adjust Marks
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600">
                      <div>
                        Candidate Answer:{' '}
                        <span className="font-mono text-slate-900">
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
                          <span className="font-mono text-emerald-600">
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
              <div className="p-4 rounded-xl bg-white border border-orange-300 space-y-3 shadow-md">
                <h4 className="text-xs font-bold text-orange-600">
                  Manual Review Adjustment
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-1">Awarded Marks</label>
                    <input
                      type="number"
                      value={awardedMarks}
                      onChange={(e) => setAwardedMarks(parseFloat(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Reviewer Feedback</label>
                    <input
                      type="text"
                      value={reviewerComment}
                      onChange={(e) => setReviewerComment(e.target.value)}
                      placeholder="Reason for adjustment..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setReviewResultId(null)}
                    className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => manualReviewMutation.mutate()}
                    className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold transition shadow-sm"
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
