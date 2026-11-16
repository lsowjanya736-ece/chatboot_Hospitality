'use client';

import React from 'react';
import { Citation } from '@/lib/db/types';
import { X, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

interface Props {
  citation: Citation | null;
  onClose: () => void;
}

export function CitationModal({ citation, onClose }: Props) {
  if (!citation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-teal-50 border-b border-teal-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-600 text-white rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Grounded Knowledge Citation</h3>
              <p className="text-xs text-teal-700">Verified Organization Policy Document</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Document Title</span>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">{citation.documentTitle}</p>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Section / Clause</span>
            <p className="text-sm font-medium text-teal-800 bg-teal-50/80 px-3 py-1.5 rounded-md mt-1 border border-teal-200">
              {citation.sectionTitle}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Indexed Content Excerpt</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {Math.round(citation.confidenceScore * 100)}% Vector Match Confidence
              </span>
            </div>
            <div className="mt-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm leading-relaxed font-mono">
              &ldquo;{citation.excerpt}&rdquo;
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-xs text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Tenant-Isolated RAG Verification: </span>
              This excerpt was retrieved strictly from this healthcare provider&apos;s approved internal repository. Cross-tenant leakage is blocked by design.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm"
          >
            Close Citation
          </button>
        </div>
      </div>
    </div>
  );
}
