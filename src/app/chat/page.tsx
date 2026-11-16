'use client';

import React, { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { ChatMessage, Citation, Organization } from '@/lib/db/types';
import { CitationModal } from '@/components/CitationModal';
import { EmergencyBanner } from '@/components/EmergencyBanner';
import {
  Send,
  Bot,
  User,
  ShieldCheck,
  FileText,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ArrowUpRight,
  LifeBuoy,
} from 'lucide-react';

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center p-12 text-slate-400 text-xs font-semibold">Loading AI Healthcare Assistant...</div>}>
      <ChatContent />
    </Suspense>
  );
}

function createWelcomeMessage(organization: Organization): ChatMessage {
  return {
    id: `welcome_${organization.id}`,
    conversationId: 'initial',
    organizationId: organization.id,
    senderRole: 'assistant',
    senderName: `${organization.name} Support Agent`,
    content: `Hello! I am your AI Administrative Support Assistant for **${organization.name}**.

I can assist you with:
• **Ward Visiting Hours & Attendant Rules**
• **Admission Procedures & Required Documents**
• **Cashless Health Insurance & TPA Pre-Authorization**
• **Outpatient (OPD) Schedules & Appointment Policies**
• **Radiology & Lab Test Preparations**

*Please note: I provide administrative and service guidance only. For medical emergencies, please dial **911** or **108** immediately.*

How can I help you today?`,
    createdAt: organization.createdAt,
  };
}

