'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { SupportTicket, User } from '@/lib/db/types';
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/TicketStatusBadge';
import {
  LifeBuoy,
  AlertTriangle,
  Search,
  Headphones,
  Send,
  Lock,
} from 'lucide-react';

export default function AdminTicketsPage() {
  const { currentOrg, user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [isInternalNote, setIsInternalNote] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [staffList, setStaffList] = useState<User[]>([]);

  const fetchTickets = async () => {
    if (!currentOrg) return;
    try {
      const res = await fetch(`/api/tickets?organizationId=${currentOrg.id}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        if (data.tickets && data.tickets.length > 0 && !selectedTicket) {
          setSelectedTicket(data.tickets[0]);
        }
      }

      if (user?.role !== 'support_agent') {
        const usersRes = await fetch(`/api/users?organizationId=${currentOrg.id}`);
        if (usersRes.ok) {
          const uData = await usersRes.json();
          setStaffList((uData.users || []).filter((staff: User) => staff.role === 'support_agent' && staff.isActive !== false));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!currentOrg) return;
    const organizationId = currentOrg.id;
    let active = true;
    async function loadTickets() {
      try {
        const ticketsResponse = await fetch(`/api/tickets?organizationId=${organizationId}`);
        const ticketsData = await ticketsResponse.json();
        let usersData: { users?: User[] } = {};
        if (user?.role !== 'support_agent') {
          const usersResponse = await fetch(`/api/users?organizationId=${organizationId}`);
          usersData = await usersResponse.json();
          if (!usersResponse.ok) throw new Error((usersData as { error?: string }).error || 'Unable to load support staff');
        }
        if (!ticketsResponse.ok) throw new Error(ticketsData.error || 'Unable to load support workspace');
        if (!active) return;
        const nextTickets: SupportTicket[] = ticketsData.tickets || [];
        setTickets(nextTickets);
        setSelectedTicket((previous) =>
          previous?.organizationId === organizationId
            ? nextTickets.find((ticket) => ticket.id === previous.id) || nextTickets[0] || null
            : nextTickets[0] || null
        );
        setStaffList((usersData.users || []).filter((staff) => staff.role === 'support_agent' && staff.isActive !== false));
      } catch (error) {
        console.error('Support workspace request failed:', error);
      }
    }
    void loadTickets();
    return () => {
      active = false;
    };
  }, [currentOrg, user?.role]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.ticket);
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePriority = async (newPriority: string) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.ticket);
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEscalate = async () => {
    if (!selectedTicket) return;
    try {
      const response = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escalate: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to escalate ticket');
      setSelectedTicket(data.ticket);
      await fetchTickets();
    } catch (error) {
      console.error('Ticket escalation failed:', error);
    }
  };

  const handleAssignAgent = async (agentId: string, agentName: string) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedAgentId: agentId,
          assignedAgentName: agentName,
          status: selectedTicket.status === 'open' ? 'in_progress' : selectedTicket.status,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data.ticket);
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyMessage,
          isInternalNote,
        }),
      });

      if (res.ok) {
        setReplyMessage('');
        const refreshedRes = await fetch(`/api/tickets/${selectedTicket.id}`);
        if (refreshedRes.ok) {
          const rData = await refreshedRes.json();
          setSelectedTicket(rData.ticket);
          fetchTickets();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesSearch =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="flex-1 flex bg-slate-100 min-h-[calc(100vh-4rem)]">
      <Sidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
        {/* Top Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
              <LifeBuoy className="w-4 h-4 text-teal-600" />
              <span>Support Helpdesk & Triage Desk</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Hospital Support Ticket Desk
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review escalated patient questions, assign agents, and respond within SLA targets
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
              Active Tenant: {currentOrg?.name}
            </span>
          </div>
        </div>

        {/* Master-Detail Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Tickets Queue */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Filter Tray */}
            <div className="p-4 border-b border-slate-200 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ticket ID, user, or topic..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_for_user">Waiting for User</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Ticket Cards List */}
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No tickets matching current filters.
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? 'bg-teal-50/70 border-l-4 border-teal-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-teal-800">{t.id}</span>
                        <div className="flex items-center gap-1.5">
                          <TicketPriorityBadge priority={t.priority} />
                          <TicketStatusBadge status={t.status} />
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">
                        {t.subject}
                      </h4>

                      <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                        <span>👤 {t.userName}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {t.unresolvedAiQuery && (
                        <div className="mt-2 p-1.5 bg-amber-50 rounded text-[10px] text-amber-800 font-medium truncate">
                          ⚡ AI Escalation: {t.unresolvedAiQuery}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Ticket Workspace */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[550px]">
            {selectedTicket ? (
              <>
                {/* Header with Assignment & Status Controls */}
                <div className="p-5 border-b border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-slate-900">
                        {selectedTicket.id}
                      </span>
                      <TicketStatusBadge status={selectedTicket.status} />
                      <TicketPriorityBadge priority={selectedTicket.priority} />
                    </div>

                    {user?.role === 'support_agent' && selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                      <button
                        type="button"
                        onClick={handleEscalate}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" /> Escalate
                      </button>
                    )}

                    {/* Quick Status Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Update Status:</span>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 shadow-2xs"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="waiting_for_user">Waiting for User</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <h2 className="text-base font-bold text-slate-900">{selectedTicket.subject}</h2>
                  {selectedTicket.escalatedAt && (
                    <p className="text-xs font-medium text-amber-800">Escalated by {selectedTicket.escalatedBy || 'support staff'} · {new Date(selectedTicket.escalatedAt).toLocaleString()}</p>
                  )}

                  {/* Metadata Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Patient</span>
                      <p className="font-semibold text-slate-800 truncate">{selectedTicket.userName}</p>
                      <span className="text-[10px] text-slate-400">{selectedTicket.userEmail}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Assignee</span>
                      {user?.role === 'support_agent' ? (
                        <p className="mt-1 text-xs font-semibold text-teal-800">{selectedTicket.assignedAgentName || 'Assigned to you'}</p>
                      ) : (
                        <select
                          value={selectedTicket.assignedAgentId || ''}
                          onChange={(e) => {
                            const target = staffList.find((staff) => staff.id === e.target.value);
                            if (target) handleAssignAgent(target.id, target.name);
                          }}
                          aria-label="Assign ticket to support agent"
                          className="w-full mt-0.5 bg-teal-50 border border-teal-200 rounded px-1.5 py-1 text-xs font-semibold text-teal-800"
                        >
                          <option value="" disabled>{selectedTicket.assignedAgentName || 'Select an agent'}</option>
                          {staffList.map((staff) => (
                            <option key={staff.id} value={staff.id}>{staff.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Priority</span>
                      <select
                        value={selectedTicket.priority}
                        onChange={(e) => handleUpdatePriority(e.target.value)}
                        className="w-full mt-0.5 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Category</span>
                      <p className="font-semibold text-slate-800 mt-1 truncate">{selectedTicket.category}</p>
                    </div>
                  </div>

                  {/* Original Query description */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block mb-0.5">Initial Problem Description:</span>
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Conversation Thread */}
                <div className="p-6 flex-1 overflow-y-auto space-y-4 max-h-[350px]">
                  {selectedTicket.replies.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No staff responses yet. Add a public reply to message the patient or log an internal note.
                    </div>
                  ) : (
                    selectedTicket.replies.map((rep) => {
                      const isInternal = rep.isInternalNote;
                      const isAgent = rep.senderRole === 'support_agent' || rep.senderRole === 'hospital_admin';

                      return (
                        <div
                          key={rep.id}
                          className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                            isInternal
                              ? 'bg-amber-50 border border-amber-200 text-amber-900'
                              : isAgent
                              ? 'bg-teal-50 border border-teal-100 text-slate-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="flex items-center gap-1.5">
                              {isInternal ? (
                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                              ) : (
                                <Headphones className="w-3.5 h-3.5 text-teal-600" />
                              )}
                              <span>{rep.senderName}</span>
                              <span className="text-[10px] font-normal opacity-75 capitalize">
                                ({rep.senderRole.replace('_', ' ')})
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-line">{rep.message}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Reply Composer with Internal Note toggle */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Compose Response</span>
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                        className="rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-semibold text-xs">Mark as Internal Note (Staff only)</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                      placeholder={
                        isInternalNote
                          ? 'Add internal staff comment or review note...'
                          : 'Type response to send directly to the patient...'
                      }
                      className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                    />

                    <button
                      onClick={handleSendReply}
                      disabled={!replyMessage.trim() || isSubmitting}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-40 text-white ${
                        isInternalNote ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-600 hover:bg-teal-700'
                      }`}
                    >
                      <span>{isInternalNote ? 'Post Note' : 'Send Reply'}</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
                <LifeBuoy className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-xs font-semibold">Select a ticket to begin agent triage</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
