'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { CategoryBarChart, ResolutionDonutChart, TrendAreaChart } from '@/components/Charts';
import { AuditLog } from '@/lib/db/types';
import {
  MessageSquare,
  Ticket,
  CheckCircle2,
  Clock,
  FileText,
  Building2,
  ShieldCheck,
  Plus,
  Users,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { currentOrg } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConversations: 0,
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    avgResponseTimeMinutes: 0,
    aiResolutionRate: 0,
    totalKnowledgeDocuments: 0,
    categoryDistribution: [
      { name: 'Billing & Insurance', count: 0 },
      { name: 'Appointments', count: 0 },
      { name: 'Admissions', count: 0 },
      { name: 'Diagnostics', count: 0 },
      { name: 'General Inquiries', count: 0 },
    ],
    conversationTrend: [] as { date: string; day: string; conversations: number }[],
    frequentQueries: [] as { query: string; count: number; category: string }[],
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [analyticsError, setAnalyticsError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!currentOrg) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setAnalyticsError('');
      try {
        const res = await fetch(`/api/analytics?organizationId=${currentOrg.id}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Unable to load analytics');
        }
        if (data.analytics) setStats(data.analytics);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
      } catch (error) {
        console.error('Unable to load analytics:', error);
        setAnalyticsError(error instanceof Error ? error.message : 'Unable to load analytics');
      } finally {
        setIsLoading(false);
      }
    }

    void fetchAnalytics();
  }, [currentOrg]);

  return (
    <div className="flex-1 flex bg-slate-100 min-h-[calc(100vh-4rem)]">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Dashboard Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>{currentOrg?.name} • Clinical Administration</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Hospital Operations & AI Support Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time analytics for RAG queries, support ticket SLA resolution, and knowledge indexing
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/admin/knowledge"
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              Upload Knowledge Doc
            </Link>

            <Link
              href="/admin/tickets"
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs shadow-2xs flex items-center gap-2 transition-all"
            >
              <Ticket className="w-4 h-4 text-teal-600" />
              Open Tickets ({stats.openTickets})
            </Link>
          </div>
        </div>

        {/* Organization usage and support outcome metrics */}
        {analyticsError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{analyticsError}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-black text-slate-900">{isLoading ? '…' : stats.totalUsers}</div>
            <div className="text-[11px] text-slate-500 font-medium">Staff and patient accounts</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Inquiries</span>
              <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{isLoading ? '…' : stats.totalConversations}</div>
            <div className="text-[11px] text-slate-500 font-medium">
              Recorded conversations
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Resolved Tickets</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="w-4 h-4" /></div>
            </div>
            <div className="text-2xl font-black text-slate-900">{isLoading ? '…' : stats.resolvedTickets}</div>
            <div className="text-[11px] text-slate-500 font-medium">Resolved or closed</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Resolution Rate</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{isLoading ? '…' : `${stats.aiResolutionRate}%`}</div>
            <div className="text-[11px] text-slate-500 font-medium">
              Grounded in approved docs
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Escalations</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{isLoading ? '…' : stats.openTickets}</div>
            <div className="text-[11px] text-amber-700 font-semibold">
              Assigned to support agents
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Resolution Time</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.avgResponseTimeMinutes} min</div>
            <div className="text-[11px] text-emerald-700 font-semibold">
              Organization SLA: {currentOrg?.slaHours ?? '—'} hours
            </div>
          </div>
        </div>

        {/* Charts Grid: 3 Interactive Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Resolution Donut (Col 4) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">AI vs Human Resolution</h3>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Recorded data
              </span>
            </div>
            <ResolutionDonutChart aiRate={stats.aiResolutionRate} totalConversations={stats.totalConversations} />
          </div>

          {/* Ticket Category Distribution Bar Chart (Col 4) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Escalations by Category</h3>
              <span className="text-xs text-slate-400">Volume</span>
            </div>
            <CategoryBarChart data={stats.categoryDistribution} />
          </div>

          {/* Inquiry Volume Curve (Col 4) */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Weekly Inquiry Volume</h3>
              <span className="text-xs text-slate-400">7-Day Trend</span>
            </div>
            <TrendAreaChart data={stats.conversationTrend} />
          </div>
        </div>

        {/* Bottom Section: Frequent Inquiries & System Audit Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Frequent Inquiries */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-sm">Top Administrative Questions Asked</h3>
              </div>
              <span className="text-xs text-slate-400">Last 30 Days</span>
            </div>

            <div className="divide-y divide-slate-100">
              {stats.frequentQueries.length === 0 && (
                <p className="py-5 text-center text-xs text-slate-400">No unresolved questions have been recorded yet.</p>
              )}
              {stats.frequentQueries.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="pr-4">
                    <p className="font-semibold text-slate-800">{item.query}</p>
                    <span className="text-[10px] text-slate-400">{item.category}</span>
                  </div>
                  <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 shrink-0">
                    {item.count} queries
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live System Audit Logs */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">Recent Audit & Security Trail</h3>
              </div>
              <span className="text-xs text-slate-400">Compliance Log</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-[260px] overflow-y-auto">
              {auditLogs.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No recent audit logs available.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="py-2.5 space-y-0.5 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900">{log.userName}</span>
                      <span className="text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
