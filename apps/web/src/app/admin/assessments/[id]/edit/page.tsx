'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Code2,
  Search,
  Filter,
  Pencil,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { QuestionCategory, SUPPORTED_PROGRAMMING_LANGUAGES } from '@techassess/shared';

interface SectionFormItem {
  name: string;
  category: string;
  description: string;
  timeLimitMinutes?: number;
  questionIds: string[];
  hasLanguageTracks?: boolean;
  languageOptions?: Record<string, string[]>;
}

const LANGUAGE_BADGES: Record<string, { label: string; icon: string; bg: string; text: string; border: string }> = {
  Java: { label: 'Java', icon: '☕', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  JavaScript: { label: 'JavaScript', icon: '🟨', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Python: { label: 'Python', icon: '🐍', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  C: { label: 'C', icon: '🔷', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'C++': { label: 'C++', icon: '⚡', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  'C#': { label: 'C#', icon: '🟣', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

export default function EditAssessmentPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const router = useRouter();

  // Basic Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(75);
  const [totalMarks, setTotalMarks] = useState(50);
  const [passMarks, setPassMarks] = useState(20);
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

  // Active track sub-tabs for sections: sectionIndex -> activeTrack ('common' | 'Java' | etc.)
  const [activeTrackTabsA, setActiveTrackTabsA] = useState<Record<number, string>>({});
  const [activeTrackTabsB, setActiveTrackTabsB] = useState<Record<number, string>>({});

  // Search queries per section
  const [searchQueriesA, setSearchQueriesA] = useState<Record<number, string>>({});
  const [searchQueriesB, setSearchQueriesB] = useState<Record<number, string>>({});

  // Sections
  const [sections, setSections] = useState<SectionFormItem[]>([]);
  const [setBSections, setSetBSections] = useState<SectionFormItem[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDataInitialized, setIsDataInitialized] = useState(false);

  // Fetch Assessment details to edit
  const { data: assessmentData, isLoading: isFetchingAssessment } = useQuery({
    queryKey: ['assessment-edit', assessmentId],
    queryFn: () => apiRequest(`/assessments/${assessmentId}`),
  });

  // Fetch all available questions from question bank (support up to 1000 questions)
  const { data: questionBankData } = useQuery({
    queryKey: ['questions-bank-for-wizard'],
    queryFn: () => apiRequest('/questions?limit=1000'),
  });

  const availableQuestions: any[] = questionBankData || [];

  // Helper to safely extract clean string ID from question reference or populated object
  const cleanId = (q: any): string => {
    if (!q) return '';
    if (typeof q === 'string') return q;
    return q._id?.toString() || q.id || String(q);
  };

  // Populate state when assessment data is loaded
  useEffect(() => {
    if (!assessmentData || isDataInitialized) return;

    setTitle(assessmentData.title || '');
    setDescription(assessmentData.description || '');
    setCode(assessmentData.code || '');
    setDurationMinutes(assessmentData.durationMinutes || 75);
    setTotalMarks(assessmentData.totalMarks || 50);
    setPassMarks(assessmentData.passMarks || 20);
    setNegativeMarkingRate(
      assessmentData.negativeMarkingRate !== undefined ? assessmentData.negativeMarkingRate : 0.25
    );

    setAllowQuestionReturn(assessmentData.allowQuestionReturn !== false);
    setAllowAnswerChange(assessmentData.allowAnswerChange !== false);
    setRandomizeQuestions(assessmentData.randomizeQuestions !== false);
    setRandomizeOptions(assessmentData.randomizeOptions !== false);
    setShowResultsImmediately(assessmentData.showResultsImmediately !== false);
    setAllowReviewAnswers(assessmentData.allowReviewAnswers !== false);
    setMaxFocusLossCount(assessmentData.integritySettings?.maxFocusLossCount || 3);

    const hasSets = Boolean(assessmentData.setsEnabled && assessmentData.sets?.length > 0);
    setSetsEnabled(hasSets);

    const mapSectionItem = (sec: any): SectionFormItem => {
      const qIds = (sec.questionIds || []).map(cleanId).filter(Boolean);
      const rawLangOpts = sec.languageOptions || {};
      const langOptions: Record<string, string[]> = {};

      SUPPORTED_PROGRAMMING_LANGUAGES.forEach((lang) => {
        const rawTrack = rawLangOpts[lang] || [];
        langOptions[lang] = Array.isArray(rawTrack) ? rawTrack.map(cleanId).filter(Boolean) : [];
      });

      return {
        name: sec.name || 'Section',
        category: sec.category || QuestionCategory.PROGRAMMING_DEBUGGING,
        description: sec.description || '',
        timeLimitMinutes: sec.timeLimitMinutes || undefined,
        questionIds: qIds,
        hasLanguageTracks: Boolean(sec.hasLanguageTracks),
        languageOptions: langOptions,
      };
    };

    if (hasSets) {
      const setA = assessmentData.sets.find((s: any) => s.setCode === 'A');
      const setB = assessmentData.sets.find((s: any) => s.setCode === 'B');

      const loadedA = (setA?.sections || assessmentData.sections || []).map(mapSectionItem);
      const loadedB = (setB?.sections || []).map(mapSectionItem);

      setSections(loadedA);
      setSetBSections(loadedB);
    } else {
      const loadedBase = (assessmentData.sections || []).map(mapSectionItem);
      setSections(loadedBase);
      setSetBSections([]);
    }

    setIsDataInitialized(true);
  }, [assessmentData, isDataInitialized]);

  // Question IDs already used across sets to display visual cross-set warnings
  const setAQuestionIds = new Set([
    ...sections.flatMap((s) => s.questionIds),
    ...sections.flatMap((s) => Object.values(s.languageOptions || {}).flat()),
  ]);

  const setBQuestionIds = new Set([
    ...setBSections.flatMap((s) => s.questionIds),
    ...setBSections.flatMap((s) => Object.values(s.languageOptions || {}).flat()),
  ]);

  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        name: `Section ${sections.length + 1}`,
        category: QuestionCategory.PROGRAMMING_DEBUGGING,
        description: '',
        questionIds: [],
        hasLanguageTracks: false,
        languageOptions: {
          Java: [],
          JavaScript: [],
          Python: [],
          C: [],
          'C++': [],
          'C#': [],
        },
      },
    ]);
  };

  const handleRemoveSection = (idx: number) => {
    setSections(sections.filter((_, i) => i !== idx));
  };

  const toggleQuestionInSection = (sectionIdx: number, qId: string, track: string = 'common') => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIdx) return sec;
        if (track === 'common' || !sec.hasLanguageTracks) {
          const exists = sec.questionIds.includes(qId);
          return {
            ...sec,
            questionIds: exists
              ? sec.questionIds.filter((id) => id !== qId)
              : [...sec.questionIds, qId],
          };
        } else {
          const currentTrackQs = sec.languageOptions?.[track] || [];
          const exists = currentTrackQs.includes(qId);
          const updatedTrackQs = exists
            ? currentTrackQs.filter((id) => id !== qId)
            : [...currentTrackQs, qId];
          return {
            ...sec,
            languageOptions: {
              ...(sec.languageOptions || {}),
              [track]: updatedTrackQs,
            },
          };
        }
      })
    );
  };

  const handleToggleLanguageTracks = (sectionIdx: number, enabled: boolean) => {
    setSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIdx) return sec;
        return {
          ...sec,
          hasLanguageTracks: enabled,
          languageOptions: (enabled
            ? {
                Java: sec.languageOptions?.Java || [],
                JavaScript: sec.languageOptions?.JavaScript || [],
                Python: sec.languageOptions?.Python || [],
                C: sec.languageOptions?.C || [],
                'C++': sec.languageOptions?.['C++'] || [],
                'C#': sec.languageOptions?.['C#'] || [],
              }
            : {}) as Record<string, string[]>,
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
        hasLanguageTracks: false,
        languageOptions: {
          Java: [],
          JavaScript: [],
          Python: [],
          C: [],
          'C++': [],
          'C#': [],
        },
      },
    ]);
  };

  const handleRemoveSectionB = (idx: number) => {
    setSetBSections(setBSections.filter((_, i) => i !== idx));
  };

  const toggleQuestionInSectionB = (sectionIdx: number, qId: string, track: string = 'common') => {
    setSetBSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIdx) return sec;
        if (track === 'common' || !sec.hasLanguageTracks) {
          const exists = sec.questionIds.includes(qId);
          return {
            ...sec,
            questionIds: exists
              ? sec.questionIds.filter((id) => id !== qId)
              : [...sec.questionIds, qId],
          };
        } else {
          const currentTrackQs = sec.languageOptions?.[track] || [];
          const exists = currentTrackQs.includes(qId);
          const updatedTrackQs = exists
            ? currentTrackQs.filter((id) => id !== qId)
            : [...currentTrackQs, qId];
          return {
            ...sec,
            languageOptions: {
              ...(sec.languageOptions || {}),
              [track]: updatedTrackQs,
            },
          };
        }
      })
    );
  };

  const handleToggleLanguageTracksB = (sectionIdx: number, enabled: boolean) => {
    setSetBSections((prev) =>
      prev.map((sec, i) => {
        if (i !== sectionIdx) return sec;
        return {
          ...sec,
          hasLanguageTracks: enabled,
          languageOptions: (enabled
            ? {
                Java: sec.languageOptions?.Java || [],
                JavaScript: sec.languageOptions?.JavaScript || [],
                Python: sec.languageOptions?.Python || [],
                C: sec.languageOptions?.C || [],
                'C++': sec.languageOptions?.['C++'] || [],
                'C#': sec.languageOptions?.['C#'] || [],
              }
            : {}) as Record<string, string[]>,
        };
      })
    );
  };

  const copyStructureToSetB = () => {
    setSetBSections(
      sections.map(
        (sec): SectionFormItem => ({
          name: sec.name,
          category: sec.category,
          description: sec.description,
          timeLimitMinutes: sec.timeLimitMinutes,
          hasLanguageTracks: sec.hasLanguageTracks,
          languageOptions: (sec.hasLanguageTracks
            ? {
                Java: [],
                JavaScript: [],
                Python: [],
                C: [],
                'C++': [],
                'C#': [],
              }
            : {}) as Record<string, string[]>,
          questionIds: [],
        })
      )
    );
  };

  // Calculates the candidate question count for a set of sections
  const calculateCandidateQuestionCount = (secs: SectionFormItem[]) => {
    return secs.reduce((acc, s) => {
      if (s.hasLanguageTracks) {
        const trackCounts = Object.values(s.languageOptions || {}).map((q) => q.length);
        const maxTrack = trackCounts.length > 0 ? Math.max(...trackCounts) : 0;
        return acc + s.questionIds.length + maxTrack;
      }
      return acc + s.questionIds.length;
    }, 0);
  };

  const handleSubmit = async (publishDirectly: boolean = false) => {
    setError('');
    setSuccessMessage('');

    if (!title.trim() || !code.trim()) {
      setError('Title and examination access code are required.');
      return;
    }

    if (sections.length === 0) {
      setError('You must add at least one question section for Set A.');
      return;
    }

    if (publishDirectly) {
      for (const s of sections) {
        if (!s.hasLanguageTracks && s.questionIds.length === 0) {
          setError(`Set A Section "${s.name}" has no questions selected. Assign questions before publishing.`);
          return;
        }
        if (s.hasLanguageTracks) {
          if (s.questionIds.length === 0) {
            setError(`Set A Section "${s.name}" has no common questions selected.`);
            return;
          }
          const trackCounts = Object.values(s.languageOptions || {}).map((q) => q.length);
          const hasAnyTrack = trackCounts.some((c) => c > 0);
          if (!hasAnyTrack) {
            setError(`Set A Section "${s.name}" has language tracks enabled, but no questions selected for any language track.`);
            return;
          }
        }
      }

      const finalSetB = setBSections.length > 0 ? setBSections : sections;
      if (setsEnabled && setBSections.length > 0) {
        for (const s of finalSetB) {
          if (!s.hasLanguageTracks && s.questionIds.length === 0) {
            setError(`Set B Section "${s.name}" has no questions selected. Assign questions before publishing.`);
            return;
          }
          if (s.hasLanguageTracks) {
            if (s.questionIds.length === 0) {
              setError(`Set B Section "${s.name}" has no common questions selected.`);
              return;
            }
            const trackCounts = Object.values(s.languageOptions || {}).map((q) => q.length);
            const hasAnyTrack = trackCounts.some((c) => c > 0);
            if (!hasAnyTrack) {
              setError(`Set B Section "${s.name}" has language tracks enabled, but no questions selected for any language track.`);
              return;
            }
          }
        }
      }
    }

    setIsLoading(true);

    try {
      const finalSetB = setBSections.length > 0 ? setBSections : sections;

      // Build Sets A and B payloads
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
                hasLanguageTracks: Boolean(s.hasLanguageTracks),
                languageOptions: s.hasLanguageTracks ? s.languageOptions || {} : {},
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
                hasLanguageTracks: Boolean(s.hasLanguageTracks),
                languageOptions: s.hasLanguageTracks ? s.languageOptions || {} : {},
              })),
            },
          ]
        : [];

      const updateData = {
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
          hasLanguageTracks: Boolean(s.hasLanguageTracks),
          languageOptions: s.hasLanguageTracks ? s.languageOptions || {} : {},
        })),
        integritySettings: {
          maxFocusLossCount: Number(maxFocusLossCount),
          flagOnFocusLoss: true,
          enforceFullscreen: false,
        },
      };

      await apiRequest(`/assessments/${assessmentId}`, {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      if (publishDirectly) {
        await apiRequest(`/assessments/${assessmentId}/publish`, { method: 'POST' });
        setSuccessMessage('Question paper updated and re-published successfully!');
      } else {
        setSuccessMessage('Question paper changes saved successfully!');
      }

      setTimeout(() => {
        router.push(`/admin/assessments/${assessmentId}/paper`);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update assessment');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render Section Card
  const renderSectionCard = (
    section: SectionFormItem,
    sIdx: number,
    isSetB: boolean
  ) => {
    const activeTrackTab = (isSetB ? activeTrackTabsB[sIdx] : activeTrackTabsA[sIdx]) || 'common';
    const setActiveTrackTab = (tab: string) => {
      if (isSetB) {
        setActiveTrackTabsB((prev) => ({ ...prev, [sIdx]: tab }));
      } else {
        setActiveTrackTabsA((prev) => ({ ...prev, [sIdx]: tab }));
      }
    };

    const searchQuery = (isSetB ? searchQueriesB[sIdx] : searchQueriesA[sIdx]) || '';
    const setSearchQuery = (q: string) => {
      if (isSetB) {
        setSearchQueriesB((prev) => ({ ...prev, [sIdx]: q }));
      } else {
        setSearchQueriesA((prev) => ({ ...prev, [sIdx]: q }));
      }
    };

    const handleSectionChange = (field: keyof SectionFormItem, val: any) => {
      const updater = isSetB ? setSetBSections : setSections;
      updater((prev) =>
        prev.map((s, i) => (i === sIdx ? { ...s, [field]: val } : s))
      );
    };

    const toggleQuestion = (qId: string) => {
      if (isSetB) {
        toggleQuestionInSectionB(sIdx, qId, activeTrackTab);
      } else {
        toggleQuestionInSection(sIdx, qId, activeTrackTab);
      }
    };

    const otherSetIds = isSetB ? setAQuestionIds : setBQuestionIds;

    // Filter available questions
    const filteredQuestions = availableQuestions.filter((q: any) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = q.title?.toLowerCase().includes(query);
        const matchesContent = q.content?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesContent) return false;
      }

      if (section.hasLanguageTracks) {
        if (activeTrackTab === 'common') {
          return !q.programmingLanguage || q.category === section.category;
        } else {
          return q.programmingLanguage === activeTrackTab;
        }
      }

      return true;
    });

    const activeSelectedIds = section.hasLanguageTracks
      ? activeTrackTab === 'common'
        ? section.questionIds
        : section.languageOptions?.[activeTrackTab] || []
      : section.questionIds;

    return (
      <div
        key={sIdx}
        className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm"
      >
        {/* Section Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Section Name *
              </label>
              <input
                type="text"
                value={section.name}
                onChange={(e) => handleSectionChange('name', e.target.value)}
                placeholder="Section Title"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Question Category *
              </label>
              <select
                value={section.category}
                onChange={(e) => handleSectionChange('category', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {Object.values(QuestionCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Time Limit (Mins, Optional)
              </label>
              <input
                type="number"
                value={section.timeLimitMinutes || ''}
                onChange={(e) =>
                  handleSectionChange(
                    'timeLimitMinutes',
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="Section timer (optional)"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {(isSetB ? setBSections.length > 1 : sections.length > 1) && (
            <button
              type="button"
              onClick={() => (isSetB ? handleRemoveSectionB(sIdx) : handleRemoveSection(sIdx))}
              className="p-2 text-slate-400 hover:text-rose-600 transition self-start sm:self-center"
              title="Remove Section"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Section Description */}
        <div>
          <input
            type="text"
            value={section.description || ''}
            onChange={(e) => handleSectionChange('description', e.target.value)}
            placeholder="Short section instructions or description for candidates..."
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Multi-Language Track Toggle Switch */}
        <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-purple-950 flex items-center gap-2">
                <span>Multi-Language Track Selection</span>
                {section.hasLanguageTracks && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-200 text-purple-800">
                    6 Tracks Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-purple-800 mt-0.5">
                Enable for Practical Programming: candidates choose from <strong>Java, JavaScript, Python, C, C++, C#</strong>.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={Boolean(section.hasLanguageTracks)}
              onChange={(e) =>
                isSetB
                  ? handleToggleLanguageTracksB(sIdx, e.target.checked)
                  : handleToggleLanguageTracks(sIdx, e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            <span className="ml-2 text-xs font-bold text-purple-900">
              {section.hasLanguageTracks ? 'Tracks On' : 'Single Track'}
            </span>
          </label>
        </div>

        {/* If Multi-Language Tracks Enabled: Render Track Tabs & Question Bank */}
        {section.hasLanguageTracks ? (
          <div className="space-y-3 pt-2">
            {/* Track Sub-Tabs Bar */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveTrackTab('common')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTrackTab === 'common'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>⭐ Common Questions</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    activeTrackTab === 'common'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {section.questionIds.length}
                </span>
              </button>

              {SUPPORTED_PROGRAMMING_LANGUAGES.map((lang) => {
                const count = section.languageOptions?.[lang]?.length || 0;
                const badge = LANGUAGE_BADGES[lang] || { icon: '💻' };
                const isActive = activeTrackTab === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveTrackTab(lang)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-purple-700 text-white shadow-sm ring-2 ring-purple-400'
                        : 'bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-900 border border-slate-200'
                    }`}
                  >
                    <span>{badge.icon}</span>
                    <span>{lang}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isActive
                          ? 'bg-purple-900 text-purple-100'
                          : count > 0
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Contextual Notice Banner */}
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">
                  {activeTrackTab === 'common' ? (
                    <>⭐ Assigning Common Questions ({section.questionIds.length} selected)</>
                  ) : (
                    <>
                      {LANGUAGE_BADGES[activeTrackTab]?.icon} Assigning {activeTrackTab} Track Questions (
                      {section.languageOptions?.[activeTrackTab]?.length || 0} selected)
                    </>
                  )}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {activeTrackTab === 'common'
                  ? 'Common to all candidates in this section'
                  : `Delivered when candidate selects "${activeTrackTab}" track`}
              </div>
            </div>

            {/* Search Filter Toolbar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${
                    activeTrackTab === 'common' ? 'common programming' : activeTrackTab
                  } questions by title or keyword...`}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <span className="text-[11px] text-slate-500 font-mono shrink-0">
                {filteredQuestions.length} available
              </span>
            </div>

            {/* Questions List for Active Track */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 p-2 bg-white rounded-xl border border-slate-200">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 space-y-1">
                  <div>No questions matching current filter.</div>
                </div>
              ) : (
                filteredQuestions.map((q: any) => {
                  const isSelected = activeSelectedIds.includes(q._id);
                  const isUsedInOtherSet = otherSetIds.has(q._id);

                  let usedInOtherTrack: string | null = null;
                  if (activeTrackTab !== 'common' && section.questionIds.includes(q._id)) {
                    usedInOtherTrack = 'Common';
                  } else if (section.languageOptions) {
                    for (const [otherLang, ids] of Object.entries(section.languageOptions)) {
                      if (otherLang !== activeTrackTab && ids?.includes(q._id)) {
                        usedInOtherTrack = otherLang;
                        break;
                      }
                    }
                  }

                  const langBadge = q.programmingLanguage
                    ? LANGUAGE_BADGES[q.programmingLanguage] || { label: q.programmingLanguage, icon: '💻' }
                    : null;

                  return (
                    <div
                      key={q._id}
                      onClick={() => toggleQuestion(q._id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-purple-50/80 border-purple-400 text-purple-950 font-medium shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-purple-600 text-white' : 'border border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span className="truncate">{q.title}</span>

                        {langBadge && (
                          <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200 shrink-0 font-medium flex items-center gap-1">
                            <span>{langBadge.icon}</span>
                            <span>{langBadge.label}</span>
                          </span>
                        )}

                        {usedInOtherTrack && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                            Also in {usedInOtherTrack}
                          </span>
                        )}

                        {isUsedInOtherSet && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                            In Set {isSetB ? 'A' : 'B'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {q.category}
                        </span>
                        <span className="font-mono text-purple-600 font-bold">
                          {q.marks}m
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Track Summary Stats */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>
                Total Blueprint Question Slots:{' '}
                <strong className="text-slate-800">
                  {section.questionIds.length +
                    Object.values(section.languageOptions || {}).reduce(
                      (acc, arr) => acc + (arr?.length || 0),
                      0
                    )}
                </strong>
              </span>
              <span>
                Per Candidate: <strong className="text-purple-700">{section.questionIds.length} Common</strong> +{' '}
                <strong className="text-purple-700">15 Selected Track</strong> = 20 Qs
              </span>
            </div>
          </div>
        ) : (
          /* Standard Single-Track Section Question Bank */
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-600 font-semibold">
                Assigned Questions ({section.questionIds.length})
              </span>
              <span className="text-[11px] text-orange-600 font-medium">
                Select questions for this section
              </span>
            </div>

            {/* Search Filter */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions by title or keyword..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-white rounded-xl border border-slate-200">
              {filteredQuestions.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">
                  No questions found in question bank.
                </div>
              ) : (
                filteredQuestions.map((q: any) => {
                  const isSelected = section.questionIds.includes(q._id);
                  const isUsedInOtherSet = otherSetIds.has(q._id);
                  const langBadge = q.programmingLanguage
                    ? LANGUAGE_BADGES[q.programmingLanguage]
                    : null;

                  return (
                    <div
                      key={q._id}
                      onClick={() => toggleQuestion(q._id)}
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

                        {langBadge && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 shrink-0 font-medium">
                            {langBadge.icon} {langBadge.label}
                          </span>
                        )}

                        {isUsedInOtherSet && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                            In Set {isSetB ? 'A' : 'B'}
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
        )}
      </div>
    );
  };

  if (isFetchingAssessment || !isDataInitialized) {
    return (
      <div className="py-24 text-center text-xs text-slate-500 space-y-3">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <div>Loading Examination Blueprint &amp; Questions for Editing...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back button */}
      <div>
        <Link
          href={`/admin/assessments/${assessmentId}/paper`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Question Paper</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#06111f] flex items-center gap-2">
              <Pencil className="w-6 h-6 text-[#f37021]" />
              Edit Question Paper: {title || 'Assessment'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Modify questions, sections, language tracks, sets, marks, and timing for this assessment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                assessmentData?.status === 'PUBLISHED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {assessmentData?.status}
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              v{assessmentData?.currentVersion || 0}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
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

      {/* 2. Sets A & B Dual Paper Configuration */}
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
              Deploy two distinct question papers. Alternating candidates receive Set A or Set B.
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
              Negative Marking (e.g. 0.25)
            </label>
            <input
              type="number"
              step="0.05"
              min={0}
              max={1}
              value={negativeMarkingRate}
              onChange={(e) => setNegativeMarkingRate(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
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

      {/* 4. Question Section Builder with Multi-Language Tracks & Sets A & B */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-orange-600">
              4. Examination Blueprint &amp; Distinct Sets
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Edit questions for Set A and Set B, including Multi-Language Tracks (Java, JS, Python, C, C++, C#).
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
              <span>Set A ({calculateCandidateQuestionCount(sections)} Qs)</span>
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
                <span>
                  Set B (
                  {setBSections.length > 0
                    ? calculateCandidateQuestionCount(setBSections)
                    : calculateCandidateQuestionCount(sections)}{' '}
                  Qs)
                </span>
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

            {sections.map((section, sIdx) => renderSectionCard(section, sIdx, false))}
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
              setBSections.map((section, sIdx) => renderSectionCard(section, sIdx, true))
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link
          href={`/admin/assessments/${assessmentId}/paper`}
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
          {isLoading ? 'Saving...' : 'Save Changes'}
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
              <span>Save &amp; Re-publish Paper</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
