'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Database,
  Plus,
  Upload,
  Search,
  Copy,
  Archive,
  Download,
  CheckCircle2,
  Code2,
  Tag,
  Clock,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  QuestionCategory,
  QuestionDifficulty,
  QuestionType,
} from '@techassess/shared';

export default function QuestionBankPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // New Question Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<string>(QuestionCategory.NUMERICAL_APTITUDE);
  const [newTopic, setNewTopic] = useState('General');
  const [newDifficulty, setNewDifficulty] = useState<string>(QuestionDifficulty.EASY);
  const [newType, setNewType] = useState<string>(QuestionType.SINGLE_CHOICE);
  const [newMarks, setNewMarks] = useState(1);
  const [newNegativeMarks, setNewNegativeMarks] = useState(0.25);
  const [newExplanation, setNewExplanation] = useState('');
  const [newOptions, setNewOptions] = useState([
    { id: 'opt_1', text: '', isCorrect: true },
    { id: 'opt_2', text: '', isCorrect: false },
    { id: 'opt_3', text: '', isCorrect: false },
    { id: 'opt_4', text: '', isCorrect: false },
  ]);

  const { data: questions, isLoading } = useQuery({
    queryKey: ['questions', categoryFilter, difficultyFilter, typeFilter, searchTerm],
    queryFn: () => {
      const params = new URLSearchParams();
      if (categoryFilter) params.set('category', categoryFilter);
      if (difficultyFilter) params.set('difficulty', difficultyFilter);
      if (typeFilter) params.set('type', typeFilter);
      if (searchTerm) params.set('search', searchTerm);
      return apiRequest(`/questions?${params.toString()}`);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/questions/${id}/duplicate`, { method: 'POST' }),
    onSuccess: () => {
      setActionMessage('Question duplicated.');
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setTimeout(() => setActionMessage(''), 4000);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/questions/${id}/archive`, { method: 'POST' }),
    onSuccess: () => {
      setActionMessage('Question archived from active bank.');
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setTimeout(() => setActionMessage(''), 4000);
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/questions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      setActionMessage('New question added to Question Bank.');
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setIsModalOpen(false);
      setNewTitle('');
      setNewText('');
      setTimeout(() => setActionMessage(''), 4000);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createQuestionMutation.mutate({
      title: newTitle,
      text: newText,
      category: newCategory,
      topic: newTopic,
      difficulty: newDifficulty,
      type: newType,
      marks: Number(newMarks),
      negativeMarks: Number(newNegativeMarks),
      explanation: newExplanation || undefined,
      options: newType === QuestionType.SINGLE_CHOICE ? newOptions : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#06111f] flex items-center gap-2">
            <Database className="w-6 h-6 text-[#f37021]" />
            Curated Question Bank
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, and organize recruitment questions across all 5 technical categories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/questions/import"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition shadow-sm"
          >
            <Upload className="w-4 h-4 text-orange-600" />
            <span>Bulk Import (CSV)</span>
          </Link>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Question</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Filter and Search controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by keywords, text, or topic..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:bg-white"
          >
            <option value="">All Categories</option>
            {Object.values(QuestionCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:bg-white"
          >
            <option value="">All Difficulties</option>
            {Object.values(QuestionDifficulty).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-700 focus:bg-white"
          >
            <option value="">All Question Types</option>
            {Object.values(QuestionType).map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Questions Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading questions...</div>
      ) : !questions || questions.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <p className="text-sm">No questions found matching your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map((q: any) => (
            <div
              key={q._id}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-orange-400 hover:shadow-md transition shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-slate-900">{q.title}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        q.difficulty === 'EASY'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : q.difficulty === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {q.difficulty}
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {q.type}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{q.text}</p>

                {q.codeSnippet && (
                  <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-orange-300 overflow-x-auto">
                    {q.codeSnippet}
                  </pre>
                )}

                {/* Options Preview */}
                {q.options && q.options.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {q.options.map((opt: any) => (
                      <div
                        key={opt.id}
                        className={`text-[11px] px-2.5 py-1 rounded-md flex items-center justify-between ${
                          opt.isCorrect
                            ? 'bg-emerald-50 text-emerald-800 font-medium border border-emerald-200'
                            : 'text-slate-600'
                        }`}
                      >
                        <span className="truncate">{opt.text}</span>
                        {opt.isCorrect && (
                          <span className="text-[10px] text-emerald-700 font-mono font-bold">
                            ✓ Correct
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="text-orange-600 font-medium">
                    {q.category.replace(/_/g, ' ')}
                  </span>
                  <span>•</span>
                  <span>
                    {q.marks}m (-{q.negativeMarks}m)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => duplicateMutation.mutate(q._id)}
                    title="Duplicate question"
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => archiveMutation.mutate(q._id)}
                    title="Archive question"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900">Create Question</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Short descriptive title"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Question Text *</label>
                <textarea
                  rows={3}
                  required
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="Full question problem statement..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:bg-white"
                  >
                    {Object.values(QuestionCategory).map((c) => (
                      <option key={c} value={c}>
                        {c.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:bg-white"
                  >
                    {Object.values(QuestionDifficulty).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:bg-white"
                  >
                    <option value={QuestionType.SINGLE_CHOICE}>Single Choice MCQ</option>
                    <option value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</option>
                    <option value={QuestionType.NUMERICAL}>Numerical</option>
                    <option value={QuestionType.CODE_OUTPUT}>Code Output</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Marks</label>
                  <input
                    type="number"
                    value={newMarks}
                    onChange={(e) => setNewMarks(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Negative Marks</label>
                  <input
                    type="number"
                    value={newNegativeMarks}
                    onChange={(e) => setNewNegativeMarks(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              {/* Options for MCQ */}
              {newType === QuestionType.SINGLE_CHOICE && (
                <div className="space-y-2 pt-2">
                  <label className="block text-slate-700 font-semibold">Options (Select radio for correct)</label>
                  {newOptions.map((opt, oIdx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctOpt"
                        checked={opt.isCorrect}
                        onChange={() => {
                          setNewOptions(
                            newOptions.map((o, i) => ({ ...o, isCorrect: i === oIdx }))
                          );
                        }}
                      />
                      <input
                        type="text"
                        value={opt.text}
                        required
                        placeholder={`Option ${oIdx + 1}`}
                        onChange={(e) => {
                          const copy = [...newOptions];
                          copy[oIdx].text = e.target.value;
                          setNewOptions(copy);
                        }}
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:bg-white"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Explanation / Solution Note</label>
                <input
                  type="text"
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  placeholder="Explanation shown during result review..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createQuestionMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-sm transition"
                >
                  {createQuestionMutation.isPending ? 'Saving...' : 'Add to Question Bank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
