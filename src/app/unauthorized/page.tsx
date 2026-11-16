'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Home, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  const homeHref = user?.role === 'super_admin'
    ? '/super-admin'
    : user?.role === 'hospital_admin'
      ? '/admin'
      : user?.role === 'support_agent'
        ? '/admin/tickets'
        : '/chat';
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
        Access Denied / Role Protected
      </h1>

      <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-2 leading-relaxed">
        You do not possess the required permissions or role to view this section of the hospital platform.
      </p>

      <div className="flex items-center gap-3 mt-6">
        <Link
          href="/"
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
        <Link
          href="/login"
          className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          Sign in
        </Link>
        <Link
          href={homeHref}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2"
        >
          Return to your workspace
        </Link>
      </div>
    </div>
  );
}