function ChatContent() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt') || '';
  const { currentOrg, user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState(initialPrompt);
  const [conversationId, setConversationId] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [hasEmergency, setHasEmergency] = useState<boolean>(false);
  const [showEscalateModal, setShowEscalateModal] = useState<boolean>(false);
  const [escalateSubject, setEscalateSubject] = useState<string>('');
  const [escalateDescription, setEscalateDescription] = useState<string>('');
  const [ticketCreatedNotice, setTicketCreatedNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sentInitialPromptRef = useRef('');

  // Suggested prompt pills
  const SUGGESTED_PROMPTS = [
    { label: 'Visiting hours', question: 'What are the visiting hours for general wards and the ICU?' },
    { label: 'Admission documents', question: 'Which documents are required for patient admission registration?' },
    { label: 'Insurance approval', question: 'How long does insurance pre-authorization usually take?' },
    { label: 'Appointments', question: 'How can I book or cancel an OPD specialist appointment?' },
    { label: 'Test preparation', question: 'How should I prepare for an abdominal ultrasound or fasting blood test?' },
    { label: 'Billing contact', question: 'How do I contact billing for an itemized statement?' },
  ];

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = useCallback(async (textToSend?: string) => {
    const text = textToSend || inputQuery;
    if (!text.trim() || !currentOrg) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      conversationId: conversationId || 'temp',
      organizationId: currentOrg.id,
      senderRole: 'patient',
      senderName: user?.name || 'You',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId || undefined,
          organizationId: currentOrg.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.message) {
        setConversationId(data.conversationId);
        setMessages((prev) => [...prev, data.message]);

        if (data.message.isEmergencyAlert) {
          setHasEmergency(true);
        }

        if (data.createdTicketId) {
          setTicketCreatedNotice(`Ticket #${data.createdTicketId} created`);
        }
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (error) {
      console.error('Chat message request failed:', error);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        conversationId: conversationId || 'temp',
        organizationId: currentOrg.id,
        senderRole: 'assistant',
        senderName: 'System Error',
        content: 'Unable to process your inquiry right now. Please try again or open a support ticket.',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [conversationId, currentOrg, inputQuery, user]);

  useEffect(() => {
    if (!initialPrompt) {
      sentInitialPromptRef.current = '';
      return;
    }
    if (!currentOrg || sentInitialPromptRef.current === initialPrompt) return;
    sentInitialPromptRef.current = initialPrompt;
    void sendMessage(initialPrompt);
  }, [currentOrg, initialPrompt, sendMessage]);

  const displayMessages = messages.length > 0
    ? messages
    : currentOrg
      ? [createWelcomeMessage(currentOrg)]
      : [];

  const handleEscalateToTicket = async () => {
    if (!escalateSubject || !currentOrg) return;

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrg.id,
          subject: escalateSubject,
          description: escalateDescription || 'Escalated from live chatbot session.',
          category: 'General Inquiry',
          priority: 'high',
          sourceConversationId: conversationId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ticket) {
        setShowEscalateModal(false);
        setTicketCreatedNotice(data.ticket.id);

        const escalationNoticeMsg: ChatMessage = {
          id: `esc_${Date.now()}`,
          conversationId: conversationId || 'temp',
          organizationId: currentOrg.id,
          senderRole: 'assistant',
          senderName: 'Escalation Officer',
          content: `✅ Support Ticket **#${data.ticket.id}** has been successfully opened! A member of our patient support desk has been notified and will reply shortly. You can track this under **Track Tickets**.`,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, escalationNoticeMsg]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetChat = () => {
    if (!currentOrg) return;
    setConversationId('');
    setHasEmergency(false);
    setTicketCreatedNotice(null);
    setMessages([{
      ...createWelcomeMessage(currentOrg),
      id: `welcome_${Date.now()}`,
      content: `Conversation restarted for **${currentOrg.name}**. How can I help you today?`,
    }]);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-100 min-h-[calc(100vh-4rem)]">
      {/* Emergency Alert Banner if triggered */}
      {hasEmergency && (
        <EmergencyBanner
          isTriggered={true}
          emergencyContact={currentOrg?.emergencyContact}
        />
      )}

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col p-2 sm:p-4 lg:p-6">
        {/* Chat Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {currentOrg?.name || 'Healthcare Facility'} Support AI
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Grounded RAG
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Responses strictly constrained to {currentOrg?.name}&apos;s verified records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEscalateSubject(messages[messages.length - 1]?.content.substring(0, 40) || 'Assistance requested');
                setEscalateDescription(messages[messages.length - 1]?.content || '');
                setShowEscalateModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-amber-600" />
              <span>Escalate to Human Agent</span>
            </button>

            <button
              onClick={resetChat}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Reset Chat Session"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 overflow-y-auto space-y-5 max-h-[60vh]">
          {ticketCreatedNotice && (
            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800">
              {ticketCreatedNotice}
            </p>
          )}
          {displayMessages.map((msg) => {
            const isUser = msg.senderRole === 'patient';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[78%] space-y-2`}>
                  {/* Message bubble */}
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-teal-600 text-white rounded-tr-none shadow-xs'
                        : msg.isEmergencyAlert
                        ? 'bg-red-50 text-red-950 border border-red-200 rounded-tl-none font-medium'
                        : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    <div className="whitespace-pre-line prose prose-sm max-w-none">
                      {msg.isDemoSample && <span className="mb-2 inline-flex rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-900">Fictional demo answer</span>}
                      {msg.isDemoSample && <br />}
                      {msg.content}
                    </div>

                    {/* Grounded Citation Chips */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <FileText className="w-3 h-3 text-teal-600" />
                          Source Citations (Grounded Policy):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citations.map((cite, cIdx) => (
                            <button
                              key={cIdx}
                              onClick={() => setSelectedCitation(cite)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-teal-50 border border-teal-200 rounded-lg text-xs font-medium text-teal-800 transition-colors shadow-2xs group"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                              <span className="truncate max-w-[200px]">{cite.sectionTitle}</span>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                                {Math.round(cite.confidenceScore * 100)}%
                              </span>
                              <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-teal-600" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Confidence / Quality Indicator */}
                    {msg.confidence !== undefined && !msg.isDemoSample && (
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-teal-600" />
                          Retrieval Quality: {Math.round(msg.confidence * 100)}%
                        </span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>

                  {/* Fallback alert banner if information not in knowledge base */}
                  {msg.isFallback && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Query not in approved knowledge base. Would you like a human ticket?</span>
                      </div>
                      <button
                        onClick={() => {
                          setEscalateSubject('Help requested for unindexed topic');
                          setEscalateDescription(msg.content);
                          setShowEscalateModal(true);
                        }}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0"
                      >
                        Open Ticket
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3 items-center text-slate-500 text-xs">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-[11px] font-medium text-slate-500">
                  Retrieving {currentOrg?.name} documents...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries Tray */}
        <div className="py-2.5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Quick questions</span>
            <span className="text-[11px] text-slate-400">Answers use {currentOrg?.name || 'your organization'}&apos;s approved information</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {SUGGESTED_PROMPTS.map(({ label, question }) => (
            <button
              key={label}
              type="button"
              disabled={isTyping}
              title={question}
              onClick={() => sendMessage(question)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900 disabled:cursor-wait disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-teal-700 dark:hover:bg-teal-950/40"
            >
              {label}
            </button>
          ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex items-center gap-2">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={`Ask about visiting hours, admission paperwork, cashless insurance, or OPD at ${currentOrg?.name || 'the hospital'}...`}
            className="flex-1 px-3 py-2.5 bg-transparent text-xs sm:text-sm focus:outline-hidden text-slate-900"
          />

          <button
            onClick={() => sendMessage()}
            disabled={!inputQuery.trim() || isTyping}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-1.5 transition-all disabled:opacity-40"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Citation Inspector Modal */}
      <CitationModal
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
      />

      {/* Escalate to Human Support Ticket Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Escalate to Support Agent</h3>
                <p className="text-xs text-slate-500">Route your inquiry to {currentOrg?.name} staff</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Ticket Subject
                </label>
                <input
                  type="text"
                  value={escalateSubject}
                  onChange={(e) => setEscalateSubject(e.target.value)}
                  placeholder="e.g. Assistance with pre-auth claim"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Details / Unresolved Query
                </label>
                <textarea
                  rows={3}
                  value={escalateDescription}
                  onChange={(e) => setEscalateDescription(e.target.value)}
                  placeholder="Explain what information you need from human support..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalateToTicket}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm"
              >
                Confirm & Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
