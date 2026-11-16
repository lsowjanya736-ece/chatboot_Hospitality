'use client';

import React from 'react';

interface CategoryData {
  name: string;
  count: number;
}

export function CategoryBarChart({ data }: { data: CategoryData[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3.5">
      {data.map((item, idx) => {
        const percent = Math.round((item.count / max) * 100);
        const colors = [
          'bg-teal-500',
          'bg-blue-500',
          'bg-indigo-500',
          'bg-cyan-500',
          'bg-emerald-500',
        ];
        const barColor = colors[idx % colors.length];

        return (
          <div key={item.name} className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>{item.name}</span>
              <span className="text-slate-500">{item.count} tickets</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor} rounded-full transition-all duration-700`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ResolutionDonutChart({
  aiRate,
  totalConversations,
}: {
  aiRate: number;
  totalConversations: number;
}) {
  const humanRate = totalConversations > 0 ? 100 - aiRate : 0;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (aiRate / 100) * circumference;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="text-amber-100 stroke-current"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Foreground circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="text-teal-600 stroke-current transition-all duration-1000 ease-out"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-extrabold text-slate-900">
            {totalConversations > 0 ? `${aiRate}%` : '—'}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">AI Resolved</span>
        </div>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-teal-600 shrink-0" />
          <span className="text-slate-600 font-medium">Automated AI Resolution:</span>
          <span className="font-bold text-slate-800">{totalConversations > 0 ? `${aiRate}%` : '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
          <span className="text-slate-600 font-medium">Escalated to Support Agent:</span>
          <span className="font-bold text-slate-800">{totalConversations > 0 ? `${humanRate}%` : '—'}</span>
        </div>
        <p className="text-[11px] text-slate-400 pt-1">
          {totalConversations > 0 ? 'Calculated from recorded conversations.' : 'Resolution data will appear as conversations are handled.'}
        </p>
      </div>
    </div>
  );
}

export function TrendAreaChart({
  data,
}: {
  data: { day: string; conversations: number }[];
}) {
  if (data.length === 0 || data.every((item) => item.conversations === 0)) {
    return <div className="flex h-44 items-center justify-center text-sm text-slate-400">No conversation activity yet.</div>;
  }
  const max = Math.max(...data.map((item) => item.conversations), 1);

  return (
    <div className="h-44 flex items-end gap-2 sm:gap-4 pt-4 px-2">
      {data.map((point) => {
        const heightPct = (point.conversations / max) * 100;
        return (
          <div key={point.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
              {point.conversations}
            </span>
            <div className="w-full bg-slate-100 rounded-t-lg h-full flex items-end overflow-hidden p-0.5">
              <div
                className="w-full bg-gradient-to-t from-indigo-700 to-violet-400 rounded-t-md transition-all duration-500 group-hover:brightness-110"
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-600">{point.day}</span>
          </div>
        );
      })}
    </div>
  );
}
