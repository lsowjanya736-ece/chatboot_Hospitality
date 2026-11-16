'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Bot, CheckCircle2, Database, FileSearch, Info, ShieldCheck } from 'lucide-react';

interface AgentConfiguration {
  generationProvider: string;
  llmConfigured: boolean;
  retrievalMethod: string;
  storage: string;
}

export default function AiAgentSettingsPage() {
  const [configuration, setConfiguration] = useState<AgentConfiguration | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadConfiguration() {
      try {
        const response = await fetch('/api/ai-agent');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load AI configuration');
        setConfiguration(data.configuration);
      } catch (loadError) {
        console.error('AI configuration request failed:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Unable to load AI configuration');
      } finally {
        setIsLoading(false);
      }
    }
    void loadConfiguration();
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-1 bg-slate-100 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <header>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-violet-300">Workspace settings</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">AI agent configuration</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Review the active answer and retrieval configuration. Provider credentials are managed only by the deployment environment and are never shown here.</p>
        </header>

        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-violet-200"><Bot className="h-5 w-5" /></span>
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">Answer generation</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Grounded on retrieved tenant evidence</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
              <span className="text-sm text-slate-600 dark:text-slate-300">Provider</span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                {!isLoading && configuration?.llmConfigured && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                {isLoading ? 'Checking…' : configuration?.generationProvider || 'Unavailable'}
              </span>
            </div>
            {!isLoading && !configuration?.llmConfigured && (
              <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                Configure OPENAI_API_KEY or GEMINI_API_KEY on the server to enable LLM-generated summaries. Evidence-only responses remain available.
              </p>
            )}
            {!isLoading && configuration?.llmConfigured && (
              <p className="mt-4 rounded-xl bg-indigo-50 p-3 text-xs leading-5 text-indigo-800 dark:bg-indigo-400/10 dark:text-indigo-200">
                Retrieved document excerpts are sent to the configured provider to generate answers. Confirm that your provider, privacy terms, and data-processing settings meet your organization&apos;s requirements before indexing sensitive information.
              </p>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-200"><FileSearch className="h-5 w-5" /></span>
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">Knowledge retrieval</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Only this tenant&apos;s indexed chunks are searched</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
              <span className="text-sm text-slate-600 dark:text-slate-300">Method</span>
              <span className="text-right text-sm font-semibold text-slate-900 dark:text-white">
                {isLoading ? 'Checking…' : configuration?.retrievalMethod || 'Unavailable'}
              </span>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200"><Database className="h-5 w-5" /></span>
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">Data storage</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Conversation and knowledge persistence</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
              <span className="text-sm text-slate-600 dark:text-slate-300">Backend</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {isLoading ? 'Checking…' : configuration?.storage || 'Unavailable'}
              </span>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200"><ShieldCheck className="h-5 w-5" /></span>
              <div>
                <h2 className="font-semibold text-slate-950 dark:text-white">Safety boundary</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Prompt and retrieval guardrails</p>
              </div>
            </div>
            <p className="mt-5 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:text-slate-300">
              Responses are grounded in retrieved organization documents. Emergency and clinical-scope checks run before document retrieval.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}