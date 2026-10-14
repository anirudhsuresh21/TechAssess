'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FileCheck2,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Clock,
  Award,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { QuestionCategory } from '@techassess/shared';

export default function CreateAssessmentPage() {
  const router = useRouter();

  // Basic Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [totalMarks, setTotalMarks] = useState(25);
  const [passMarks, setPassMarks] = useState(12);
  const [negativeMarkingRate, setNegativeMarkingRate] = useState(0.25);

  // Configuration Switches
  const [allowQuestionReturn, setAllowQuestionReturn] = useState(true);
  const [allowAnswerChange, setAllowAnswerChange] = useState(true);
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [randomizeOptions, setRandomizeOptions] = useState(true);
  const [showResultsImmediately, setShowResultsImmediately] = useState(true);
  const [allowReviewAnswers, setAllowReviewAnswers] = useState(true);
  const [maxFocusLossCount, setMaxFocusLossCount] = useState(3);

  // Sections
  const [sections, setSections] = useState<
    Array<{
      name: string;
      category: string;
      description: string;
      timeLimitMinutes?: number;
      questionIds: string[];
    }>
  >([
    {
      name: 'Quantitative Aptitude & Logic',
      category: QuestionCategory.NUMERICAL_APTITUDE,
      description: 'Numerical agility and reasoning',
      timeLimitMinutes: 20,
      questionIds: [],
    },
    {
      name: 'Computer Fundamentals',
      category: QuestionCategory.COMPUTER_FUNDAMENTALS,
      description: 'Operating systems, Linux, SQL, and networking',
      timeLimitMinutes: 25,
      questionIds: [],
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all available questions from question bank
  const { data: questionBankData } = useQuery({
    queryKey: ['questions-bank-for-wizard'],
    queryFn: () => apiRequest('/questions?limit=100'),
  });

  const availableQuestions = questionBankData || [];

  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        name: `Section ${sections.length + 1}`,
        category: QuestionCategory.PROGRAMMING_DEBUGGING,
        description: '',
        questionIds: [],
      },
    ]);
  };

  const handleRemoveSection = (idx: number) => {
    setSections(sections.filter((_, i) => i !== idx));
  };

  const toggleQuestionInSection = (sectionIdx: number, qId: string) => {
    setSections(
      sections.map((sec, i) => {
        if (i !== sectionIdx) return sec;
        const exists = sec.questionIds.includes(qId);
        return {
          ...sec,
          questionIds: exists
            ? sec.questionIds.filter((id) => id !== qId)
            : [...sec.questionIds, qId],
        };
      })
    );
  };

  const handleSubmit = async (publishDirectly = false) => {
    setError('');

    if (!title.trim()) {
      setError('Assessment title is required');
      return;
    }
    if (!code.trim()) {
      setError('Examination access code is required');
      return;
    }

    const emptySection = sections.find((s) => s.questionIds.length === 0);
    if (publishDirectly && emptySection) {
      setError(`Section "${emptySection.name}" has no questions selected. Assign questions before publishing.`);
      return;
    }

    setIsLoading(true);

    try {
      const assessmentData = {
        title,
        description,
        code: code.trim().toUpperCase(),
        durationMinutes: Number(durationMinutes),
        totalMarks: Number(totalMarks),
        passMarks: Number(passMarks),
        negativeMarkingRate: Number(negativeMarkingRate),
        allowQuestionReturn,
        allowAnswerChange,
        randomizeQuestions,
        randomizeOptions,
        showResultsImmediately,
        allowReviewAnswers,
        sections: sections.map((s) => ({
          name: s.name,
          category: s.category,
          description: s.description,
          timeLimitMinutes: s.timeLimitMinutes ? Number(s.timeLimitMinutes) : undefined,
          questionIds: s.questionIds,
        })),
        integritySettings: {
          maxFocusLossCount: Number(maxFocusLossCount),
          flagOnFocusLoss: true,
          enforceFullscreen: false,
        },
      };

      const created = await apiRequest('/assessments', {
        method: 'POST',
        body: JSON.stringify(assessmentData),
      });

      if (publishDirectly) {
        await apiRequest(`/assessments/${created._id}/publish`, { method: 'POST' });
      }

      router.push('/admin/assessments');
    } catch (err: any) {
      setError(err.message || 'Failed to create assessment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/admin/assessments"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Examinations</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white mt-2 flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-indigo-400" />
          Create New Examination
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure timing, marks, anti-cheating tolerances, and question section blueprints.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Basic Information Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider text-indigo-400">
          1. Examination Overview
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Assessment Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MCA Induction Assessment 2026"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Access Code * (Alphanumeric uppercase)
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. MCA_RECRUIT_2026"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Description &amp; Instructions
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Instructions displayed to candidates before beginning..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 2. Timing, Marks, and Grading Rules */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider text-indigo-400">
          2. Timing &amp; Scoring Policy
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Duration (Minutes)
            </label>
            <input
              type="number"
              min={5}
              max={360}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Total Marks
            </label>
            <input
              type="number"
              min={1}
              value={totalMarks}
              onChange={(e) => setTotalMarks(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Passing Cutoff Marks
            </label>
            <input
              type="number"
              min={0}
              value={passMarks}
              onChange={(e) => setPassMarks(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Negative Marking Rate
            </label>
            <select
              value={negativeMarkingRate}
              onChange={(e) => setNegativeMarkingRate(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={0}>0% (No penalty)</option>
              <option value={0.25}>25% (-0.25x marks)</option>
              <option value={0.33}>33% (-0.33x marks)</option>
              <option value={0.5}>50% (-0.50x marks)</option>
            </select>
          </div>
        </div>

        {/* Candidate Rules & Integrity Toggles */}
        <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={randomizeQuestions}
              onChange={(e) => setRandomizeQuestions(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Randomize Question Order for Each Candidate</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={randomizeOptions}
              onChange={(e) => setRandomizeOptions(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Randomize MCQ Option Sequences</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={allowQuestionReturn}
              onChange={(e) => setAllowQuestionReturn(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Allow Navigating Back to Previous Questions</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={showResultsImmediately}
              onChange={(e) => setShowResultsImmediately(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Display Score Immediately upon Submission</span>
          </label>
        </div>
      </div>

      {/* 3. Sections & Question Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider text-indigo-400">
              3. Examination Sections &amp; Questions
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Organize questions by category and section time constraints.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddSection}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Section</span>
          </button>
        </div>

        {sections.map((section, sIdx) => (
          <div
            key={sIdx}
            className="p-5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Section #{sIdx + 1}
              </h3>
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSection(sIdx)}
                  className="text-slate-500 hover:text-rose-400 text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Section Name
                </label>
                <input
                  type="text"
                  value={section.name}
                  onChange={(e) => {
                    const copy = [...sections];
                    copy[sIdx].name = e.target.value;
                    setSections(copy);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Primary Category
                </label>
                <select
                  value={section.category}
                  onChange={(e) => {
                    const copy = [...sections];
                    copy[sIdx].category = e.target.value;
                    setSections(copy);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  {Object.values(QuestionCategory).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Time Limit (Mins, Optional)
                </label>
                <input
                  type="number"
                  value={section.timeLimitMinutes || ''}
                  onChange={(e) => {
                    const copy = [...sections];
                    copy[sIdx].timeLimitMinutes = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    setSections(copy);
                  }}
                  placeholder="e.g. 20"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Questions Picker for this Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-400">
                  Select Questions ({section.questionIds.length} assigned):
                </span>
                <span className="text-[10px] text-indigo-400">
                  Click card to toggle selection
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1.5 p-2 bg-slate-900/60 rounded-lg border border-slate-800/60">
                {availableQuestions.length === 0 ? (
                  <div className="text-center py-4 text-xs text-slate-500">
                    No questions in bank. Use the Question Bank to add questions first.
                  </div>
                ) : (
                  availableQuestions.map((q: any) => {
                    const isSelected = section.questionIds.includes(q._id);
                    return (
                      <div
                        key={q._id}
                        onClick={() => toggleQuestionInSection(sIdx, q._id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-indigo-950/60 border-indigo-500/60 text-white'
                            : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-700'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <span className="truncate font-medium">{q.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            [{q.type}]
                          </span>
                        </div>
                        <div className="shrink-0 text-[11px] text-slate-400 font-mono">
                          {q.marks}m (-{q.negativeMarks}m)
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
        <Link
          href="/admin/assessments"
          className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
        >
          Save as Draft
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
        >
          {isLoading ? 'Creating...' : 'Create & Publish Examination'}
        </button>
      </div>
    </div>
  );
}
