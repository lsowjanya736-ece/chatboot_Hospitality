'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Unable to request a password reset');
        return;
      }
      setSent(true);
    } catch (error) {
      console.error('Password reset request failed:', error);
      setError('Unable to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:p-9">
        <Link href="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-700 dark:text-slate-400 dark:hover:text-violet-300">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
        <div className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-violet-200">
          {sent ? <CheckCircle2 className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
        </div>
        {sent ? (
          <>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Check your inbox</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              If an account exists for <strong>{email}</strong>, password reset instructions have been sent. The link expires in 30 minutes.
            </p>
            <button type="button" onClick={() => setSent(false)} className="mt-6 text-sm font-semibold text-indigo-700 hover:text-indigo-900 dark:text-violet-300">
              Try another email
            </button>
          </>
        ) : (
          <>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Reset your password</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Enter the email address associated with your account. We&apos;ll email you a secure, one-time reset link.
            </p>
            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <label htmlFor="reset-email" className="block text-sm font-medium text-slate-700 dark:text-slate-200">Email address</label>
              <div className="relative -mt-2">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input id="reset-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@organization.com" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
              </div>
              <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-800 disabled:opacity-60">
                {isSubmitting ? 'Sending link…' : 'Send reset link'} {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
