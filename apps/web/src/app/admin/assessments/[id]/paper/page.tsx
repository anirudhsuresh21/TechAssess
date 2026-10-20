'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  ArrowLeft,
  Clock,
  Award,
  Layers,
  Printer,
  Eye,
  EyeOff,
  CheckCircle2,
  Users,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { SUPPORTED_PROGRAMMING_LANGUAGES } from '@techassess/shared';

export default function ViewQuestionPaperPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const router = useRouter();

  const [activeSet, setActiveSet] = useState<'A' | 'B' | 'BASE'>('A');
  const [showAnswerKey, setShowAnswerKey] = useState(true);
  const [selectedPaperLanguage, setSelectedPaperLanguage] = useState<string>('Java');

  // Fetch Assessment details with populated questions
  const { data: assessment, isLoading, error } = useQuery({
    queryKey: ['assessment-paper', assessmentId],
    queryFn: () => apiRequest(`/assessments/${assessmentId}`),
  });

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs text-slate-500">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <span>Loading Question Paper and Sections...</span>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs inline-block">
          Failed to load examination question paper.
        </div>
        <div>
          <Link
            href="/admin/assessments"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Assessments</span>
          </Link>
        </div>
      </div>
    );
  }

  const hasSets = assessment.sets && assessment.sets.length > 0;
  const setA = assessment.sets?.find((s: any) => s.setCode === 'A');
  const setB = assessment.sets?.find((s: any) => s.setCode === 'B');

  // Determine active sections based on activeSet
  let activeSections = assessment.sections || [];
  if (hasSets) {
    if (activeSet === 'A' && setA?.sections?.length > 0) {
      activeSections = setA.sections;
    } else if (activeSet === 'B' && setB?.sections?.length > 0) {
      activeSections = setB.sections;
    }
  }

  // Deduplicate questions for display in the published question paper
  const getSectionQuestions = (sec: any) => {
    const commonQs = sec.questionIds || [];
    const langQs = sec.hasLanguageTracks
      ? (sec.languageOptionsPopulated?.[selectedPaperLanguage] || sec.languageOptions?.[selectedPaperLanguage] || [])
      : [];
    const seenIds = new Set<string>();
    const seenSigs = new Set<string>();
    const qList: any[] = [];

    [...commonQs, ...langQs].forEach((q: any) => {
      const qId = typeof q === 'object' && q !== null ? q._id?.toString() || q.id?.toString() : String(q);
      const sig = typeof q === 'object' && q !== null
        ? ((q.title || '').trim() + ':::' + (q.text || '').trim()).toLowerCase()
        : qId;

      if (!seenIds.has(qId) && !seenSigs.has(sig)) {
        seenIds.add(qId);
        seenSigs.add(sig);
        qList.push(q);
      }
    });

    return qList;
  };

  // Calculate question and marks counts for the active view
  let totalActiveQuestions = 0;
  let totalActiveMarks = 0;
  const anyHasLanguageTracks = activeSections.some((s: any) => s.hasLanguageTracks);

  activeSections.forEach((sec: any) => {
    const qList = getSectionQuestions(sec);
    totalActiveQuestions += qList.length;
    qList.forEach((q: any) => {
      if (typeof q === 'object' && q.marks) {
        totalActiveMarks += q.marks;
      }
    });
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto print:p-0 print:m-0 print:max-w-none">
      {/* Top Navigation & Action Controls (Hidden when printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/assessments"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-sm"
            title="Back to assessments"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                {assessment.code}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  assessment.status === 'PUBLISHED'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {assessment.status}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
              {assessment.title}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle Answer Key Button */}
          <button
            type="button"
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm ${
              showAnswerKey
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {showAnswerKey ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
            <span>{showAnswerKey ? 'Answer Key: Visible' : 'Answer Key: Hidden'}</span>
          </button>

          {/* Print Question Paper Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Paper / PDF</span>
          </button>

          {/* Link to Students & Sets */}
          <Link
            href={`/admin/assessments/${assessmentId}/students`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition shadow-sm"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Students &amp; Sets</span>
          </Link>
        </div>
      </div>

      {/* Set Switcher Tabs (If Sets are enabled) */}
      {hasSets && (
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 print:hidden">
          <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-orange-600" /> Select Question Paper:
          </span>
          <button
            type="button"
            onClick={() => setActiveSet('A')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 ${
              activeSet === 'A'
                ? 'bg-orange-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span>Set A Question Paper</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10">
              {setA?.sections?.reduce((sum: number, s: any) => sum + (s.questionIds?.length || 0), 0) || 0} Qs
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSet('B')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 ${
              activeSet === 'B'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <span>Set B Question Paper</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10">
              {setB?.sections?.reduce((sum: number, s: any) => sum + (s.questionIds?.length || 0), 0) || 0} Qs
            </span>
          </button>
        </div>
      )}

      {/* Multi-Language Track Selector (if sections have language tracks) */}
      {anyHasLanguageTracks && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50/70 border border-purple-200 p-3.5 rounded-2xl shadow-sm print:hidden">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="text-xs font-bold text-purple-950">
              Viewing Programming Language Track:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {SUPPORTED_PROGRAMMING_LANGUAGES.map((lang) => {
              const isSelected = selectedPaperLanguage === lang;
              const icons: Record<string, string> = {
                Java: '☕',
                JavaScript: '🟨',
                Python: '🐍',
                C: '🔷',
                'C++': '⚡',
                'C#': '🟣',
              };
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedPaperLanguage(lang)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                    isSelected
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-purple-800 border border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  <span>{icons[lang] || '💻'}</span>
                  <span>{lang}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Question Paper Header Sheet */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Printable Institution Header */}
        <div className="border-b-2 border-slate-900 pb-5 text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <img src="/media/sun-logo.png" alt="Logo" className="w-10 h-10 object-contain print:w-8 print:h-8" />
            <div className="text-left">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
                TechAssess Recruitment Examination
              </h2>
              <p className="text-[11px] font-mono text-slate-600">
                Confidential Examination Paper • Code: {assessment.code}
              </p>
            </div>
          </div>

          <div className="pt-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {assessment.title}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              {hasSets && (
                <div className="inline-block px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-mono font-bold tracking-wider">
                  QUESTION PAPER {activeSet === 'A' ? 'SET A' : activeSet === 'B' ? 'SET B' : 'STANDARD'}
                </div>
              )}
              {anyHasLanguageTracks && (
                <div className="inline-block px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-mono font-bold tracking-wider">
                  TRACK: {selectedPaperLanguage.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Exam Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs text-left max-w-2xl mx-auto border-t border-slate-200 mt-4">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Duration:</span>
              <strong className="text-slate-900 font-mono">{assessment.durationMinutes} Minutes</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Marks:</span>
              <strong className="text-slate-900 font-mono">{assessment.totalMarks} Marks (Pass: {assessment.passMarks})</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Questions:</span>
              <strong className="text-slate-900 font-mono">{totalActiveQuestions} Questions</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Negative Marking:</span>
              <strong className="text-slate-900 font-mono">{assessment.negativeMarkingRate * 100}% per incorrect answer</strong>
            </div>
          </div>

          {/* Candidate Instructions */}
          {assessment.description && (
            <div className="text-xs text-slate-700 text-left bg-slate-50 p-3.5 rounded-xl border border-slate-200 mt-4 leading-relaxed">
              <strong className="text-slate-900 block mb-1">General Instructions:</strong>
              {assessment.description}
            </div>
          )}
        </div>

        {/* Sections and Questions */}
        {activeSections.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No sections or questions configured for this question paper set.
          </div>
        ) : (
          <div className="space-y-8">
            {activeSections.map((sec: any, secIdx: number) => {
              const qList = getSectionQuestions(sec);

              let secQuestionNumberStart = 1;
              for (let i = 0; i < secIdx; i++) {
                const prevList = getSectionQuestions(activeSections[i]);
                secQuestionNumberStart += prevList.length;
              }

              return (
                <div key={secIdx} className="space-y-4">
                  {/* Section Title Banner */}
                  <div className="bg-slate-100/80 border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <span>Section {secIdx + 1}: {sec.name}</span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          {sec.category?.replace(/_/g, ' ')}
                        </span>
                        {sec.hasLanguageTracks && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200">
                            Multi-Language Track: {selectedPaperLanguage}
                          </span>
                        )}
                      </h3>
                      {sec.description && (
                        <p className="text-[11px] text-slate-600 mt-0.5">{sec.description}</p>
                      )}
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-600">
                      {qList.length} Questions {sec.timeLimitMinutes ? `• ${sec.timeLimitMinutes} Mins` : ''}
                    </div>
                  </div>

                  {/* Question Items in Section */}
                  <div className="space-y-6 pl-1 sm:pl-3">
                    {qList.map((q: any, qIdx: number) => {
                      const isPopulated = typeof q === 'object' && q !== null;
                      const globalQNum = secQuestionNumberStart + qIdx;
                      const isLangQuestion = sec.hasLanguageTracks && (Boolean(q.programmingLanguage) || qIdx >= (sec.questionIds || []).length);

                      if (!isPopulated) {
                        return (
                          <div key={qIdx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-500">
                            Question ID: {String(q)} (Question record could not be loaded)
                          </div>
                        );
                      }

                      return (
                        <div
                          key={q._id || qIdx}
                          className="space-y-3 pb-6 border-b border-slate-200 last:border-b-0 break-inside-avoid"
                        >
                          {/* Question Number & Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                                Q{globalQNum}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900">
                                {q.title}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono">
                              {isLangQuestion ? (
                                <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-bold">
                                  {selectedPaperLanguage} Track
                                </span>
                              ) : (
                                sec.hasLanguageTracks && (
                                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                                    Common Programming
                                  </span>
                                )
                              )}
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                                {q.type}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 font-bold">
                                +{q.marks}m {q.negativeMarks ? `/ -${q.negativeMarks}m` : ''}
                              </span>
                            </div>
                          </div>

                          {/* Question Statement */}
                          <p className="text-xs text-slate-800 leading-relaxed font-medium pl-9 whitespace-pre-wrap">
                            {q.text}
                          </p>

                          {/* Code Block if any */}
                          {q.codeSnippet && (
                            <div className="ml-9 p-3 rounded-xl bg-slate-900 text-orange-300 font-mono text-xs overflow-x-auto border border-slate-800">
                              <pre>{q.codeSnippet}</pre>
                            </div>
                          )}

                          {/* Options List */}
                          {q.options && q.options.length > 0 && (
                            <div className="ml-9 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {q.options.map((opt: any, optIdx: number) => {
                                const optLetter = String.fromCharCode(65 + optIdx); // A, B, C, D
                                const isCorrect = opt.isCorrect;

                                return (
                                  <div
                                    key={opt.id || optIdx}
                                    className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition ${
                                      showAnswerKey && isCorrect
                                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold'
                                        : 'bg-slate-50 border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    <span
                                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                                        showAnswerKey && isCorrect
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-white border border-slate-300 text-slate-700'
                                      }`}
                                    >
                                      {optLetter}
                                    </span>
                                    <div className="flex-1">
                                      <span>{opt.text}</span>
                                      {showAnswerKey && isCorrect && (
                                        <span className="ml-2 inline-flex items-center text-[10px] font-mono text-emerald-700 font-bold">
                                          ✓ Correct Answer
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Numerical Answer Spec */}
                          {q.type === 'NUMERICAL' && showAnswerKey && (
                            <div className="ml-9 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-mono flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>
                                Correct Numerical Value: <strong>{q.numericalAnswer}</strong> (Tolerance: ±{q.numericalTolerance || 0})
                              </span>
                            </div>
                          )}

                          {/* Explanation if Answer Key is Enabled */}
                          {showAnswerKey && q.explanation && (
                            <div className="ml-9 p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-1">
                              <strong className="font-bold flex items-center gap-1.5 text-amber-800">
                                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                                Solution &amp; Explanation:
                              </strong>
                              <p className="text-[11px] text-amber-800/90 whitespace-pre-wrap">
                                {q.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
