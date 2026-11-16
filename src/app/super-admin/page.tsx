'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Organization } from '@/lib/db/types';
import { Sidebar } from '@/components/Sidebar';
import {
  ShieldCheck,
  Building2,
  Plus,
  CheckCircle2,
  Lock,
  X,
} from 'lucide-react';

interface PlatformMetrics {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalTickets: number;
  totalConversations: number;
  totalKnowledgeChunks: number;
  averageSlaHours: number;
}

async function fetchPlatformMetrics(): Promise<PlatformMetrics> {
  const response = await fetch('/api/analytics?organizationId=all');
  const data: { error?: string; platformMetrics?: PlatformMetrics } = await response.json();
  if (!response.ok || !data.platformMetrics) {
    throw new Error(data.error || 'Unable to load platform analytics');
  }
  return data.platformMetrics;
}

export default function SuperAdminPage() {
  const { organizations, switchOrganization, refreshOrganizations } = useAuth();
  const [createdOrganizations, setCreatedOrganizations] = useState<Organization[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tenantIsolationTestOrgA, setTenantIsolationTestOrgA] = useState('');
  const [tenantIsolationTestOrgB, setTenantIsolationTestOrgB] = useState('');
  const [isolationQuery, setIsolationQuery] = useState('visiting hours');
  const [isolationTestResult, setIsolationTestResult] = useState<{
    orgA: { id: string; citations: { documentId: string }[]; confidence: number };
    orgB: { id: string; citations: { documentId: string }[]; confidence: number };
    passed: boolean;
    auditedAt: string;
  } | null>(null);
  const [isTestingIsolation, setIsTestingIsolation] = useState(false);
  const [isolationTestError, setIsolationTestError] = useState('');
  const [formError, setFormError] = useState('');
  const [organizationError, setOrganizationError] = useState('');
  const [updatingOrganizationId, setUpdatingOrganizationId] = useState('');
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    totalTickets: 0,
    totalConversations: 0,
    totalKnowledgeChunks: 0,
    averageSlaHours: 0,
  });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [metricsError, setMetricsError] = useState('');
  const orgList = [
    ...organizations,
    ...createdOrganizations.filter((created) => !organizations.some((organization) => organization.id === created.id)),
  ];
  const selectedOrgA = orgList.some((organization) => organization.id === tenantIsolationTestOrgA)
    ? tenantIsolationTestOrgA
    : orgList[0]?.id || '';
  const selectedOrgB = orgList.some((organization) => organization.id === tenantIsolationTestOrgB && tenantIsolationTestOrgB !== selectedOrgA)
    ? tenantIsolationTestOrgB
    : orgList.find((organization) => organization.id !== selectedOrgA)?.id || '';

  // New Organization Form
  const [newOrg, setNewOrg] = useState({
    name: '',
    type: 'hospital',
    contactEmail: '',
    phone: '',
    address: '',
    website: '',
    slaHours: 4,
  });

  useEffect(() => {
    async function loadMetrics() {
      try {
        setMetrics(await fetchPlatformMetrics());
        setMetricsError('');
      } catch (error) {
        console.error('Platform analytics request failed:', error);
        setMetricsError(error instanceof Error ? error.message : 'Unable to load platform analytics');
      } finally {
        setIsLoadingMetrics(false);
      }
    }
    void loadMetrics();
  }, []);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrg),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to create organization');
      }
      setCreatedOrganizations((previous) =>
        previous.some((organization) => organization.id === data.organization.id)
          ? previous
          : [...previous, data.organization]
      );
      setShowAddModal(false);
      setNewOrg({
        name: '',
        type: 'hospital',
        contactEmail: '',
        phone: '',
        address: '',
        website: '',
        slaHours: 4,
      });
      setOrganizationError('');
      try {
        await refreshOrganizations();
        setIsLoadingMetrics(true);
        setMetrics(await fetchPlatformMetrics());
        setMetricsError('');
      } catch (refreshError) {
        console.error('Organization refresh failed after creation:', refreshError);
        setOrganizationError('Organization was created, but organization data could not be fully refreshed.');
      } finally {
        setIsLoadingMetrics(false);
      }
    } catch (error) {
      console.error('Organization creation failed:', error);
      setFormError(error instanceof Error ? error.message : 'Unable to create organization');
    }
  };

  const runTenantIsolationTest = async () => {
    setIsTestingIsolation(true);
    setIsolationTestResult(null);
    setIsolationTestError('');

    try {
      const response = await fetch('/api/organizations/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationA: selectedOrgA,
          organizationB: selectedOrgB,
          query: isolationQuery,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Tenant audit failed');
      setIsolationTestResult(data);
    } catch (error) {
      console.error('Tenant isolation audit failed:', error);
      setIsolationTestError(error instanceof Error ? error.message : 'Tenant audit failed');
    } finally {
      setIsTestingIsolation(false);
    }
  };

  const updateOrganizationSettings = async (organization: Organization, updates: { activeStatus?: boolean; slaHours?: number }) => {
    setOrganizationError('');
    setUpdatingOrganizationId(organization.id);
    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update organization settings');
      await refreshOrganizations();
    } catch (error) {
      setOrganizationError(error instanceof Error ? error.message : 'Unable to update organization settings');
    } finally {
      setUpdatingOrganizationId('');
    }
  };

  return (
    <div className="flex-1 flex bg-slate-100 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-800 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Global Super Administrator Console</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Multi-Tenant Healthcare Platform Overseer
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Provision hospitals, monitor tenant isolation, enforce SLAs, and inspect global health service data
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Provision New Organization
          </button>
        </div>

        {/* Global Statistics */}
        {organizationError && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{organizationError}</p>}
        {metricsError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{metricsError}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-400">Active Tenants</span>
            <div className="text-2xl font-black text-slate-900">{isLoadingMetrics ? '…' : `${metrics.activeTenants} / ${metrics.totalTenants}`}</div>
            <span className="text-[11px] text-slate-500">Active / total organizations</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-400">Registered Users</span>
            <div className="text-2xl font-black text-slate-900">{isLoadingMetrics ? '…' : metrics.totalUsers}</div>
            <span className="text-[11px] text-slate-500">Across all organizations</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-400">Support Tickets</span>
            <div className="text-2xl font-black text-slate-900">{isLoadingMetrics ? '…' : metrics.totalTickets}</div>
            <span className="text-[11px] text-slate-500">Recorded across tenants</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-400">AI Conversations</span>
            <div className="text-2xl font-black text-slate-900">{isLoadingMetrics ? '…' : metrics.totalConversations}</div>
            <span className="text-[11px] text-slate-500">Recorded AI usage</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-400">Knowledge Chunks</span>
            <div className="text-2xl font-black text-slate-900">{isLoadingMetrics ? '…' : metrics.totalKnowledgeChunks}</div>
            <span className="text-[11px] text-slate-500">Indexed from tenant documents</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-400">Average Tenant SLA</span>
            <div className="text-2xl font-black text-slate-900">{isLoadingMetrics ? '…' : `${metrics.averageSlaHours} hours`}</div>
            <span className="text-[11px] text-slate-500">Configured first response target</span>
          </div>
        </div>

        {/* Live Tenant Isolation Verification Sandbox */}
        <div className="bg-white p-6 rounded-2xl border border-purple-200 shadow-sm space-y-4 bg-gradient-to-br from-white to-purple-50/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Tenant Boundary & Data Isolation Auditor
                </h3>
                <p className="text-xs text-slate-500">
                  Execute identical RAG queries across two separate healthcare tenants to verify isolation
                </p>
              </div>
            </div>

            <button
              onClick={runTenantIsolationTest}
              disabled={isTestingIsolation || orgList.length < 2 || !selectedOrgA || !selectedOrgB || selectedOrgA === selectedOrgB || !isolationQuery.trim()}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {isTestingIsolation ? 'Auditing Boundary...' : 'Run Boundary Audit'}
            </button>
          </div>

          {isolationTestError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{isolationTestError}</p>}
          {orgList.length < 2 && <p className="text-xs text-slate-500">Create at least two organizations to run a boundary audit.</p>}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Tenant 1 (Org A)
              </label>
              <select
                value={selectedOrgA}
                onChange={(e) => setTenantIsolationTestOrgA(e.target.value)}
                disabled={orgList.length < 2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                {orgList.length === 0 && <option value="">No organizations available</option>}
                {orgList.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Tenant 2 (Org B)
              </label>
              <select
                value={selectedOrgB}
                onChange={(e) => setTenantIsolationTestOrgB(e.target.value)}
                disabled={orgList.length < 2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                {orgList.length === 0 && <option value="">No organizations available</option>}
                {orgList.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Test Audit Query
              </label>
              <input
                type="text"
                value={isolationQuery}
                onChange={(e) => setIsolationQuery(e.target.value)}
                placeholder="e.g. visiting hours or appointment policy"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          {isolationTestResult && (
            <div className="mt-4 p-4 bg-white border border-purple-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-purple-900 border-b border-purple-100 pb-2">
                <span className={`flex items-center gap-1.5 ${isolationTestResult.passed ? 'text-emerald-800' : 'text-red-700'}`}>
                  <CheckCircle2 className={`w-4 h-4 ${isolationTestResult.passed ? 'text-emerald-600' : 'text-red-600'}`} />
                  {isolationTestResult.passed ? 'Tenant boundary audit passed' : 'Tenant boundary audit failed'}
                </span>
                <span className="text-slate-500 font-mono">{new Date(isolationTestResult.auditedAt).toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-teal-50/60 rounded-lg border border-teal-200">
                  <span className="font-bold text-teal-900 block mb-1">
                    {orgList.find((o) => o.id === isolationTestResult.orgA.id)?.name}:
                  </span>
                  <p className="text-[11px] text-slate-600">
                    Checked {isolationTestResult.orgA.citations.length} document references within tenant {isolationTestResult.orgA.id}.
                  </p>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
                  <span className="font-bold text-blue-900 block mb-1">
                    {orgList.find((o) => o.id === isolationTestResult.orgB.id)?.name}:
                  </span>
                  <p className="text-[11px] text-slate-600">
                    Checked {isolationTestResult.orgB.citations.length} document references within tenant {isolationTestResult.orgB.id}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Organizations Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Provisioned Healthcare Organizations</h3>
            <span className="text-xs text-slate-500 font-semibold">{orgList.length} Tenants</span>
          </div>

          {organizationError && <p role="alert" className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{organizationError}</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Facility Name</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">SLA Target</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orgList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                      No organizations have been provisioned yet. Create one to get started.
                    </td>
                  </tr>
                ) : orgList.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900">{org.name}</div>
                          <span className="text-[10px] text-slate-400 font-normal">{org.address}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 uppercase tracking-wider">
                        {org.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div>{org.contactEmail}</div>
                      <span className="text-[10px] text-slate-400">{org.phone}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-teal-700">
                      <label className="sr-only" htmlFor={`sla-${org.id}`}>SLA response target for {org.name}</label>
                      <select
                        id={`sla-${org.id}`}
                        value={org.slaHours}
                        disabled={updatingOrganizationId === org.id}
                        onChange={(event) => updateOrganizationSettings(org, { slaHours: Number(event.target.value) })}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-teal-800 disabled:opacity-60"
                      >
                        {![1, 2, 4, 8, 12, 24, 48, 72, 168].includes(org.slaHours) && <option value={org.slaHours}>Current · {org.slaHours} hours</option>}
                        {[1, 2, 4, 8, 12, 24, 48, 72, 168].map((hours) => <option key={hours} value={hours}>{hours} hours</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${org.activeStatus ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-600 bg-slate-100 border-slate-200'}`}>
                        {org.activeStatus && <CheckCircle2 className="w-3 h-3" />}
                        {org.activeStatus ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => updateOrganizationSettings(org, { activeStatus: !org.activeStatus })}
                          disabled={updatingOrganizationId === org.id}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 ${org.activeStatus ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`}
                        >
                          {updatingOrganizationId === org.id ? 'Saving…' : org.activeStatus ? 'Suspend' : 'Reactivate'}
                        </button>
                        <button
                          onClick={() => switchOrganization(org.id)}
                          className="px-3 py-1 bg-slate-100 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Inspect
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Provision New Organization Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Provision New Healthcare Tenant</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-3">
              {formError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</p>}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Healthcare Facility Name
                </label>
                <input
                  type="text"
                  required
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  placeholder="e.g. Hope Children's Specialized Hospital"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Facility Type
                  </label>
                  <select
                    value={newOrg.type}
                    onChange={(e) => setNewOrg({ ...newOrg, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="hospital">Hospital</option>
                    <option value="clinic">Specialist Clinic</option>
                    <option value="diagnostic">Diagnostic & Imaging</option>
                    <option value="telehealth">Telehealth Network</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    SLA Hours
                  </label>
                  <input
                    type="number"
                    value={newOrg.slaHours}
                    onChange={(e) => setNewOrg({ ...newOrg, slaHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  required
                  value={newOrg.contactEmail}
                  onChange={(e) => setNewOrg({ ...newOrg, contactEmail: e.target.value })}
                  placeholder="admin@hopehealth.org"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={newOrg.phone}
                    onChange={(e) => setNewOrg({ ...newOrg, phone: e.target.value })}
                    placeholder="+1 (800) 555-0199"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={newOrg.address}
                    onChange={(e) => setNewOrg({ ...newOrg, address: e.target.value })}
                    placeholder="Medical Centre Parkway"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Provision Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
