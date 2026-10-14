'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Download,
  ArrowLeft,
  FileText,
  AlertCircle,
  CheckCircle2,
  Table,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function BulkImportQuestionsPage() {
  const router = useRouter();
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError('');
    setSuccessMessage('');
    setValidationResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      validateContent(content);
    };
    reader.readAsText(file);
  };

  const validateContent = async (content: string) => {
    setIsValidating(true);
    setError('');
    try {
      const result = await apiRequest('/questions/validate-import', {
        method: 'POST',
        body: JSON.stringify({ csvContent: content }),
      });
      setValidationResult(result);
    } catch (err: any) {
      setError(err.message || 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/api/v1/questions/template', '_blank');
  };

  const handleCommitImport = async (ignoreErrors = false) => {
    if (!csvContent) {
      setError('No CSV content to import');
      return;
    }

    setIsImporting(true);
    setError('');
    try {
      const result = await apiRequest('/questions/import', {
        method: 'POST',
        body: JSON.stringify({ csvContent, ignoreErrors }),
      });
      setSuccessMessage(`Successfully imported ${result.insertedCount} questions!`);
      setTimeout(() => {
        router.push('/admin/questions');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Import failed');
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
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Question Bank</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Upload className="w-6 h-6 text-indigo-400" />
              Bulk Import Questions
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Upload a CSV file containing questions with row-level validation before committing to the database.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition self-start sm:self-auto"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* File Upload Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
        <div className="max-w-md mx-auto border-2 border-dashed border-slate-700/80 hover:border-indigo-500/60 rounded-xl p-8 transition cursor-pointer relative bg-slate-950/60">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                {fileName ? fileName : 'Click or drag a CSV file here'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Formatted with columns: title, text, category, topic, difficulty, type, options, correctOptions, marks...
              </p>
            </div>
          </div>
        </div>

        {/* Or Paste CSV raw text */}
        <div>
          <button
            type="button"
            onClick={() => validateContent(csvContent)}
            disabled={!csvContent || isValidating}
            className="text-xs text-indigo-400 hover:underline"
          >
            {isValidating ? 'Validating...' : 'Validate CSV Content'}
          </button>
        </div>
      </div>

      {/* Validation Results Card */}
      {validationResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider text-indigo-400">
              Validation Diagnostics
            </h2>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-emerald-400 font-medium">
                ✓ {validationResult.validCount} Valid
              </span>
              <span className="text-rose-400 font-medium">
                ⚠ {validationResult.errorCount} Errors
              </span>
            </div>
          </div>

          {/* Row-Level Errors Table */}
          {validationResult.errors && validationResult.errors.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-rose-400">
                Row-Level Issues Detected:
              </h3>
              <div className="max-h-48 overflow-y-auto border border-rose-950/60 rounded-xl bg-rose-950/20 divide-y divide-rose-950/40 text-xs">
                {validationResult.errors.map((err: any, i: number) => (
                  <div key={i} className="p-2.5 flex items-start gap-3">
                    <span className="px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-300 font-mono text-[10px]">
                      Row {err.row}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-200">{err.field}:</span>{' '}
                      <span className="text-rose-300">{err.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview of Valid Questions */}
          {validationResult.preview && validationResult.preview.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-300">
                Valid Questions Preview:
              </h3>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950/60 text-xs">
                {validationResult.preview.map((q: any, i: number) => (
                  <div key={i} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-200">{q.title}</div>
                      <div className="text-[11px] text-slate-400">{q.category} • {q.topic}</div>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {q.marks} Marks
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            {validationResult.errorCount > 0 && validationResult.validCount > 0 && (
              <button
                type="button"
                onClick={() => handleCommitImport(true)}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
              >
                Import {validationResult.validCount} Valid Rows Only
              </button>
            )}

            <button
              type="button"
              onClick={() => handleCommitImport(false)}
              disabled={isImporting || validationResult.validCount === 0}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : `Import All ${validationResult.validCount} Questions`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
