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
  Layers,
  Sparkles,
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

  // Sets Configuration (Dual Competitive Exam Rollout)
  const [setsEnabled, setSetsEnabled] = useState(true);
  const [activeSetTab, setActiveSetTab] = useState<'A' | 'B'>('A');

  // Sections (Set A base)
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

  // Set B sections (can be customized or auto-balanced)
  const [setBSections, setSetBSections] = useState<
    Array<{
      name: string;
      category: string;
      description: string;
      timeLimitMinutes?: number;
      questionIds: string[];
    }>
  >([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all available questions from question bank
  // Fetch all available questions from question bank (support up to 1000 questions)
  const { data: questionBankData } = useQuery({
    queryKey: ['questions-bank-for-wizard'],
    queryFn: () => apiRequest('/questions?limit=1000'),
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

  const handleAddSectionB = () => {
    setSetBSections([
      ...setBSections,
      {
        name: `Section ${setBSections.length + 1}`,
        category: QuestionCategory.PROGRAMMING_DEBUGGING,
        description: '',
        questionIds: [],
      },
    ]);
  };

  const handleRemoveSectionB = (idx: number) => {
    setSetBSections(setBSections.filter((_, i) => i !== idx));
  };

  const toggleQuestionInSectionB = (sectionIdx: number, qId: string) => {
    setSetBSections(
      setBSections.map((sec, i) => {
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

  const copyStructureToSetB = () => {
    setSetBSections(
      sections.map((sec) => ({
        name: sec.name,
        category: sec.category,
        description: sec.description,
        timeLimitMinutes: sec.timeLimitMinutes,
        questionIds: [], // Empty questions so admin can choose distinct questions for Set B!
      }))
    );
  };

  const handleSubmit = async (publishDirectly: boolean = false) => {
    setError('');

    if (!title.trim() || !code.trim()) {
      setError('Title and examination access code are required.');
      return;
    }

    if (sections.length === 0) {
      setError('You must add at least one question section for Set A.');
      return;
    }

    const emptySection = sections.find((s) => s.questionIds.length === 0);
    if (publishDirectly && emptySection) {
      setError(`Set A Section "${emptySection.name}" has no questions selected. Assign questions before publishing.`);
      return;
    }

    const finalSetB = setBSections.length > 0 ? setBSections : sections;
    if (publishDirectly && setsEnabled && setBSections.length > 0) {
      const emptySectionB = setBSections.find((s) => s.questionIds.length === 0);
      if (emptySectionB) {
        setError(`Set B Section "${emptySectionB.name}" has no questions selected. Assign questions or copy Set A before publishing.`);
        return;
      }
    }

    setIsLoading(true);

    try {
      // Build Sets A and B payloads (with genuinely distinct question papers)
      const setsPayload = setsEnabled
        ? [
            {
              setCode: 'A',
              name: 'Set A',
              description: 'Primary Recruitment Question Paper (Set A)',
              sections: sections.map((s) => ({
                name: s.name,
                category: s.category,
                description: s.description,
                timeLimitMinutes: s.timeLimitMinutes ? Number(s.timeLimitMinutes) : undefined,
                questionIds: s.questionIds,
              })),
            },
            {
              setCode: 'B',
              name: 'Set B',
              description: 'Alternate Distinct Recruitment Question Paper (Set B)',
              sections: finalSetB.map((s) => ({
                name: s.name,
                category: s.category,
                description: s.description,
                timeLimitMinutes: s.timeLimitMinutes ? Number(s.timeLimitMinutes) : undefined,
                questionIds: s.questionIds,
              })),
            },
          ]
        : [];

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
        setsEnabled,
        sets: setsPayload,
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

      router.push(`/admin/assessments/${created._id}/paper`);
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
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Examinations</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-[#06111f] mt-2 flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-[#f37021]" />
          Create New Examination
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure timing, marks, Sets A &amp; B dual paper rollout, anti-cheating, and question blueprints.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Basic Information Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-orange-600">
          1. Examination Overview
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assessment Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MCA Induction Assessment 2026"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Access Code * (Alphanumeric uppercase)
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. MCA_RECRUIT_2026"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-mono uppercase placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description &amp; Instructions
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Instructions displayed to candidates before beginning..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* 2. Sets A & B Dual Paper Configuration (Competitive Exams) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-orange-600" />
                2. Dual Question Paper Sets (Set A &amp; Set B)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200">
                Competitive Standard
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Concurrently deploy two distinct question papers. Alternating candidates get Set A and Set B to prevent copying.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={setsEnabled}
              onChange={(e) => setSetsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            <span className="ml-3 text-xs font-semibold text-slate-700">
              {setsEnabled ? 'Enabled (Sets A & B)' : 'Disabled (Single Set)'}
            </span>
          </label>
        </div>

        {setsEnabled && (
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0 font-bold font-mono">
                  A
                </div>
                <div>
                  <div className="font-bold text-slate-800">Question Paper — Set A</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Standard configured question sections assigned to even-parity candidate seats.
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold font-mono">
                  B
                </div>
                <div>
                  <div className="font-bold text-slate-800">Question Paper — Set B</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Alternate balanced question sequence assigned to odd-parity candidate seats.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Timing, Marks, and Grading Rules */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-orange-600">
          3. Timing &amp; Scoring Policy
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Duration (Minutes)
            </label>
            <input
              type="number"
              min={5}
              max={300}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Total Marks
            </label>
            <input
              type="number"
              min={1}
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pass Marks
            </label>
            <input
              type="number"
              min={0}
              value={passMarks}
              onChange={(e) => setPassMarks(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Negative Marking Rate
            </label>
            <select
              value={negativeMarkingRate}
              onChange={(e) => setNegativeMarkingRate(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            >
              <option value={0}>0 (No Penalty)</option>
              <option value={0.25}>0.25 (1/4th Marks)</option>
              <option value={0.33}>0.33 (1/3rd Marks)</option>
              <option value={0.5}>0.5 (1/2 Marks)</option>
            </select>
          </div>
        </div>

        {/* Examination Switches */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={randomizeQuestions}
              onChange={(e) => setRandomizeQuestions(e.target.checked)}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
            />
            <span>Randomize Question Order</span>
          </label>

          <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={randomizeOptions}
              onChange={(e) => setRandomizeOptions(e.target.checked)}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
            />
            <span>Randomize MCQ Options</span>
          </label>

          <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={allowQuestionReturn}
              onChange={(e) => setAllowQuestionReturn(e.target.checked)}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
            />
            <span>Allow Return to Previous</span>
          </label>

          <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={allowAnswerChange}
              onChange={(e) => setAllowAnswerChange(e.target.checked)}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
            />
            <span>Allow Changing Answers</span>
          </label>

          <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showResultsImmediately}
              onChange={(e) => setShowResultsImmediately(e.target.checked)}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
            />
            <span>Show Score Immediately</span>
          </label>

          <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={allowReviewAnswers}
              onChange={(e) => setAllowReviewAnswers(e.target.checked)}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
            />
            <span>Allow Answer Review</span>
          </label>
        </div>
      </div>

      {/* 4. Question Section Builder with Distinct Sets A & B */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-orange-600">
              4. Examination Blueprint &amp; Distinct Sets
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Create two completely distinct question papers for Set A and Set B (not just jumbled questions).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSetTab('A')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                activeSetTab === 'A'
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Set A ({sections.reduce((acc, s) => acc + s.questionIds.length, 0)} Qs)</span>
            </button>

            {setsEnabled && (
              <button
                type="button"
                onClick={() => {
                  if (setBSections.length === 0) {
                    copyStructureToSetB();
                  }
                  setActiveSetTab('B');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                  activeSetTab === 'B'
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Set B ({setBSections.reduce((acc, s) => acc + s.questionIds.length, 0)} Qs)</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Set Tab Notice */}
        <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-orange-900">
              Currently Editing: {activeSetTab === 'A' ? 'Question Paper Set A' : 'Question Paper Set B (Distinct)'}
            </span>
          </div>

          {activeSetTab === 'B' && (
            <button
              type="button"
              onClick={copyStructureToSetB}
              className="text-xs text-orange-700 hover:text-orange-900 underline font-semibold self-start sm:self-auto"
            >
              Reset / Copy Set A Section Blueprint
            </button>
          )}
        </div>

        {/* Set A Sections */}
        {activeSetTab === 'A' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Set A Sections ({sections.length})</span>
              <button
                type="button"
                onClick={handleAddSection}
                className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 text-xs font-bold transition flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Section to Set A</span>
              </button>
            </div>

            {sections.map((section, sIdx) => (
              <div
                key={sIdx}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={section.name}
                      onChange={(e) =>
                        setSections(
                          sections.map((s, i) =>
                            i === sIdx ? { ...s, name: e.target.value } : s
                          )
                        )
                      }
                      placeholder="Section Title"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />

                    <select
                      value={section.category}
                      onChange={(e) =>
                        setSections(
                          sections.map((s, i) =>
                            i === sIdx ? { ...s, category: e.target.value } : s
                          )
                        )
                      }
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {Object.values(QuestionCategory).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 shrink-0">Time (mins):</span>
                      <input
                        type="number"
                        value={section.timeLimitMinutes || ''}
                        onChange={(e) =>
                          setSections(
                            sections.map((s, i) =>
                              i === sIdx
                                ? {
                                    ...s,
                                    timeLimitMinutes: e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  }
                                : s
                            )
                          )
                        }
                        placeholder="Optional"
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(sIdx)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition"
                      title="Remove Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Questions Picker for this Set A section */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-600 font-semibold">
                      Set A Assigned Questions ({section.questionIds.length})
                    </span>
                    <span className="text-[11px] text-orange-600 font-medium">
                      Select questions specifically for Set A
                    </span>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-white rounded-xl border border-slate-200">
                    {availableQuestions.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-500">
                        No questions found in question bank.
                      </div>
                    ) : (
                      availableQuestions.map((q: any) => {
                        const isSelected = section.questionIds.includes(q._id);
                        const isUsedInB = setBSections.some((s) => s.questionIds.includes(q._id));
                        return (
                          <div
                            key={q._id}
                            onClick={() => toggleQuestionInSection(sIdx, q._id)}
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-orange-50 border-orange-400 text-orange-950 font-medium'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-orange-500 text-white' : 'border border-slate-300'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                              <span className="truncate">{q.title}</span>
                              {isUsedInB && (
                                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                                  In Set B
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0 text-[10px]">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {q.category}
                              </span>
                              <span className="font-mono text-orange-600 font-bold">
                                {q.marks}m
                              </span>
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
        )}

        {/* Set B Sections */}
        {activeSetTab === 'B' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Set B Sections ({setBSections.length})</span>
              <button
                type="button"
                onClick={handleAddSectionB}
                className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 text-xs font-bold transition flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Section to Set B</span>
              </button>
            </div>

            {setBSections.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <p className="text-xs text-slate-600">No sections added to Set B yet.</p>
                <button
                  type="button"
                  onClick={copyStructureToSetB}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white text-xs font-bold shadow-sm"
                >
                  Copy Set A Structure to Set B
                </button>
              </div>
            ) : (
              setBSections.map((section, sIdx) => (
                <div
                  key={sIdx}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) =>
                          setSetBSections(
                            setBSections.map((s, i) =>
                              i === sIdx ? { ...s, name: e.target.value } : s
                            )
                          )
                        }
                        placeholder="Section Title"
                        className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />

                      <select
                        value={section.category}
                        onChange={(e) =>
                          setSetBSections(
                            setBSections.map((s, i) =>
                              i === sIdx ? { ...s, category: e.target.value } : s
                            )
                          )
                        }
                        className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {Object.values(QuestionCategory).map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 shrink-0">Time (mins):</span>
                        <input
                          type="number"
                          value={section.timeLimitMinutes || ''}
                          onChange={(e) =>
                            setSetBSections(
                              setBSections.map((s, i) =>
                                i === sIdx
                                  ? {
                                      ...s,
                                      timeLimitMinutes: e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                    }
                                  : s
                              )
                            )
                          }
                          placeholder="Optional"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    {setBSections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSectionB(sIdx)}
                        className="p-2 text-slate-400 hover:text-rose-600 transition"
                        title="Remove Section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Questions Picker for this Set B section */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-slate-600 font-semibold">
                        Set B Assigned Questions ({section.questionIds.length})
                      </span>
                      <span className="text-[11px] text-orange-600 font-medium">
                        Select distinct questions for Set B
                      </span>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-white rounded-xl border border-slate-200">
                      {availableQuestions.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-500">
                          No questions found in question bank.
                        </div>
                      ) : (
                        availableQuestions.map((q: any) => {
                          const isSelected = section.questionIds.includes(q._id);
                          const isUsedInA = sections.some((s) => s.questionIds.includes(q._id));
                          return (
                            <div
                              key={q._id}
                              onClick={() => toggleQuestionInSectionB(sIdx, q._id)}
                              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between gap-3 ${
                                isSelected
                                  ? 'bg-orange-50 border-orange-400 text-orange-950 font-medium'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div
                                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                                    isSelected ? 'bg-orange-500 text-white' : 'border border-slate-300'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3" />}
                                </div>
                                <span className="truncate">{q.title}</span>
                                {isUsedInA && (
                                  <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                                    In Set A
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0 text-[10px]">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  {q.category}
                                </span>
                                <span className="font-mono text-orange-600 font-bold">
                                  {q.marks}m
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link
          href="/admin/assessments"
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 transition shadow-sm"
        >
          Cancel
        </Link>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleSubmit(false)}
          className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-800 transition shadow-sm"
        >
          Save as Draft
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => handleSubmit(true)}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition flex items-center gap-1.5 tracking-wide"
        >
          {isLoading ? (
            <span>Publishing...</span>
          ) : (
            <>
              <span>Publish Assessment (Sets A &amp; B)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
