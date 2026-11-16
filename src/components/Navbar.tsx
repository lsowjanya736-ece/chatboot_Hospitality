'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import {
  Activity,
  Bot,
  Building2,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sun,
  Ticket,
  Users,
  X,
} from 'lucide-react';

type NavItem = { href: string; label: string; icon?: React.ReactNode };

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, currentOrg, organizations, switchOrganization, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [organizationMenuOpen, setOrganizationMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const enabled = localStorage.getItem('theme') === 'dark';
    document.documentElement.classList.toggle('dark', enabled);
    const frame = window.requestAnimationFrame(() => setDarkMode(enabled));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    const enabled = !darkMode;
    document.documentElement.classList.toggle('dark', enabled);
    localStorage.setItem('theme', enabled ? 'dark' : 'light');
    setDarkMode(enabled);
  };

  const links: NavItem[] = user
    ? user.role === 'super_admin'
      ? [
          { href: '/super-admin', label: 'Platform', icon: <LayoutDashboard className="h-4 w-4" /> },
          { href: '/admin', label: 'Workspace', icon: <Building2 className="h-4 w-4" /> },
          { href: '/chat/history', label: 'Conversations', icon: <Activity className="h-4 w-4" /> },
          { href: '/admin/ai-agent', label: 'AI agent', icon: <Bot className="h-4 w-4" /> },
        ]
      : user.role === 'hospital_admin'
        ? [
            { href: '/admin', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
            { href: '/chat/history', label: 'Conversations', icon: <Activity className="h-4 w-4" /> },
            { href: '/admin/knowledge', label: 'Knowledge', icon: <Bot className="h-4 w-4" /> },
            { href: '/admin/ai-agent', label: 'AI agent', icon: <Activity className="h-4 w-4" /> },
            { href: '/admin/tickets', label: 'Tickets', icon: <Ticket className="h-4 w-4" /> },
            { href: '/admin/users', label: 'People', icon: <Users className="h-4 w-4" /> },
          ]
        : user.role === 'support_agent'
          ? [
              { href: '/admin/tickets', label: 'Support inbox', icon: <Ticket className="h-4 w-4" /> },
            { href: '/profile', label: 'Profile', icon: <Users className="h-4 w-4" /> },
            ]
          : [
              { href: '/chat', label: 'AI support', icon: <Bot className="h-4 w-4" /> },
              { href: '/chat/history', label: 'Conversations', icon: <Activity className="h-4 w-4" /> },
              { href: '/tickets', label: 'My tickets', icon: <Ticket className="h-4 w-4" /> },
              { href: '/profile', label: 'Profile', icon: <Users className="h-4 w-4" /> },
            ]
    : [
        { href: '/#features', label: 'Features' },
        { href: '/#how-it-works', label: 'How it works' },
        { href: '/#pricing', label: 'Pricing' },
        { href: '/#contact', label: 'Contact' },
      ];

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const renderLinks = (mobile = false) => links.map((item) => {
    const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`));
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => mobile && setMobileMenuOpen(false)}
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
          active
            ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-400/10 dark:text-indigo-200'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
        }`}
      >
        {item.icon}
        {item.label}
      </Link>
    );
  });

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-700 to-violet-500 text-white shadow-lg shadow-indigo-700/20">
              <Activity className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-base font-bold tracking-tight text-slate-950 dark:text-white">
                MediCare<span className="text-indigo-700 dark:text-violet-300">RAG</span>
              </span>
              <span className="hidden text-[10px] text-slate-500 sm:block dark:text-slate-400">
                AI support workspace
              </span>
            </span>
          </Link>

          {user?.role === 'super_admin' && currentOrg && (
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setOrganizationMenuOpen((open) => !open)}
                className="flex max-w-56 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <Building2 className="h-4 w-4 shrink-0 text-indigo-600" />
                <span className="truncate">{currentOrg.name}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              </button>
              {organizationMenuOpen && (
                <div className="absolute left-0 top-full z-50 mt-2 max-h-80 w-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  {organizations.map((organization) => (
                    <button
                      type="button"
                      key={organization.id}
                      onClick={() => {
                        switchOrganization(organization.id);
                        setOrganizationMenuOpen(false);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-indigo-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {organization.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="hidden items-center gap-1 md:flex">{renderLinks()}</nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user ? (
            <div className="hidden items-center gap-3 sm:flex">
              <span className="hidden text-right lg:block">
                <span className="block max-w-36 truncate text-xs font-semibold text-slate-900 dark:text-white">{user.name}</span>
                <span className="block max-w-36 truncate text-[10px] text-slate-500 dark:text-slate-400">{user.email}</span>
              </span>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/admin/login" className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-200 dark:hover:bg-indigo-950/40">
                Admin login
              </Link>
              <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
                Log in
              </Link>
              <Link href="/register" className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-700/20 transition hover:bg-indigo-800">
                Sign up
              </Link>
            </div>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="space-y-1 border-t border-slate-200 bg-white px-4 py-3 md:hidden dark:border-slate-800 dark:bg-slate-950">
          {renderLinks(true)}
          {user ? (
            <button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 rounded-lg border border-indigo-200 px-3 py-2 text-center text-sm font-semibold text-indigo-800 dark:border-indigo-800 dark:text-indigo-200">Admin login</Link>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-semibold dark:border-slate-700">Log in</Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 rounded-lg bg-indigo-700 px-3 py-2 text-center text-sm font-semibold text-white">Sign up</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
