'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, AlertCircle, ArrowRight, KeyRound, Mail } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export default function PlatformSetupPage() {
  const router = useRouter();
  const { refreshUserData } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to set up the platform');
        return;
      }
      await refreshUserData();
      router.replace('/super-admin');
    } catch (error) {
      console.error('Platform setup request failed:', error);
      setError('Unable to connect to the platform. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:p-10">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-700 text-white"><Activity className="h-6 w-6" /></div>
        <p className="text-sm font-semibold text-indigo-700 dark:text-violet-300">First-time setup</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Create the platform administrator</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Use the bootstrap email and password configured by your deployment administrator. This setup is available only until the first account is created.
        </p>
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          {error && <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
          <div>
            <label htmlFor="bootstrap-email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Bootstrap email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input id="bootstrap-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
          </div>
          <div>
            <label htmlFor="bootstrap-password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Bootstrap password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input id="bootstrap-password" type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
            </div>
          </div>
          <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:opacity-60">
            {isSubmitting ? 'Setting up…' : 'Set up administrator'} {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already set up? <Link href="/login" className="font-semibold text-indigo-700 dark:text-violet-300">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
