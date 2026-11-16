'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { SupportTicket } from '@/lib/db/types';
import { TicketStatusBadge, TicketPriorityBadge } from '@/components/TicketStatusBadge';
import {
  Ticket,
  Search,
  Plus,
  Send,
  Clock,
  User,
  Headphones,
} from 'lucide-react';

export default function TicketsPage() {
  const { user, currentOrg } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState<boolean>(false);
  const [newTicketData, setNewTicketData] = useState({
    subject: '',
    description: '',
    category: 'Billing & Insurance',
    priority: 'medium',
  });

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/tickets');
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        if (data.tickets && data.tickets.length > 0 && !selectedTicket) {
          setSelectedTicket(data.tickets[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    let active = true;
    async function loadTickets() {
      try {
        const response = await fetch('/api/tickets');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load tickets');
        if (!active) return;
        const nextTickets: SupportTicket[] = data.tickets || [];
        setTickets(nextTickets);
        setSelectedTicket((previous) =>
          previous && nextTickets.some((ticket) => ticket.id === previous.id)
            ? nextTickets.find((ticket) => ticket.id === previous.id) || null
            : nextTickets[0] || null
        );
      } catch (error) {
        console.error('Ticket list request failed:', error);
      }
    }
    void loadTickets();
    return () => {
      active = false;
    };
  }, [currentOrg, user]);

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setSubmittingReply(true);

    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyText,
          isInternalNote: false,
        }),
      });

      if (res.ok) {
        setReplyText('');
        // Refresh ticket
        const updatedTicketRes = await fetch(`/api/tickets/${selectedTicket.id}`);
        if (updatedTicketRes.ok) {
          const updated = await updatedTicketRes.json();
          setSelectedTicket(updated.ticket);
          fetchTickets();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleCreateNewTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg) return;

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTicketData,
          organizationId: currentOrg.id,
        }),
      });

      if (res.ok) {
        setShowNewTicketModal(false);
        setNewTicketData({
          subject: '',
          description: '',
          category: 'Billing & Insurance',
          priority: 'medium',
        });
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesSearch =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex-1 bg-slate-100 min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
              <Ticket className="w-4 h-4 text-teal-600" />
              <span>Patient & Caregiver Helpdesk</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Support Ticket Tracker
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track unresolved questions escalated from AI chat or submit direct hospital assistance requests
            </p>
          </div>

          <button
            onClick={() => setShowNewTicketModal(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create New Ticket
          </button>
        </div>

        {/* 2-Column Split: Ticket List (Left) + Detail & Conversation (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Tickets Master */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Search & Filters */}
            <div className="p-4 border-b border-slate-200 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ticket ID or subject..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {['all', 'open', 'in_progress', 'resolved'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap capitalize transition-colors ${
                      statusFilter === st
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <Ticket className="w-8 h-8 mx-auto text-slate-300" />
                  <p>No tickets found matching your filter</p>
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
                        <TicketStatusBadge status={t.status} />
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">
                        {t.subject}
                      </h4>

                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {t.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                        <span>{t.category}</span>
                        <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Ticket Details & Active Conversation Thread */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
            {selectedTicket ? (
              <>
                {/* Detail Header */}
                <div className="p-6 border-b border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-slate-900">
                        {selectedTicket.id}
                      </span>
                      <TicketStatusBadge status={selectedTicket.status} />
                      <TicketPriorityBadge priority={selectedTicket.priority} />
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Updated {new Date(selectedTicket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {selectedTicket.subject}
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Organization</span>
                      <p className="font-semibold text-slate-800 truncate">{selectedTicket.organizationName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Agent</span>
                      <p className="font-semibold text-teal-700">
                        {selectedTicket.assignedAgentName || 'Unassigned (In Queue)'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Category</span>
                      <p className="font-semibold text-slate-800">{selectedTicket.category}</p>
                    </div>
                  </div>

                  {/* Initial Description Card */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-slate-900 block mb-1">Issue Description:</span>
                    {selectedTicket.description}
                  </div>
                </div>

                {/* Reply Message Thread */}
                <div className="p-6 flex-1 overflow-y-auto space-y-4 max-h-[350px]">
                  <div className="text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                      Communication History
                    </span>
                  </div>

                  {selectedTicket.replies.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No agent replies yet. Our team will review this shortly.
                    </div>
                  ) : (
                    selectedTicket.replies.map((rep) => {
                      const isAgent = rep.senderRole === 'support_agent' || rep.senderRole === 'hospital_admin';

                      return (
                        <div
                          key={rep.id}
                          className={`flex gap-3 ${isAgent ? 'justify-start' : 'justify-end'}`}
                        >
                          {isAgent && (
                            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <Headphones className="w-4 h-4" />
                            </div>
                          )}

                          <div
                            className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                              isAgent
                                ? 'bg-teal-50 text-slate-800 border border-teal-100 rounded-tl-none'
                                : 'bg-slate-800 text-white rounded-tr-none'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-bold text-[11px] opacity-90">{rep.senderName}</span>
                              <span className="text-[10px] opacity-75">
                                {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p>{rep.message}</p>
                          </div>

                          {!isAgent && (
                            <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Reply Composer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                    placeholder="Type a follow-up reply for the support team..."
                    className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim() || submittingReply}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-40"
                  >
                    <span>Reply</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Ticket className="w-12 h-12 text-slate-300 mb-2" />
                <p className="text-xs font-semibold">Select a ticket from the left to view response history</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-100 text-teal-700 rounded-xl">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Create Support Ticket</h3>
                <p className="text-xs text-slate-500">{currentOrg?.name}</p>
              </div>
            </div>

            <form onSubmit={handleCreateNewTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={newTicketData.subject}
                  onChange={(e) => setNewTicketData({ ...newTicketData, subject: e.target.value })}
                  placeholder="e.g. Inpatient Admission Pre-Authorization Inquiry"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Category
                  </label>
                  <select
                    value={newTicketData.category}
                    onChange={(e) => setNewTicketData({ ...newTicketData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Billing & Insurance">Billing & Insurance</option>
                    <option value="Appointment">Appointment</option>
                    <option value="Admission & Discharge">Admission & Discharge</option>
                    <option value="Lab Reports & Diagnostics">Lab Reports & Diagnostics</option>
                    <option value="General Inquiry">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTicketData.priority}
                    onChange={(e) => setNewTicketData({ ...newTicketData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  required
                  value={newTicketData.description}
                  onChange={(e) => setNewTicketData({ ...newTicketData, description: e.target.value })}
                  placeholder="Provide complete details so our patient support desk can assist you accurately..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
