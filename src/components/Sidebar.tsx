'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  LifeBuoy,
  Users,
  Settings,
  ShieldCheck,
  Bot,
  Building2,
  Clock,
  ExternalLink,
  MessageSquare,
  UserPlus,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { currentOrg, user } = useAuth();

  const links = [
    {
      name: 'Overview Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
      roles: ['hospital_admin', 'super_admin'],
    },
    {
      name: 'Knowledge Base & RAG',
      href: '/admin/knowledge',
      icon: FileText,
      roles: ['hospital_admin', 'super_admin'],
    },
    {
      name: 'AI Agent Settings',
      href: '/admin/ai-agent',
      icon: Bot,
      roles: ['hospital_admin', 'super_admin'],
    },
    {
      name: 'Conversations',
      href: '/chat/history',
      icon: MessageSquare,
      roles: ['hospital_admin', 'super_admin'],
    },
    {
      name: 'Support Ticket Desk',
      href: '/admin/tickets',
      icon: LifeBuoy,
      roles: ['hospital_admin', 'support_agent', 'super_admin'],
    },
    {
      name: 'Staff & Patients',
      href: '/admin/users',
      icon: Users,
      roles: ['hospital_admin', 'super_admin'],
    },
    {
      name: 'Super Admin Multi-Tenant',
      href: '/super-admin',
      icon: ShieldCheck,
      roles: ['super_admin'],
      highlight: true,
    },
    {
      name: 'Create Hospital Admin',
      href: '/admin/create-account',
      icon: UserPlus,
      roles: ['super_admin'],
      highlight: true,
    },
    {
      name: 'Settings & Profile',
      href: '/profile',
      icon: Settings,
      roles: ['hospital_admin', 'support_agent', 'super_admin', 'patient'],
    },
  ];

  const allowedLinks = links.filter(
    (l) => !user || l.roles.includes(user.role)
  );

  return (
    <aside className="hidden w-64 bg-white border-r border-slate-200 md:flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Organization Card Banner */}
      <div className="p-4 border-b border-slate-100">
        <div className="p-3 bg-gradient-to-br from-teal-50 to-cyan-50/50 rounded-xl border border-teal-100">
          <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span>Active Tenant</span>
          </div>
          <div className="font-bold text-slate-900 text-sm mt-1 leading-snug truncate">
            {currentOrg?.name || 'Healthcare Facility'}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>SLA Response: </span>
            <span className="font-semibold text-teal-700">{currentOrg ? `${currentOrg.slaHours} Hours` : 'Not selected'}</span>
          </div>
        </div>
      </div>

      {/* Nav list */}
      <nav className="flex-1 p-3 space-y-1">
        {allowedLinks.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? item.highlight
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                  : item.highlight
                  ? 'text-purple-700 hover:bg-purple-50 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-purple-600' : 'text-slate-500'}`} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick link for the current role */}
      <div className="p-4 border-t border-slate-100">
        <Link
          href="/admin/tickets"
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 text-xs text-slate-700 hover:text-teal-900 transition-colors font-medium group"
        >
          <span>{user?.role === 'support_agent' ? 'Open assigned ticket queue' : 'Open support ticket desk'}</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600" />
        </Link>
      </div>
    </aside>
  );
}
