'use client';

import React from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { RoleBadge } from '@/components/RoleBadge';
import {
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  Clock,
  MapPin,
  Globe,
  Settings,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, currentOrg } = useAuth();

  return (
    <div className="flex-1 flex bg-slate-100 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4 text-teal-600" />
            <span>Account & Tenant Overview</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            User Profile & Facility Settings
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg">
                {user?.name.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{user?.name}</h3>
                <div className="mt-1">
                  <RoleBadge role={user?.role} />
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-400" /> Email:
                </span>
                <span className="font-semibold text-slate-800">{user?.email}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" /> Assigned Organization:
                </span>
                <span className="font-semibold text-teal-700">{currentOrg?.name}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-400" /> Department:
                </span>
                <span className="font-semibold text-slate-800">{user?.department || 'General Patient Services'}</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" /> Phone:
                </span>
                <span className="font-semibold text-slate-800">{user?.phone || '+1 (555) 782-9012'}</span>
              </div>
            </div>
          </div>

          {/* Current Organization Settings Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{currentOrg?.name}</h3>
                <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">
                  Type: {currentOrg?.type}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" /> Address:
                </span>
                <span className="font-semibold text-slate-800 text-right">{currentOrg?.address}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" /> Helpdesk SLA Target:
                </span>
                <span className="font-bold text-teal-700">{currentOrg?.slaHours} Hours Guaranteed</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-slate-400" /> Website:
                </span>
                <a href={currentOrg?.website} target="_blank" rel="noreferrer" className="text-teal-600 underline font-semibold">
                  {currentOrg?.website}
                </a>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" /> Emergency Hotline:
                </span>
                <span className="font-bold text-red-600">{currentOrg?.emergencyContact}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
