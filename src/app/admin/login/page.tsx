'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, AlertCircle, ArrowRight, Building2, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const signedIn = await login(email, password);
      if (!signedIn) {
        setError('We could not verify those credentials. Please check them and try again.');
        return;
      }
      const response = await fetch('/api/auth/me');
      const result = response.ok ? await response.json() : null;
      const role = result?.user?.role;
      if (!['super_admin', 'hospital_admin', 'support_agent'].includes(role)) {
        await logout();
        setError('This account is for patient support. Use the patient sign-in page instead.');
        return;
      }
      router.replace(role === 'support_agent' ? '/admin/tickets' : role === 'super_admin' ? '/super-admin' : '/admin');
    } catch {
      setError('We could not sign you in right now. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-900 p-10 text-white md:flex">
          <Link href="/" className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"><Activity className="h-6 w-6 text-teal-200" /></span><span className="font-bold">MediCareRAG</span></Link>
          <div><p className="mb-3 flex items-center gap-2 text-sm font-semibold text-teal-200"><Building2 className="h-4 w-4" /> Staff workspace</p><h1 className="text-4xl font-bold leading-tight tracking-tight">Support your organization with confidence.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-slate-300">Manage trusted information, patient conversations, and human support from one secure workspace.</p></div>
          <p className="text-xs text-slate-400">Role based access · Organization specific workspaces</p>
        </section>
        <section className="p-7 sm:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-7 flex items-center gap-3 md:hidden"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-700 text-white"><Activity className="h-5 w-5" /></span><span className="font-bold text-slate-900 dark:text-white">MediCareRAG <span className="font-normal text-slate-500">Admin</span></span></div>
            <p className="text-sm font-semibold text-indigo-700 dark:text-violet-300">Administrator and staff access</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Sign in to your workspace</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Use your organization-issued staff credentials.</p>
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
              <div><label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Work email</label><div className="relative"><Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="you@organization.com" /></div></div>
              <div><label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label><div className="relative"><LockKeyhole className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="Enter your password" /></div></div>
              <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-700/20 transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Verifying access…' : 'Continue to admin workspace'} {!submitting && <ArrowRight className="h-4 w-4" />}</button>
            </form>
            <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-950"><p className="font-semibold text-slate-800 dark:text-slate-200">Need an administrator account?</p><p className="mt-1 leading-5 text-slate-500 dark:text-slate-400">Hospital admin accounts are created by the platform administrator. Ask them to add your organization account.</p><Link href="/admin/create-account" className="mt-3 inline-flex font-semibold text-indigo-700 hover:text-indigo-900 dark:text-violet-300">Platform administrator account setup <ArrowRight className="ml-1 h-4 w-4" /></Link></div>
            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">Patient or caregiver? <Link href="/login" className="font-semibold text-indigo-700 dark:text-violet-300">Patient sign in</Link> · <Link href="/register" className="font-semibold text-indigo-700 dark:text-violet-300">Create account</Link></p>
          </div>
        </section>
      </div>
    </main>
  );
}
