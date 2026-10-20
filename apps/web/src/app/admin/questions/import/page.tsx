'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Download,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Code2,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { SUPPORTED_PROGRAMMING_LANGUAGES } from '@techassess/shared';

const LANGUAGE_BADGES: Record<string, { label: string; icon: string }> = {
  Java: { label: 'Java', icon: '☕' },
  JavaScript: { label: 'JavaScript', icon: '🟨' },
  Python: { label: 'Python', icon: '🐍' },
  C: { label: 'C', icon: '🔷' },
  'C++': { label: 'C++', icon: '⚡' },
  'C#': { label: 'C#', icon: '🟣' },
};

export default function BulkImportQuestionsPage() {
  const router = useRouter();
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const sampleCsv = `title,text,category,topic,difficulty,type,programmingLanguage,options,correctOptions,marks,negativeMarks,explanation,numericalAnswer
Ratio and Proportion of Storage,If storage allocation ratio is 3:5 and total is 800GB, what is the larger share?,NUMERICAL_APTITUDE,Ratio & Proportion,EASY,SINGLE_CHOICE,,"300 GB|400 GB|500 GB|600 GB",500 GB,2,0.5,Total parts = 8. 5/8 * 800 = 500 GB.,
Hexadecimal Memory Address,Convert hex 0x1F to decimal value.,NUMERICAL_APTITUDE,Number Conversions,EASY,NUMERICAL,,,,2,0.5,1*16 + 15 = 31.,31
HTTP Secure Port,What standard port is used for encrypted HTTPS web traffic?,COMPUTER_FUNDAMENTALS,Networks,EASY,SINGLE_CHOICE,,"80|443|8080|22",443,1,0.25,HTTPS default port is 443.,
Python List Append Output,"What is output of: x = [1, 2]; x.append(3); print(len(x))",PROGRAMMING_DEBUGGING,Python Basics,EASY,SINGLE_CHOICE,Python,"2|3|4|Error",3,2,0.5,Appending 3 makes length 3.,
Java String Length,"What does s.length() return for String s = \"Hello\"?",PROGRAMMING_DEBUGGING,Java Basics,EASY,SINGLE_CHOICE,Java,"4|5|6|Error",5,2,0.5,String length is 5.,`;

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'techassess_question_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      validateContent(content, selectedLanguage);
    };
    reader.readAsText(file);
  };

  const validateContent = async (content: string, langOverride?: string) => {
    const langToUse = langOverride !== undefined ? langOverride : selectedLanguage;
    setIsValidating(true);
    setError('');
    setValidationResult(null);

    try {
      const res = await apiRequest('/questions/import/validate', {
        method: 'POST',
        body: JSON.stringify({
          csvContent: content,
          defaultLanguage: langToUse || undefined,
        }),
      });
      setValidationResult(res);
    } catch (err: any) {
      setError(err.message || 'CSV validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    if (csvContent.trim()) {
      validateContent(csvContent, lang);
    }
  };

  const handleCommitImport = async (skipErrors: boolean = false) => {
    setIsImporting(true);
    setError('');

    try {
      const res = await apiRequest('/questions/import/commit', {
        method: 'POST',
        body: JSON.stringify({
          csvContent,
          skipErrors,
          defaultLanguage: selectedLanguage || undefined,
        }),
      });

      setSuccessMessage(`Successfully imported ${res.importedCount} questions into the bank!`);
      setTimeout(() => {
        router.push('/admin/questions');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Import commit failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/questions"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Question Bank</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#06111f] flex items-center gap-2">
              <Upload className="w-6 h-6 text-[#f37021]" />
              Bulk Import Questions
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Upload a CSV file containing questions with row-level validation before committing to the database.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 transition self-start sm:self-auto shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-orange-600" />
            <span>Download CSV Template</span>
          </button>
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

      {/* Target Programming Language Selector Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900">
              Programming Language Track Tagging (Optional)
            </h2>
            <p className="text-[11px] text-slate-500">
              Select a programming language to apply to all questions in this upload (or leave on Auto to detect from the CSV).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleLanguageChange('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center gap-1.5 ${
              selectedLanguage === ''
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>🌐 Auto / From CSV (or Common)</span>
          </button>

          {SUPPORTED_PROGRAMMING_LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang;
            const badge = LANGUAGE_BADGES[lang] || { icon: '💻' };
            return (
              <button
                key={lang}
                type="button"
                onClick={() => handleLanguageChange(lang)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-700 text-white border-purple-700 shadow-sm ring-2 ring-purple-300'
                    : 'bg-purple-50/60 text-purple-900 border-purple-200 hover:bg-purple-100'
                }`}
              >
                <span>{badge.icon}</span>
                <span>{lang}</span>
              </button>
            );
          })}
        </div>

        {selectedLanguage && (
          <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-950 text-xs flex items-center gap-2">
            <span className="font-bold">Active Track:</span>
            <span>
              All imported questions in this batch will be tagged as <strong>{selectedLanguage}</strong> track unless a specific language is defined in a CSV row.
            </span>
          </div>
        )}
      </div>

      {/* File Upload Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-4 shadow-sm">
        <div className="max-w-md mx-auto border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-xl p-8 transition cursor-pointer relative bg-slate-50">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                {fileName ? fileName : 'Click or drag a CSV file here'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Columns: title, text, category, topic, difficulty, type, programmingLanguage, options, correctOptions, marks...
              </p>
            </div>
          </div>
        </div>

        {/* Or Paste CSV raw text */}
        <div className="pt-2 border-t border-slate-100 text-left space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              Or paste CSV content directly:
            </label>
            <button
              type="button"
              onClick={() => validateContent(csvContent)}
              disabled={!csvContent.trim() || isValidating}
              className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-semibold transition shadow-sm"
            >
              {isValidating ? 'Validating...' : 'Validate CSV Content'}
            </button>
          </div>
          <textarea
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            rows={5}
            placeholder="title,text,category,topic,difficulty,type,programmingLanguage,options,correctOptions,marks,negativeMarks,explanation,numericalAnswer"
            className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white"
          />
        </div>
      </div>

      {/* Validation Results Card */}
      {validationResult && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-orange-600">
              Validation Diagnostics
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                ✓ {validationResult.validCount} Valid
              </span>
              {validationResult.errorCount > 0 && (
                <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-bold">
                  ⚠ {validationResult.errorCount} Errors
                </span>
              )}
            </div>
          </div>

          {/* Row-Level Errors Table */}
          {validationResult.errors && validationResult.errors.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-rose-600">
                Row-Level Issues Detected:
              </h3>
              <div className="max-h-48 overflow-y-auto border border-rose-200 rounded-xl bg-rose-50/50 divide-y divide-rose-100 text-xs">
                {validationResult.errors.map((err: any, i: number) => (
                  <div key={i} className="p-2.5 flex items-start gap-3">
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-mono text-[10px] font-bold">
                      Row {err.row}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-800">{err.field}:</span>{' '}
                      <span className="text-rose-700">{err.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview of Valid Questions */}
          {validationResult.preview && validationResult.preview.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-700">
                Valid Questions Preview:
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50 text-xs">
                {validationResult.preview.map((q: any, i: number) => (
                  <div key={i} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <span>{q.title}</span>
                        {q.programmingLanguage && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 font-bold">
                            {LANGUAGE_BADGES[q.programmingLanguage]?.icon || '💻'} {q.programmingLanguage} Track
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {q.category} • {q.topic}
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-orange-600 font-bold shrink-0">
                      {q.marks} Marks
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            {validationResult.errorCount > 0 && validationResult.validCount > 0 && (
              <button
                type="button"
                onClick={() => handleCommitImport(true)}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 shadow-sm"
              >
                Import {validationResult.validCount} Valid Rows Only
              </button>
            )}

            <button
              type="button"
              onClick={() => handleCommitImport(false)}
              disabled={isImporting || validationResult.validCount === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : `Import All ${validationResult.validCount} Questions`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
