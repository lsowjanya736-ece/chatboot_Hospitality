'use client';

import React from 'react';
import { ShieldCheck, Building2, Headphones, UserCheck } from 'lucide-react';

interface RoleBadgeProps {
  role?: string;
  className?: string;
}

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  switch (role) {
    case 'super_admin':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 ${className}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          Super Admin
        </span>
      );
    case 'hospital_admin':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200 ${className}`}
        >
          <Building2 className="w-3.5 h-3.5 text-teal-600" />
          Hospital Admin
        </span>
      );
    case 'support_agent':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 ${className}`}
        >
          <Headphones className="w-3.5 h-3.5 text-blue-600" />
          Support Agent
        </span>
      );
    case 'patient':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 ${className}`}
        >
          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
          Patient / Caregiver
        </span>
      );
  }
}
