'use client';

import React from 'react';

export function TicketStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    open: { label: 'Open', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
    in_progress: { label: 'In Progress', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' },
    waiting_for_user: { label: 'Waiting for User', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500' },
    resolved: { label: 'Resolved', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    closed: { label: 'Closed', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-600', dot: 'bg-slate-400' },
  };

  const current = map[status] || map.open;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg} ${current.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
}

export function TicketPriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; badge: string }> = {
    urgent: { label: 'Urgent', badge: 'bg-red-100 text-red-800 border-red-200' },
    high: { label: 'High', badge: 'bg-orange-100 text-orange-800 border-orange-200' },
    medium: { label: 'Medium', badge: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    low: { label: 'Low', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  };

  const current = map[priority] || map.medium;

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${current.badge}`}>
      {current.label}
    </span>
  );
}
