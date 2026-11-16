'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Activity, AlertCircle, ArrowLeft, Building2, CheckCircle2, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export default function CreateAdminAccountPage() {
  const { user, organizations, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeOrganizations = organizations.filter((organization) => organization.activeStatus);
  const selectedOrganizationId = activeOrganizations.some((organization) => organization.id === organizationId)
    ? organizationId
    : activeOrganizations[0]?.id || '';

  const createAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'hospital_admin', organizationId: selectedOrganizationId, department: 'Administration' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to create administrator account');
      setSuccess(`Admin account created for ${result.user.email}.`);
      setName('');
      setEmail('');
      setPassword('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create administrator account.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 dark:bg-slate-950"><p className="text-sm text-slate-500">Checking administrator access…</p></main>;

  if (user?.role !== 'super_admin') {
    return <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950"><section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800"><LockKeyhole className="h-6 w-6" /></div>
      <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Administrator accounts are managed centrally</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Only a platform administrator can create hospital administrator accounts. Contact your platform administrator to be added to your organization.</p>
      <div className="mt-6 flex flex-wrap gap-3"><Link href="/admin/login" className="rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white">Admin sign in</Link><Link href="/" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Back to home</Link></div>
    </section></main>;
  }

  return <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
    <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:p-10">
      <Link href="/super-admin" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-700 dark:hover:text-violet-300"><ArrowLeft className="h-4 w-4" /> Platform dashboard</Link>
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-800 dark:bg-indigo-400/10 dark:text-violet-300"><Activity className="h-6 w-6" /></div>
      <p className="text-sm font-semibold text-indigo-700 dark:text-violet-300">Platform administration</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">Create an admin account</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Create a hospital administrator login and assign it to one active organization. The account will only access that organization&apos;s workspace.</p>
      <form onSubmit={createAccount} className="mt-7 space-y-5">
        {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        {success && <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{success}</div>}
        <div><label htmlFor="admin-name" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Administrator name</label><div className="relative"><UserRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><input id="admin-name" required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="Full name" /></div></div>
        <div><label htmlFor="admin-account-email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Work email</label><div className="relative"><Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><input id="admin-account-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="admin@organization.com" /></div></div>
        <div><label htmlFor="admin-organization" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Organization</label><div className="relative"><Building2 className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><select id="admin-organization" required disabled={!activeOrganizations.length} value={selectedOrganizationId} onChange={(event) => setOrganizationId(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white">{activeOrganizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></div>{!activeOrganizations.length && <p className="mt-1 text-xs text-amber-700">Create and activate an organization first.</p>}</div>
        <div><label htmlFor="admin-account-password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Temporary password</label><div className="relative"><LockKeyhole className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" /><input id="admin-account-password" required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white" placeholder="At least 8 characters" /></div></div>
        <button type="submit" disabled={submitting || !selectedOrganizationId} className="w-full rounded-xl bg-indigo-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-700/20 transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Creating account…' : 'Create hospital admin account'}</button>
      </form>
      <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">Admin accounts are provisioned by platform administrators. Patients should use patient registration.</p>
    </section>
  </main>;
}
