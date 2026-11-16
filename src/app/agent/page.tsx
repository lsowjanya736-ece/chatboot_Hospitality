'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

export default function AgentDashboardRedirect() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user?.role === 'support_agent' ? '/admin/tickets' : user ? '/unauthorized' : '/login');
  }, [isLoading, router, user]);

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 p-8 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
      Opening your support workspace…
    </main>
  );
}