'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { Conversation, ChatMessage } from '@/lib/db/types';
import {
  MessageSquare,
  ArrowRight,
  User,
  Bot,
} from 'lucide-react';

export default function ChatHistoryPage() {
  const { currentOrg } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (!currentOrg) return;
    const organizationId = currentOrg.id;
    let active = true;
    async function fetchConversations() {
      try {
        const res = await fetch(`/api/chat/conversations?organizationId=${organizationId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to load conversations');
        if (!active) return;
        const nextConversations: Conversation[] = data.conversations || [];
        setConversations(nextConversations);
        const firstConversation = nextConversations[0];
        setSelectedConv(firstConversation || null);
        if (!firstConversation) {
          setMessages([]);
          return;
        }
        setLoadingMessages(true);
        const messagesResponse = await fetch(`/api/chat/conversations/${firstConversation.id}`);
        const messagesData = await messagesResponse.json();
        if (!messagesResponse.ok) throw new Error(messagesData.error || 'Unable to load conversation messages');
        if (active) setMessages(messagesData.messages || []);
      } catch (error) {
        console.error('Conversation history request failed:', error);
      } finally {
        if (active) setLoadingMessages(false);
      }
    }
    void fetchConversations();
    return () => {
      active = false;
    };
  }, [currentOrg]);

  const loadMessages = async (conv: Conversation) => {
    setSelectedConv(conv);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/conversations/${conv.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-100 min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-1">
              <MessageSquare className="w-4 h-4 text-teal-600" />
              <span>Conversation History</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Past Support Conversations
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review prior AI responses, grounded document citations, and escalated tickets for {currentOrg?.name}
            </p>
          </div>

          <Link
            href="/chat"
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center gap-2 transition-all"
          >
            <span>Start New Chat</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Sessions List */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            <div className="p-4 bg-slate-50 font-bold text-xs text-slate-700">
              Saved Chat Sessions ({conversations.length})
            </div>

            {conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No past conversation records found.
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = selectedConv?.id === c.id;

                return (
                  <div
                    key={c.id}
                    onClick={() => loadMessages(c)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-teal-50/80 border-l-4 border-teal-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'escalated' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{c.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{c.lastMessageSnippet}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Chat Transcript */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[450px]">
            {selectedConv ? (
              <>
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{selectedConv.title}</h3>
                    <p className="text-xs text-slate-400">
                      Started on {new Date(selectedConv.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-4 max-h-[500px]">
                  {loadingMessages ? (
                    <div className="text-center text-xs text-slate-400 py-8">Loading transcript...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 py-8">No messages in this session.</div>
                  ) : (
                    messages.map((m) => {
                      const isUser = m.senderRole === 'patient';

                      return (
                        <div
                          key={m.id}
                          className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isUser && (
                            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0">
                              <Bot className="w-4 h-4" />
                            </div>
                          )}

                          <div
                            className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                              isUser
                                ? 'bg-teal-600 text-white rounded-tr-none'
                                : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-none'
                            }`}
                          >
                            <div className="whitespace-pre-line">{m.content}</div>
                            {m.citations && m.citations.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-200/50 text-[10px] text-slate-500">
                                📚 Citations: {m.citations.map((c) => c.sectionTitle).join(', ')}
                              </div>
                            )}
                          </div>

                          {isUser && (
                            <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
                <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-xs">Select a session on the left to read transcript</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
