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
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function AssessmentStudentsPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [setFilter, setSetFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

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
      setActionMessage('Student removed from exam roster.');
      queryClient.invalidateQueries({ queryKey: ['assessment-candidates', accessCode] });
      setTimeout(() => setActionMessage(''), 4000);
    },
    onError: (err: any) => setErrorMessage(err.message || 'Failed to delete student'),
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
      // Format: RollNumber, Name, Division, Set (or RollNumber, Name)
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
    const headers = ['Roll Number', 'Student Name', 'Division', 'Assigned Set', 'Attempt Status', 'Percentage'];
    const rows = candidates.map((c: any) => [
      c.rollNumber,
      `"${c.name}"`,
      c.division,
      c.assignedSet || 'A',
      c.attemptStatus,
      c.percentage !== undefined ? `${c.percentage}%` : 'N/A',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${accessCode}_student_roster_sets.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter candidates
  const filteredCandidates = candidates.filter((c: any) => {
    if (setFilter && c.assignedSet !== setFilter) return false;
    if (statusFilter && c.attemptStatus !== statusFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.rollNumber.toLowerCase().includes(term) ||
      c.name.toLowerCase().includes(term) ||
      c.division?.toLowerCase().includes(term)
    );
  });

  const countSetA = candidates.filter((c: any) => c.assignedSet === 'A').length;
  const countSetB = candidates.filter((c: any) => c.assignedSet === 'B').length;

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
                Student Roster &amp; Seating Arrangement
              </h1>
              {accessCode && (
                <span className="font-mono text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                  {accessCode}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Authorized students list for <strong>{assessment?.title || 'Examination'}</strong>. Students log in using their <strong>Roll Number</strong> as username and password.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => autoAssignMutation.mutate()}
              disabled={autoAssignMutation.isPending || candidates.length === 0}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Assigns alternating Set A and Set B based on student seating order"
            >
              <Shuffle className="w-3.5 h-3.5 text-amber-700" />
              <span>Auto-Assign Sets (Seating A/B)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
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

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-500 block">Total Authorized Students</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{candidates.length}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-500 block">Assigned to Set A</span>
          <span className="text-xl font-black text-orange-600 mt-1 block">{countSetA}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-500 block">Assigned to Set B</span>
          <span className="text-xl font-black text-amber-600 mt-1 block">{countSetB}</span>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-500 block">Exam Submissions</span>
          <span className="text-xl font-black text-emerald-600 mt-1 block">
            {candidates.filter((c: any) => c.attemptStatus === 'SUBMITTED' || c.attemptStatus === 'EVALUATED').length}
          </span>
        </div>
      </div>

      {/* Seating Arrangement Notice */}
      <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
          <span className="text-slate-700">
            <strong>Pre-Exam Seating Control:</strong> You can switch any student between <strong>Set A</strong> and <strong>Set B</strong> up to 10–15 minutes before the exam begins according to physical computer lab seating. When students log in with their Roll Number, their assigned set loads automatically.
          </span>
        </div>
        {candidates.length > 0 && (
          <button
            type="button"
            onClick={handleExportRoster}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-orange-100 text-orange-800 border border-orange-300 font-bold transition flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Roster CSV</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name or roll number..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={setFilter}
            onChange={(e) => setSetFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
          >
            <option value="">All Sets (A &amp; B)</option>
            <option value="A">Set A Only</option>
            <option value="B">Set B Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
          >
            <option value="">All Attempt Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="SUBMITTED">Submitted</option>
          </select>
        </div>
      </div>

      {/* Candidate Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {isCandidatesLoading || isAssessmentLoading ? (
          <div className="py-16 text-center text-xs text-slate-500">Loading student roster...</div>
        ) : filteredCandidates.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-800">No students found.</p>
            <p className="text-xs text-slate-500">Click &quot;Add Student&quot; or &quot;Bulk Import&quot; to authorize students for this exam.</p>
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
                  <th className="px-4 py-3.5">Examination Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map((candidate: any) => {
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
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            candidate.attemptStatus === 'SUBMITTED' || candidate.attemptStatus === 'EVALUATED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : candidate.attemptStatus === 'IN_PROGRESS'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {candidate.attemptStatus === 'SUBMITTED' && candidate.percentage !== undefined
                            ? `Submitted (${candidate.percentage}%)`
                            : candidate.attemptStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {candidate.attemptStatus === 'NOT_STARTED' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Remove ${candidate.name} (${candidate.rollNumber}) from this exam?`)) {
                                deleteCandidateMutation.mutate(candidate.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50"
                            title="Remove student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Add Single Student */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-600" />
                Add Student to Examination
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
                  Student Roll Number (Username &amp; Password)
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
                  Full Student Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Division
                  </label>
                  <input
                    type="text"
                    value={newDivision}
                    onChange={(e) => setNewDivision(e.target.value.toUpperCase())}
                    placeholder="A / B"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Assigned Set
                  </label>
                  <select
                    value={newAssignedSet}
                    onChange={(e) => setNewAssignedSet(e.target.value as 'A' | 'B')}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold focus:bg-white"
                  >
                    <option value="A">Set A</option>
                    <option value="B">Set B</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addCandidateMutation.isPending}
                  className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold transition shadow-sm"
                >
                  {addCandidateMutation.isPending ? 'Adding...' : 'Add Student'}
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
                Bulk Import Students
              </h2>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkAdd} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Paste Student Records (One per line)
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Format: <code>RollNumber, Student Name</code> or <code>RollNumber, Student Name, Division, Set</code>
                </p>
                <textarea
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`MCA2026-001, Aarav Sharma\nMCA2026-002, Priya Patel\nMCA2026-003, Rohan Deshmukh\nMCA2026-004, Sneha Kulkarni`}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono text-xs focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <label className="flex items-center gap-2 text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={bulkAutoAlternate}
                  onChange={(e) => setBulkAutoAlternate(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
                />
                <span>Automatically alternate Set A and Set B according to list order (Seating arrangement)</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkAddMutation.isPending}
                  className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold transition shadow-sm"
                >
                  {bulkAddMutation.isPending ? 'Importing...' : 'Import Students'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
