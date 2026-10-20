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
  Pencil,
  Eye,
  X,
  HelpCircle,
  AlertCircle,
  Trash2,
  Check,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import {
  QuestionCategory,
  QuestionDifficulty,
  QuestionType,
  SUPPORTED_PROGRAMMING_LANGUAGES,
} from '@techassess/shared';

export default function QuestionBankPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [limit, setLimit] = useState(100);
  const [actionMessage, setActionMessage] = useState('');

  // 1. Pop-Up View Detail Modal State
  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);

  // 2. Edit Question Modal State
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState<string>(QuestionCategory.NUMERICAL_APTITUDE);
  const [editTopic, setEditTopic] = useState('');
  const [editDifficulty, setEditDifficulty] = useState<string>(QuestionDifficulty.EASY);
  const [editType, setEditType] = useState<string>(QuestionType.SINGLE_CHOICE);
  const [editMarks, setEditMarks] = useState(1);
  const [editNegativeMarks, setEditNegativeMarks] = useState(0.25);
  const [editExplanation, setEditExplanation] = useState('');
  const [editCodeSnippet, setEditCodeSnippet] = useState('');
  const [editProgrammingLanguage, setEditProgrammingLanguage] = useState('');
  const [editOptions, setEditOptions] = useState<any[]>([]);
  const [editNumericalAnswer, setEditNumericalAnswer] = useState<number | undefined>(undefined);
  const [editNumericalTolerance, setEditNumericalTolerance] = useState<number>(0);

  // 3. Create Question Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<string>(QuestionCategory.NUMERICAL_APTITUDE);
  const [newTopic, setNewTopic] = useState('General');
  const [newDifficulty, setNewDifficulty] = useState<string>(QuestionDifficulty.EASY);
  const [newType, setNewType] = useState<string>(QuestionType.SINGLE_CHOICE);
  const [newProgrammingLanguage, setNewProgrammingLanguage] = useState('');
  const [newMarks, setNewMarks] = useState(1);
  const [newNegativeMarks, setNewNegativeMarks] = useState(0.25);
  const [newExplanation, setNewExplanation] = useState('');
  const [newOptions, setNewOptions] = useState([
    { id: 'opt_1', text: '', isCorrect: true },
    { id: 'opt_2', text: '', isCorrect: false },
    { id: 'opt_3', text: '', isCorrect: false },
    { id: 'opt_4', text: '', isCorrect: false },
  ]);

  // 4. Permanent Delete Question Modal State
  const [questionToDelete, setQuestionToDelete] = useState<any | null>(null);

  // Query: Fetch Questions
  const { data: questions, isLoading } = useQuery({
    queryKey: ['questions', categoryFilter, difficultyFilter, typeFilter, languageFilter, searchTerm, limit],
    queryFn: () => {
      const params = new URLSearchParams();
      if (categoryFilter) params.set('category', categoryFilter);
      if (difficultyFilter) params.set('difficulty', difficultyFilter);
      if (typeFilter) params.set('type', typeFilter);
      if (languageFilter) params.set('programmingLanguage', languageFilter);
      if (searchTerm) params.set('search', searchTerm);
      params.set('limit', String(limit));
      return apiRequest(`/questions?${params.toString()}`);
    },
  });

  // Mutation: Duplicate Question
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/questions/${id}/duplicate`, { method: 'POST' }),
    onSuccess: () => {
      setActionMessage('Question duplicated.');
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setTimeout(() => setActionMessage(''), 4000);
    },
  });

  // Mutation: Archive Question
  const archiveMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/questions/${id}/archive`, { method: 'POST' }),
    onSuccess: () => {
      setActionMessage('Question archived from active bank.');
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      if (selectedQuestion) setSelectedQuestion(null);
      setTimeout(() => setActionMessage(''), 4000);
    },
  });

  // Mutation: Permanent Delete Question
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/questions/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setActionMessage('Question permanently deleted.');
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      if (selectedQuestion) setSelectedQuestion(null);
      setQuestionToDelete(null);
      setTimeout(() => setActionMessage(''), 4000);
    },
    onError: (err: any) => {
      setActionMessage(`Delete failed: ${err.message || 'Error deleting question'}`);
      setQuestionToDelete(null);
      setTimeout(() => setActionMessage(''), 5000);
    },
  });

  // Mutation: Create Question
  const createQuestionMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest('/questions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      setActionMessage('New question added to Question Bank.');
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewText('');
      setTimeout(() => setActionMessage(''), 4000);
    },
  });

  // Mutation: Update Question
  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/questions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (updated: any) => {
      setActionMessage('Question and marks updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      if (selectedQuestion && selectedQuestion._id === updated._id) {
        setSelectedQuestion(updated);
      }
      setEditingQuestion(null);
      setTimeout(() => setActionMessage(''), 4000);
    },
  });

  // Open Edit Modal with pre-filled question data
  const handleOpenEdit = (q: any) => {
    setEditingQuestion(q);
    setEditTitle(q.title || '');
    setEditText(q.text || '');
    setEditCategory(q.category || QuestionCategory.NUMERICAL_APTITUDE);
    setEditTopic(q.topic || '');
    setEditDifficulty(q.difficulty || QuestionDifficulty.EASY);
    setEditType(q.type || QuestionType.SINGLE_CHOICE);
    setEditProgrammingLanguage(q.programmingLanguage || '');
    setEditMarks(q.marks || 1);
    setEditNegativeMarks(q.negativeMarks || 0);
    setEditExplanation(q.explanation || '');
    setEditCodeSnippet(q.codeSnippet || '');
    setEditNumericalAnswer(q.numericalAnswer);
    setEditNumericalTolerance(q.numericalTolerance || 0);

    if (q.options && q.options.length > 0) {
      setEditOptions(q.options.map((o: any) => ({ ...o })));
    } else {
      setEditOptions([
        { id: 'opt_1', text: '', isCorrect: true },
        { id: 'opt_2', text: '', isCorrect: false },
        { id: 'opt_3', text: '', isCorrect: false },
        { id: 'opt_4', text: '', isCorrect: false },
      ]);
    }
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const payload: any = {
      title: editTitle,
      text: editText,
      category: editCategory,
      topic: editTopic,
      difficulty: editDifficulty,
      type: editType,
      programmingLanguage: editProgrammingLanguage || null,
      marks: Number(editMarks),
      negativeMarks: Number(editNegativeMarks),
      explanation: editExplanation || undefined,
      codeSnippet: editCodeSnippet.trim() ? editCodeSnippet : undefined,
    };

    if (editType === QuestionType.SINGLE_CHOICE || editType === QuestionType.MULTIPLE_CHOICE || editType === QuestionType.CODE_OUTPUT) {
      payload.options = editOptions.map((o, idx) => ({
        id: o.id || `opt_${idx + 1}`,
        text: o.text,
        isCorrect: Boolean(o.isCorrect),
        explanation: o.explanation,
      }));
    } else if (editType === QuestionType.NUMERICAL) {
      payload.numericalAnswer = editNumericalAnswer !== undefined ? Number(editNumericalAnswer) : undefined;
      payload.numericalTolerance = Number(editNumericalTolerance || 0);
    }

    updateQuestionMutation.mutate({ id: editingQuestion._id, data: payload });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createQuestionMutation.mutate({
      title: newTitle,
      text: newText,
      category: newCategory,
      topic: newTopic,
      difficulty: newDifficulty,
      type: newType,
      programmingLanguage: newProgrammingLanguage || undefined,
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
            Central Question Bank
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse, preview, and edit questions. Click any tile to inspect answers and update marks.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/admin/questions/import"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold transition shadow-sm"
          >
            <Upload className="w-4 h-4 text-orange-600" />
            <span>Bulk CSV / Excel Import</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
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

      {/* Filter and Limit Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, topic, or keyword..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
            >
              <option value="">All Categories</option>
              {Object.values(QuestionCategory).map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Programming Language Filter */}
          <div>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
            >
              <option value="">All Languages</option>
              {SUPPORTED_PROGRAMMING_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
            >
              <option value="">All Difficulties</option>
              {Object.values(QuestionDifficulty).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Limit / View All Selector */}
          <div>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white"
            >
              <option value={20}>Show 20 questions</option>
              <option value={50}>Show 50 questions</option>
              <option value={100}>Show 100 questions</option>
              <option value={200}>Show 200 questions</option>
              <option value={1000}>Show All (1000) questions</option>
            </select>
          </div>
        </div>

        {/* Status Count Ribbon */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Viewing <strong className="text-slate-800">{questions?.length || 0}</strong> questions
            {categoryFilter ? ` in ${categoryFilter.replace(/_/g, ' ')}` : ' across all categories'}
          </span>
          <span className="text-[11px] text-slate-500">
            Tip: Click any tile to inspect answers &amp; solutions. Use the pencil icon to edit.
          </span>
        </div>
      </div>

      {/* Questions Tiles Grid (Compact Multi-Column Layout) */}
      {isLoading ? (
        <div className="py-24 text-center text-xs text-slate-500">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span>Loading questions from database...</span>
        </div>
      ) : !questions || questions.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <Database className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-800">No questions found matching your filter criteria.</p>
          <p className="text-xs text-slate-500 mt-1">Try selecting &quot;Show All questions&quot; or clearing your category filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {questions.map((q: any) => {
            const shortCategory = q.category
              ? q.category.replace(/_/g, ' ').replace('PROGRAMMING DEBUGGING', 'CODING').replace('PRACTICAL PROBLEM SOLVING', 'PROBLEM SOLVING')
              : 'GENERAL';

            return (
              <div
                key={q._id}
                onClick={() => setSelectedQuestion(q)}
                className="bg-white border border-slate-200 hover:border-orange-500 rounded-xl p-3.5 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3 group relative"
              >
                {/* Top Badges */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1 text-[10px]">
                    <span
                      className={`font-bold px-1.5 py-0.5 rounded ${
                        q.difficulty === 'EASY'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : q.difficulty === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {q.difficulty}
                    </span>
                    <div className="flex items-center gap-1">
                      {q.programmingLanguage && (
                        <span className="font-semibold px-1.5 py-0.5 rounded text-[9px] bg-purple-50 text-purple-700 border border-purple-200">
                          {q.programmingLanguage}
                        </span>
                      )}
                      <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[9px] border border-slate-200 font-semibold truncate max-w-[90px]">
                        {q.type?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Title & Statement snippet */}
                  <h3 className="font-bold text-xs text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-tight">
                    {q.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {q.text}
                  </p>
                </div>

                {/* Bottom Stats & Quick Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                      +{q.marks}m
                    </span>
                    {q.negativeMarks > 0 && (
                      <span className="font-mono text-slate-400 text-[10px]">
                        -{q.negativeMarks}m
                      </span>
                    )}
                  </div>

                  {/* Tile Action Buttons */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(q);
                      }}
                      title="Edit question and marks"
                      className="p-1 rounded text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateMutation.mutate(q._id);
                      }}
                      title="Duplicate question"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveMutation.mutate(q._id);
                      }}
                      title="Archive question"
                      className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuestionToDelete(q);
                      }}
                      title="Permanently delete question"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: Question Detail Pop-Up (When tile is clicked) */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Pop-Up Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedQuestion.difficulty === 'EASY'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : selectedQuestion.difficulty === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {selectedQuestion.difficulty}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                    {selectedQuestion.category?.replace(/_/g, ' ')}
                  </span>
                  {selectedQuestion.programmingLanguage && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                      Track: {selectedQuestion.programmingLanguage}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-500">
                    Topic: {selectedQuestion.topic || 'General'}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {selectedQuestion.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedQuestion(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Question Text Statement */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Problem Statement
              </label>
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {selectedQuestion.text}
              </p>
            </div>

            {/* Code Snippet if present */}
            {selectedQuestion.codeSnippet && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Source Code / Snippet
                </label>
                <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-orange-300 font-mono text-xs overflow-x-auto">
                  {selectedQuestion.codeSnippet}
                </pre>
              </div>
            )}

            {/* Options Preview with Correct Answers Highlighted */}
            {selectedQuestion.options && selectedQuestion.options.length > 0 && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Answer Options ({selectedQuestion.type})
                </label>
                <div className="space-y-1.5">
                  {selectedQuestion.options.map((opt: any, idx: number) => {
                    const optLetter = String.fromCharCode(65 + idx);
                    return (
                      <div
                        key={opt.id || idx}
                        className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                          opt.isCorrect
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] ${
                              opt.isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {optLetter}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {opt.isCorrect && (
                          <span className="text-[11px] font-mono text-emerald-700 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Correct Answer
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Numerical Answer if numerical type */}
            {selectedQuestion.type === 'NUMERICAL' && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <strong className="block font-bold">Numerical Correct Answer:</strong>
                <p className="font-mono">
                  Target Value: <strong>{selectedQuestion.numericalAnswer}</strong> (Tolerance: ±{selectedQuestion.numericalTolerance || 0})
                </p>
              </div>
            )}

            {/* Explanation Note */}
            {selectedQuestion.explanation && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
                <strong className="block font-bold text-amber-800 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  Solution &amp; Explanation:
                </strong>
                <p className="text-[11px] text-amber-800/90 whitespace-pre-wrap">
                  {selectedQuestion.explanation}
                </p>
              </div>
            )}

            {/* Marks & Policy Summary */}
            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 bg-slate-50/50 p-3 rounded-xl">
              <div>
                <span className="text-slate-500">Marks for Correct Answer: </span>
                <strong className="text-emerald-700 font-mono">+{selectedQuestion.marks} Marks</strong>
              </div>
              <div>
                <span className="text-slate-500">Negative Penalty: </span>
                <strong className="text-rose-700 font-mono">-{selectedQuestion.negativeMarks} Marks</strong>
              </div>
            </div>

            {/* Modal Bottom Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  const q = selectedQuestion;
                  setSelectedQuestion(null);
                  setQuestionToDelete(q);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Question</span>
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const q = selectedQuestion;
                    setSelectedQuestion(null);
                    handleOpenEdit(q);
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Question &amp; Marks</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedQuestion(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Question & Marks Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-orange-600" />
                Edit Question, Answers &amp; Marks
              </h2>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="p-1 text-slate-400 hover:text-slate-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Question Problem Statement *</label>
                <textarea
                  rows={4}
                  required
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Code Snippet */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Code Snippet (Optional)</label>
                <textarea
                  rows={3}
                  value={editCodeSnippet}
                  onChange={(e) => setEditCodeSnippet(e.target.value)}
                  placeholder="e.g. const x = 10; console.log(x);"
                  className="w-full bg-slate-900 text-orange-300 font-mono rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Category, Topic, Difficulty & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white"
                  >
                    {Object.values(QuestionCategory).map((c) => (
                      <option key={c} value={c}>
                        {c.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Topic</label>
                  <input
                    type="text"
                    required
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Difficulty</label>
                  <select
                    value={editDifficulty}
                    onChange={(e) => setEditDifficulty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white"
                  >
                    {Object.values(QuestionDifficulty).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Question Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white"
                  >
                    <option value={QuestionType.SINGLE_CHOICE}>Single Choice MCQ</option>
                    <option value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice MSQ</option>
                    <option value={QuestionType.NUMERICAL}>Numerical</option>
                    <option value={QuestionType.CODE_OUTPUT}>Code Output</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Programming Language Track (Optional)
                  </label>
                  <select
                    value={editProgrammingLanguage}
                    onChange={(e) => setEditProgrammingLanguage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white"
                  >
                    <option value="">None / General (Not language-specific)</option>
                    {SUPPORTED_PROGRAMMING_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang} Track
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Marks & Negative Marks */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Marks for Correct (+m) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={editMarks}
                    onChange={(e) => setEditMarks(parseFloat(e.target.value) || 1)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Negative Penalty (-m) *</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    required
                    value={editNegativeMarks}
                    onChange={(e) => setEditNegativeMarks(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Options for MCQ / MSQ / CODE_OUTPUT */}
              {(editType === QuestionType.SINGLE_CHOICE || editType === QuestionType.MULTIPLE_CHOICE || editType === QuestionType.CODE_OUTPUT) && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-bold">
                      Options &amp; Correct Answer Selection
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setEditOptions([
                          ...editOptions,
                          { id: `opt_${editOptions.length + 1}`, text: '', isCorrect: false },
                        ]);
                      }}
                      className="text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 text-[11px]"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Option
                    </button>
                  </div>

                  <div className="space-y-2">
                    {editOptions.map((opt, oIdx) => (
                      <div key={opt.id || oIdx} className="flex items-center gap-2">
                        {editType === QuestionType.SINGLE_CHOICE || editType === QuestionType.CODE_OUTPUT ? (
                          <input
                            type="radio"
                            name="editCorrectOpt"
                            checked={opt.isCorrect}
                            onChange={() => {
                              setEditOptions(
                                editOptions.map((o, i) => ({ ...o, isCorrect: i === oIdx }))
                              );
                            }}
                            className="w-4 h-4 text-orange-600"
                            title="Mark as correct answer"
                          />
                        ) : (
                          <input
                            type="checkbox"
                            checked={opt.isCorrect}
                            onChange={(e) => {
                              const copy = [...editOptions];
                              copy[oIdx].isCorrect = e.target.checked;
                              setEditOptions(copy);
                            }}
                            className="w-4 h-4 rounded text-orange-600"
                            title="Mark as correct answer"
                          />
                        )}

                        <span className="font-mono text-xs font-bold text-slate-400 w-5">
                          {String.fromCharCode(65 + oIdx)}.
                        </span>

                        <input
                          type="text"
                          required
                          value={opt.text}
                          placeholder={`Option ${oIdx + 1} text`}
                          onChange={(e) => {
                            const copy = [...editOptions];
                            copy[oIdx].text = e.target.value;
                            setEditOptions(copy);
                          }}
                          className={`flex-1 rounded-xl p-2 text-xs border ${
                            opt.isCorrect
                              ? 'bg-emerald-50/60 border-emerald-300 text-emerald-900 font-semibold'
                              : 'bg-slate-50 border-slate-300 text-slate-900'
                          }`}
                        />

                        {editOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditOptions(editOptions.filter((_, i) => i !== oIdx));
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="Remove option"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Numerical Answer */}
              {editType === QuestionType.NUMERICAL && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
                  <div>
                    <label className="block text-emerald-900 font-bold mb-1">Correct Numerical Value *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editNumericalAnswer ?? ''}
                      onChange={(e) => setEditNumericalAnswer(e.target.value === '' ? undefined : parseFloat(e.target.value))}
                      className="w-full bg-white border border-emerald-300 rounded-xl p-2 text-slate-900 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-emerald-900 font-bold mb-1">Acceptable Tolerance (±)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={editNumericalTolerance}
                      onChange={(e) => setEditNumericalTolerance(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-emerald-300 rounded-xl p-2 text-slate-900 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Explanation / Solution Steps</label>
                <textarea
                  rows={2}
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  placeholder="Explanation shown during review..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateQuestionMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition"
                >
                  {updateQuestionMutation.isPending ? 'Saving Updates...' : 'Save Question & Marks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Create Question Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <h2 className="text-base font-bold text-slate-900">Create New Question</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Short descriptive title"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white"
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white"
                  >
                    {Object.values(QuestionCategory).map((c) => (
                      <option key={c} value={c}>
                        {c.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Topic</label>
                  <input
                    type="text"
                    required
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white"
                  >
                    {Object.values(QuestionDifficulty).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white"
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
                    step="0.5"
                    value={newMarks}
                    onChange={(e) => setNewMarks(parseFloat(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Negative Marks</label>
                  <input
                    type="number"
                    step="0.25"
                    value={newNegativeMarks}
                    onChange={(e) => setNewNegativeMarks(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">
                    Programming Language Track (Optional)
                  </label>
                  <select
                    value={newProgrammingLanguage}
                    onChange={(e) => setNewProgrammingLanguage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white"
                  >
                    <option value="">None / General (Not language-specific)</option>
                    {SUPPORTED_PROGRAMMING_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang} Track
                      </option>
                    ))}
                  </select>
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
                        name="newCorrectOpt"
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
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white"
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-900 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
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

      {/* Modal 4: Permanent Delete Confirmation Pop-Up */}
      {questionToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Permanently Delete Question?</h3>
                <p className="text-xs text-slate-500">
                  This will completely remove the question from the database. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1">
              <div className="font-bold text-slate-900 truncate">{questionToDelete.title}</div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>{questionToDelete.category}</span>
                <span>•</span>
                <span className="font-mono text-orange-600 font-semibold">{questionToDelete.marks} Marks</span>
                {questionToDelete.programmingLanguage && (
                  <>
                    <span>•</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800 font-bold">
                      {questionToDelete.programmingLanguage} Track
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setQuestionToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(questionToDelete._id)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
