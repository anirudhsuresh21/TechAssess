'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  ArrowLeft,
  Plus,
  Upload,
  Layers,
  Shuffle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Download,
  Sparkles,
  FileText,
  UserCheck,
  Award,
  ExternalLink,
  ShieldAlert,
  X,
  AlertTriangle,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function AssessmentStudentsPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const queryClient = useQueryClient();

  // Top level tab: 'added' (pre-exam authorized roster) vs 'attempted' (live/completed exam attempts)
  const [activeTab, setActiveTab] = useState<'added' | 'attempted'>('added');

  const [searchTerm, setSearchTerm] = useState('');
  const [setFilter, setSetFilter] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any | null>(null);

  // Single Add Form State
  const [newRollNumber, setNewRollNumber] = useState('');
  const [newName, setNewName] = useState('');
  const [newDivision, setNewDivision] = useState('A');
  const [newAssignedSet, setNewAssignedSet] = useState<'A' | 'B'>('A');

  // Bulk Add Form State
  const [bulkText, setBulkText] = useState('');
  const [bulkAutoAlternate, setBulkAutoAlternate] = useState(true);

  // 1. Fetch Assessment Details
  const { data: assessment, isLoading: isAssessmentLoading } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: () => apiRequest(`/assessments/${assessmentId}`),
  });

  const accessCode = assessment?.code || '';

  // 2. Fetch Candidates for this assessment
  const { data: candidates = [], isLoading: isCandidatesLoading } = useQuery({
    queryKey: ['assessment-candidates', accessCode],
    queryFn: () => apiRequest(`/candidate/assessment/${accessCode}`),
    enabled: Boolean(accessCode),
  });

  // Mutations
  const addCandidateMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/candidate/assessment/${accessCode}`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      setActionMessage('Student registered successfully.');
      queryClient.invalidateQueries({ queryKey: ['assessment-candidates', accessCode] });
      setIsAddModalOpen(false);
      setNewRollNumber('');
      setNewName('');
      setTimeout(() => setActionMessage(''), 4000);
    },
    onError: (err: any) => setErrorMessage(err.message || 'Failed to add student'),
  });

  const bulkAddMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/candidate/assessment/${accessCode}/bulk`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (res: any) => {
      setActionMessage(`Successfully imported ${res.count || 'all'} students.`);
      queryClient.invalidateQueries({ queryKey: ['assessment-candidates', accessCode] });
      setIsBulkModalOpen(false);
      setBulkText('');
      setTimeout(() => setActionMessage(''), 4000);
    },
    onError: (err: any) => setErrorMessage(err.message || 'Failed to bulk import students'),
  });

  const assignSetMutation = useMutation({
    mutationFn: ({ candidateId, assignedSet }: { candidateId: string; assignedSet: 'A' | 'B' }) =>
      apiRequest(`/candidate/${candidateId}/set`, {
        method: 'PATCH',
        body: JSON.stringify({ assignedSet }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-candidates', accessCode] });
    },
    onError: (err: any) => setErrorMessage(err.message || 'Failed to update set'),
  });

  const autoAssignMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/candidate/assessment/${accessCode}/auto-assign-sets`, {
        method: 'POST',
      }),
    onSuccess: (res: any) => {
      setActionMessage(`Seating arrangement applied! ${res.setACount} assigned to Set A, ${res.setBCount} assigned to Set B.`);
      queryClient.invalidateQueries({ queryKey: ['assessment-candidates', accessCode] });
      setTimeout(() => setActionMessage(''), 5000);
    },
    onError: (err: any) => setErrorMessage(err.message || 'Failed to auto-assign sets'),
  });

  const deleteCandidateMutation = useMutation({
    mutationFn: (candidateId: string) =>
      apiRequest(`/candidate/${candidateId}`, { method: 'DELETE' }),
    onSuccess: () => {
      setActionMessage('Student deleted from exam roster.');
      queryClient.invalidateQueries({ queryKey: ['assessment-candidates', accessCode] });
      setStudentToDelete(null);
      setTimeout(() => setActionMessage(''), 4000);
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'Failed to delete student');
      setStudentToDelete(null);
    },
  });

  const handleSingleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!newRollNumber.trim() || !newName.trim()) {
      setErrorMessage('Roll number and student name are required.');
      return;
    }
    addCandidateMutation.mutate({
      rollNumber: newRollNumber.trim().toUpperCase(),
      name: newName.trim(),
      division: newDivision.trim().toUpperCase(),
      assignedSet: newAssignedSet,
    });
  };

  const handleBulkAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!bulkText.trim()) {
      setErrorMessage('Please paste at least one student record.');
      return;
    }

    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsedList: any[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        const rollNumber = parts[0].toUpperCase();
        const name = parts[1];
        const division = parts[2] ? parts[2].toUpperCase() : 'A';
        let assignedSet: 'A' | 'B' = 'A';

        if (parts[3] && ['A', 'B'].includes(parts[3].toUpperCase())) {
          assignedSet = parts[3].toUpperCase() as 'A' | 'B';
        } else if (bulkAutoAlternate) {
          assignedSet = idx % 2 === 0 ? 'A' : 'B';
        }

        parsedList.push({ rollNumber, name, division, assignedSet });
      }
    });

    if (parsedList.length === 0) {
      setErrorMessage('Could not parse any valid records. Use format: "MCA2026-001, Student Name"');
      return;
    }

    bulkAddMutation.mutate({ candidates: parsedList });
  };

  const handleExportRoster = () => {
    if (!candidates || candidates.length === 0) return;
    const headers = ['Roll Number', 'Student Name', 'Division', 'Assigned Set', 'Status', 'Score', 'Percentage'];
    const rows = candidates.map((c: any) => [
      c.rollNumber,
      `"${c.name}"`,
      c.division || 'A',
      c.assignedSet || 'A',
      c.attemptStatus || 'NOT_STARTED',
      c.obtainedMarks ?? '',
      c.percentage ? `${c.percentage}%` : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${accessCode}_student_roster.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Segregate into Added Students (Not Started) vs Attempted Students (In Progress / Submitted)
  const addedStudents = candidates.filter(
    (c: any) => !c.attemptStatus || c.attemptStatus === 'NOT_STARTED'
  );

  const attemptedStudents = candidates.filter(
    (c: any) => c.attemptStatus && c.attemptStatus !== 'NOT_STARTED'
  );

  // Apply search and set filters
  const applyFilters = (list: any[]) => {
    return list.filter((c: any) => {
      if (setFilter && c.assignedSet !== setFilter) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        c.rollNumber.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term) ||
        c.division?.toLowerCase().includes(term)
      );
    });
  };

  const displayedAdded = applyFilters(addedStudents);
  const displayedAttempted = applyFilters(attemptedStudents);

  const countAddedSetA = addedStudents.filter((c: any) => c.assignedSet === 'A').length;
  const countAddedSetB = addedStudents.filter((c: any) => c.assignedSet === 'B').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#06111f] flex items-center gap-2">
                <Users className="w-6 h-6 text-[#f37021]" />
                Student Management &amp; Seating Roster
              </h1>
              {accessCode && (
                <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                  {accessCode}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Examination: <strong>{assessment?.title || 'Loading...'}</strong> • Students authenticate using their <strong>Roll Number</strong> as username and password.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Paper Button */}
            <Link
              href={`/admin/assessments/${assessmentId}/paper`}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-orange-600" />
              <span>View Question Paper</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 text-orange-600" />
              <span>Bulk Import</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Student</span>
            </button>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Tabs: Added Students (Pre-Exam) vs Attempted Students */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          {/* Tab 1: Added Students */}
          <button
            type="button"
            onClick={() => setActiveTab('added')}
            className={`pb-3 px-3 text-sm font-bold transition flex items-center gap-2 border-b-2 -mb-px ${
              activeTab === 'added'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Added Students Roster</span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                activeTab === 'added' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {addedStudents.length}
            </span>
          </button>

          {/* Tab 2: Attempted Students */}
          <button
            type="button"
            onClick={() => setActiveTab('attempted')}
            className={`pb-3 px-3 text-sm font-bold transition flex items-center gap-2 border-b-2 -mb-px ${
              activeTab === 'attempted'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Attempted Students &amp; Submissions</span>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                activeTab === 'attempted' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {attemptedStudents.length}
            </span>
          </button>
        </div>

        {/* Export Button */}
        {candidates.length > 0 && (
          <button
            type="button"
            onClick={handleExportRoster}
            className="text-xs text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1.5 pb-2 sm:pb-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Full CSV</span>
          </button>
        )}
      </div>

      {/* TAB 1: ADDED STUDENTS (PRE-EXAM ROSTER) */}
      {activeTab === 'added' && (
        <div className="space-y-4">
          {/* Seating Arrangement & Auto-Assign Banner */}
          <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <span>Pre-Exam Seating Arrangement &amp; Set Allocation</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Assign <strong>Set A</strong> or <strong>Set B</strong> to students 10–15 minutes before the exam based on your physical classroom seating. You can toggle sets per student or use the 1-click alternating seating tool.
              </p>
            </div>

            <button
              type="button"
              onClick={() => autoAssignMutation.mutate()}
              disabled={autoAssignMutation.isPending || addedStudents.length === 0}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Auto-Assign Alternating Sets (A/B)</span>
            </button>
          </div>

          {/* Quick Metrics for Added Students */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
              <span className="text-slate-500 block">Total Added (Pre-Exam)</span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">{addedStudents.length}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
              <span className="text-slate-500 block">Allocated to Set A</span>
              <span className="text-xl font-black text-orange-600 mt-0.5 block">{countAddedSetA}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
              <span className="text-slate-500 block">Allocated to Set B</span>
              <span className="text-xl font-black text-amber-600 mt-0.5 block">{countAddedSetB}</span>
            </div>
          </div>

          {/* Search & Set Filter Toolbar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search added students by name or roll..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={setFilter}
                onChange={(e) => setSetFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
              >
                <option value="">All Question Paper Sets</option>
                <option value="A">Set A Only</option>
                <option value="B">Set B Only</option>
              </select>
            </div>
          </div>

          {/* Added Students Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {isCandidatesLoading ? (
              <div className="py-16 text-center text-xs text-slate-500">Loading student roster...</div>
            ) : displayedAdded.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-800">No added students awaiting exam.</p>
                <p className="text-xs text-slate-500">
                  Click &quot;Add Student&quot; or &quot;Bulk Import&quot; above to authorize students for this exam.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Roll Number (Login ID)</th>
                      <th className="px-4 py-3.5">Student Name</th>
                      <th className="px-4 py-3.5">Division</th>
                      <th className="px-4 py-3.5">Assigned Set (Seating)</th>
                      <th className="px-4 py-3.5">Authorization Status</th>
                      <th className="px-4 py-3.5 text-right">Delete / Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedAdded.map((candidate: any) => {
                      const currentSet = candidate.assignedSet || 'A';
                      return (
                        <tr key={candidate.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                            {candidate.rollNumber}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900">
                            {candidate.name}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-600">
                            Div {candidate.division || 'A'}
                          </td>
                          <td className="px-4 py-3.5">
                            {/* Interactive Set Switcher Pill */}
                            <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200">
                              <button
                                type="button"
                                onClick={() => assignSetMutation.mutate({ candidateId: candidate.id, assignedSet: 'A' })}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                  currentSet === 'A'
                                    ? 'bg-orange-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Set A
                              </button>
                              <button
                                type="button"
                                onClick={() => assignSetMutation.mutate({ candidateId: candidate.id, assignedSet: 'B' })}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                  currentSet === 'B'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                Set B
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Ready (Not Started)
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => setStudentToDelete(candidate)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-bold transition"
                              title="Delete student from exam"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ATTEMPTED STUDENTS (EXAM SUBMISSIONS) */}
      {activeTab === 'attempted' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-emerald-900">
                <strong>Live &amp; Completed Submissions:</strong> These students have logged in and either have an ongoing session or have submitted their examination.
              </span>
            </div>
            <Link
              href={`/admin/results/${assessmentId}`}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold transition flex items-center gap-1.5 shrink-0"
            >
              <span>View Results &amp; Analytics</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Quick Metrics for Attempted Students */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
              <span className="text-slate-500 block">Total Attempted</span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">{attemptedStudents.length}</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
              <span className="text-slate-500 block">In Progress</span>
              <span className="text-xl font-black text-blue-600 mt-0.5 block">
                {attemptedStudents.filter((c: any) => c.attemptStatus === 'IN_PROGRESS').length}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
              <span className="text-slate-500 block">Submitted &amp; Evaluated</span>
              <span className="text-xl font-black text-emerald-600 mt-0.5 block">
                {attemptedStudents.filter((c: any) => c.attemptStatus === 'SUBMITTED' || c.attemptStatus === 'EVALUATED').length}
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm">
              <span className="text-slate-500 block">Cheating Flags</span>
              <span className="text-xl font-black text-rose-600 mt-0.5 block">
                {attemptedStudents.filter((c: any) => c.integrityFlagged).length}
              </span>
            </div>
          </div>

          {/* Attempted Students Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {displayedAttempted.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Clock className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-800">No student attempts recorded yet.</p>
                <p className="text-xs text-slate-500">
                  When students log in and start the exam, their progress will appear here live.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Roll Number</th>
                      <th className="px-4 py-3.5">Student Name</th>
                      <th className="px-4 py-3.5">Paper Set</th>
                      <th className="px-4 py-3.5">Attempt Status</th>
                      <th className="px-4 py-3.5">Score / Percentage</th>
                      <th className="px-4 py-3.5">Integrity Monitor</th>
                      <th className="px-4 py-3.5 text-right">Results</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedAttempted.map((candidate: any) => (
                      <tr key={candidate.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                          {candidate.rollNumber}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                          {candidate.name}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                              candidate.assignedSet === 'B'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-orange-50 text-orange-800 border border-orange-200'
                            }`}
                          >
                            Set {candidate.assignedSet || 'A'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              candidate.attemptStatus === 'SUBMITTED' || candidate.attemptStatus === 'EVALUATED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : candidate.attemptStatus === 'IN_PROGRESS'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {candidate.attemptStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold">
                          {candidate.percentage !== undefined ? (
                            <span className="text-emerald-700">
                              {candidate.obtainedMarks ?? 0}m ({candidate.percentage}%)
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {candidate.integrityFlagged ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              <ShieldAlert className="w-3 h-3 text-rose-600" /> Flagged
                            </span>
                          ) : (
                            <span className="font-mono text-slate-500 text-[11px]">Normal</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            href={`/admin/results/${assessmentId}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
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
      )}

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                Delete Student from Roster?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to remove <strong className="text-slate-900">{studentToDelete.name}</strong> (Roll: <span className="font-mono">{studentToDelete.rollNumber}</span>)?
                Their authorization for this examination will be immediately revoked.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="w-1/2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteCandidateMutation.mutate(studentToDelete.id)}
                disabled={deleteCandidateMutation.isPending}
                className="w-1/2 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-sm"
              >
                {deleteCandidateMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Add Single Student */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-600" />
                Add Student to Examination Roster
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSingleAdd} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Student Roll Number (Username &amp; Password) *
                </label>
                <input
                  type="text"
                  required
                  value={newRollNumber}
                  onChange={(e) => setNewRollNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. MCA2026-001"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Full Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Division</label>
                  <input
                    type="text"
                    value={newDivision}
                    onChange={(e) => setNewDivision(e.target.value.toUpperCase())}
                    placeholder="A, B, C..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Set</label>
                  <select
                    value={newAssignedSet}
                    onChange={(e) => setNewAssignedSet(e.target.value as 'A' | 'B')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white font-bold"
                  >
                    <option value="A">Set A</option>
                    <option value="B">Set B</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-slate-500 hover:text-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addCandidateMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition"
                >
                  {addCandidateMutation.isPending ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Bulk Import Students */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-orange-600" />
                Bulk Import Student Roster
              </h2>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkAdd} className="space-y-3.5 text-xs">
              <p className="text-slate-600">
                Paste student records below (one per line). Format: <code>RollNumber, Student Name, Division, Set</code>
              </p>

              <textarea
                rows={7}
                required
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`MCA2026-001, Aarav Sharma, A, A\nMCA2026-002, Priya Patel, A, B\nMCA2026-003, Rohan Deshmukh, B, A\nMCA2026-004, Sneha Kulkarni, B, B`}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono focus:bg-white focus:ring-2 focus:ring-orange-500"
              />

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={bulkAutoAlternate}
                  onChange={(e) => setBulkAutoAlternate(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 border-slate-300"
                />
                <span>Automatically alternate Set A &amp; Set B if not specified in text</span>
              </label>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-3.5 py-2 text-slate-500 hover:text-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkAddMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition"
                >
                  {bulkAddMutation.isPending ? 'Importing Roster...' : 'Import Students'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
