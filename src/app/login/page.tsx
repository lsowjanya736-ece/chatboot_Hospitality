'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, AlertCircle, ArrowRight, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const authenticated = await login(email, password);
      if (!authenticated) {
        setError('The email or password you entered is incorrect.');
        return;
      }

      const requestedPath = new URLSearchParams(window.location.search).get('next');
      const sessionResponse = await fetch('/api/auth/me');
      const sessionData = sessionResponse.ok ? await sessionResponse.json() : null;
      const roleDestination: Record<string, string> = {
        super_admin: '/super-admin',
        hospital_admin: '/admin',
        support_agent: '/admin/tickets',
        patient: '/chat',
      };
      const destination =
        requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
          ? requestedPath
          : roleDestination[sessionData?.user?.role] || '/chat';
      router.replace(destination);
    } catch {
      setError('We could not sign you in right now. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-10 text-white md:flex">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <Activity className="h-6 w-6 text-violet-200" />
            </span>
            <span className="font-bold tracking-tight">MediCareRAG</span>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-violet-200">A calmer way to support every customer</p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Every answer starts with the right context.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-300">
              Bring AI conversations, trusted knowledge, and human support together in one secure workspace.
            </p>
          </div>
          <p className="text-xs text-slate-400">Tenant-aware access. Human help when it matters.</p>
        </section>

        <section className="p-7 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-8 flex items-center gap-3 md:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-700 text-white">
                <Activity className="h-5 w-5" />
              </span>
              <span className="font-bold text-slate-900">MediCareRAG</span>
            </div>
            <p className="text-sm font-semibold text-indigo-700">Welcome back</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Sign in to your account</h2>
            <p className="mt-2 text-sm text-slate-500">
              Access your organization&apos;s support workspace.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Work email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    autoComplete="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="you@organization.com"
                  />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-indigo-700 hover:text-indigo-900">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="Enter your password"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-700/20 transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
                {!isSubmitting && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">
              New to the platform?{' '}
              <Link href="/register" className="font-semibold text-indigo-700 hover:text-indigo-900">
                Create an account
              </Link>
            </p>
            <p className="mt-3 text-center text-xs text-slate-500">
              Setting up a new workspace?{' '}
              <Link href="/setup" className="font-semibold text-indigo-700 hover:text-indigo-900">
                Platform administrator setup
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
