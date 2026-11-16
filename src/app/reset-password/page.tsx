'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const token = new URLSearchParams(window.location.search).get('token');
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to reset your password');
        return;
      }
      router.replace('/login?passwordReset=success');
    } catch (error) {
      console.error('Password reset failed:', error);
      setError('Unable to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:p-9">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-violet-200"><CheckCircle2 className="h-6 w-6" /></div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Choose a new password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Use a password with at least 8 characters. Your reset link works once and expires after 30 minutes.</p>
        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 dark:text-slate-200">New password</label>
          <div className="relative -mt-2">
            <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
          </div>
          <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:opacity-60">
            {isSubmitting ? 'Updating password…' : 'Update password'} {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400"><Link href="/login" className="font-semibold text-indigo-700 dark:text-violet-300">Back to sign in</Link></p>
      </section>
    </main>
  );
}
