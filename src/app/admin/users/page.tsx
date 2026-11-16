'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { User } from '@/lib/db/types';
import { RoleBadge } from '@/components/RoleBadge';
import {
  Users,
  Search,
  CheckCircle2,
  X,
  UserPlus,
} from 'lucide-react';

export default function AdminUsersPage() {
  const { currentOrg, user } = useAuth();
  const [userData, setUserData] = useState<{ organizationId: string; users: User[] } | null>(null);
  const users = userData && userData.organizationId === currentOrg?.id ? userData.users : [];
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'support_agent',
    department: 'Patient Care & Helpdesk',
    phone: '',
    password: '',
  });

  useEffect(() => {
    if (!currentOrg) return;
    const organizationId = currentOrg.id;
    let active = true;
    async function loadUsers() {
      try {
        const response = await fetch(`/api/users?organizationId=${organizationId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load users');
        if (active) setUserData({ organizationId, users: data.users || [] });
      } catch (error) {
        console.error('User list request failed:', error);
        if (active) setRequestError(error instanceof Error ? error.message : 'Unable to load users');
      }
    }
    void loadUsers();
    return () => {
      active = false;
    };
  }, [currentOrg]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    try {
      setRequestError('');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          organizationId: currentOrg.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRequestError(data.error || 'Unable to create staff account');
        return;
      }
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        role: 'support_agent',
        department: 'Patient Care & Helpdesk',
        phone: '',
        password: '',
      });
      if (currentOrg) {
        const usersResponse = await fetch(`/api/users?organizationId=${currentOrg.id}`);
        const usersData = await usersResponse.json();
        if (!usersResponse.ok) throw new Error(usersData.error || 'Unable to refresh users');
        setUserData({ organizationId: currentOrg.id, users: usersData.users || [] });
      }
    } catch (err) {
      console.error('Unable to create staff account:', err);
      setRequestError('Unable to create staff account. Please try again.');
    }
  };

  const toggleUserAccess = async (target: User) => {
    setRequestError('');
    setUpdatingUserId(target.id);
    try {
      const response = await fetch(`/api/users/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: target.isActive === false }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update account access');
      setUserData((previous) => previous
        ? { ...previous, users: previous.users.map((item) => item.id === target.id ? data.user : item) }
        : previous);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to update account access');
    } finally {
      setUpdatingUserId('');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="flex-1 flex bg-slate-100 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
              <Users className="w-4 h-4 text-teal-600" />
              <span>User & Staff Directory</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Organization Users & Access
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage clinical administrators, support agents, and registered patients for {currentOrg?.name}
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff Member
          </button>
        </div>

        {/* Filter controls */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user name or email..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            >
              <option value="all">All Roles</option>
              <option value="hospital_admin">Hospital Admin</option>
              <option value="support_agent">Support Agent</option>
              <option value="patient">Patient / Caregiver</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Registered</th>
                  <th className="px-6 py-3">Access Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div>{u.name}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{u.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {u.department || 'General Clinical'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {u.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${u.isActive === false ? 'text-slate-600 bg-slate-100 border-slate-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200'}`}>
                        {u.isActive !== false && <CheckCircle2 className="w-3 h-3" />}
                        {u.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => toggleUserAccess(u)}
                        disabled={updatingUserId === u.id || u.id === user?.id || u.role === 'super_admin'}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${u.isActive === false ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`}
                      >
                        {updatingUserId === u.id ? 'Saving…' : u.isActive === false ? 'Reactivate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Add New Staff Member</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Jordan Lee"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jordan.lee@metrohealth.org"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="support_agent">Support Agent</option>
                    {user?.role === 'super_admin' && <option value="hospital_admin">Hospital Admin</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="At least 8 characters"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                {requestError && (
                  <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {requestError}
                  </p>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Cardiology"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                  </input>
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
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
