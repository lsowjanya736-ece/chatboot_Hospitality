import {
  Organization,
  User,
  KnowledgeDocument,
  SupportTicket,
  Conversation,
  ChatMessage,
  AuditLog,
  TicketReply,
} from './types';
import clientPromise from './mongodb';
import { randomUUID } from 'node:crypto';
import type { Db } from 'mongodb';

interface PasswordResetRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

function withoutPassword(user: User): User {
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

// In-memory persistent state (persists across API requests in Node process)
class DataStore {
  organizations: Organization[] = [];
  users: User[] = [];
  documents: KnowledgeDocument[] = [];
  tickets: SupportTicket[] = [];
  conversations: Conversation[] = [];
  messages: Record<string, ChatMessage[]> = {};
  auditLogs: AuditLog[] = [];
  passwordResetRecords: PasswordResetRecord[] = [];
  private databasePromise: Promise<Db> | null = null;

  private getDatabase(): Promise<Db> | null {
    if (!clientPromise) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGODB_URI must be configured for production');
      }
      return null;
    }
    if (!this.databasePromise) {
      this.databasePromise = clientPromise.then((client) => {
        const db = client.db(process.env.MONGODB_DB_NAME || 'healthcare_support_rag');
        return db;
      });
    }
    return this.databasePromise;
  }

  // --- ORGANIZATIONS ---
  async getOrganizations(): Promise<Organization[]> {
    const database = this.getDatabase();
    if (database) {
      return (await database).collection<Organization>('organizations').find({}).sort({ name: 1 }).toArray();
    }
    return this.organizations;
  }

  async getOrganizationById(id: string): Promise<Organization | undefined> {
    const database = this.getDatabase();
    if (database) {
      return (await (await database).collection<Organization>('organizations').findOne({ id })) || undefined;
    }
    return this.organizations.find((o) => o.id === id);
  }

  async createOrganization(org: Omit<Organization, 'id' | 'createdAt'>): Promise<Organization> {
    const newOrg: Organization = {
      ...org,
      id: `org_${randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    const database = this.getDatabase();
    if (database) {
      await (await database).collection<Organization>('organizations').insertOne(newOrg);
      return newOrg;
    }
    this.organizations.push(newOrg);
    return newOrg;
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | null> {
    const database = this.getDatabase();
    if (database) {
      const collection = (await database).collection<Organization>('organizations');
      await collection.updateOne({ id }, { $set: updates });
      return (await collection.findOne({ id })) || null;
    }
    const idx = this.organizations.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    this.organizations[idx] = { ...this.organizations[idx], ...updates };
    return this.organizations[idx];
  }

  // --- USERS ---
  async getUsers(organizationId?: string): Promise<User[]> {
    const database = this.getDatabase();
    if (database) {
      const filter = organizationId && organizationId !== 'all' ? { organizationId } : {};
      const users = await (await database).collection<User>('users').find(filter).toArray();
      return users.map(withoutPassword);
    }
    if (!organizationId || organizationId === 'all') {
      return this.users.map(withoutPassword);
    }
    return this.users
      .filter((u) => u.organizationId === organizationId)
      .map(withoutPassword);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const database = this.getDatabase();
    if (database) {
      return (await (await database).collection<User>('users').findOne({ id })) || undefined;
    }
    return this.users.find((u) => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const normalizedEmail = email.trim().toLowerCase();
    const database = this.getDatabase();
    if (database) {
      return (await (await database).collection<User>('users').findOne({ email: normalizedEmail })) || undefined;
    }
    return this.users.find((u) => u.email.toLowerCase() === normalizedEmail);
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: `usr_${randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    const database = this.getDatabase();
    if (database) {
      const collection = (await database).collection<User>('users');
      await collection.createIndex({ email: 1 }, { unique: true });
      await collection.insertOne(newUser);
      return newUser;
    }
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>, organizationId?: string): Promise<User | null> {
    const database = this.getDatabase();
    if (database) {
      const filter = organizationId ? { id, organizationId } : { id };
      const collection = (await database).collection<User>('users');
      await collection.updateOne(filter, { $set: updates });
      return (await collection.findOne(filter)) || null;
    }
    const index = this.users.findIndex((user) =>
      user.id === id && (!organizationId || user.organizationId === organizationId)
    );
    if (index < 0) return null;
    this.users[index] = { ...this.users[index], ...updates };
    return this.users[index];
  }

  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    const database = this.getDatabase();
    if (database) {
      const collection = (await database).collection<PasswordResetRecord>('password_resets');
      await collection.createIndex({ tokenHash: 1 }, { unique: true });
      await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await collection.deleteMany({ userId });
      await collection.insertOne({ id: randomUUID(), userId, tokenHash, expiresAt });
      return;
    }

    this.passwordResetRecords = this.passwordResetRecords.filter((record) => record.userId !== userId);
    this.passwordResetRecords.push({ id: randomUUID(), userId, tokenHash, expiresAt });
  }

  async consumePasswordResetToken(tokenHash: string, passwordHash: string): Promise<boolean> {
    const database = this.getDatabase();
    if (database) {
      const db = await database;
      const resets = db.collection<PasswordResetRecord>('password_resets');
      const record = await resets.findOne({ tokenHash, expiresAt: { $gt: new Date() } });
      if (!record) return false;
      const result = await db.collection<User>('users').updateOne(
        { id: record.userId },
        { $set: { password: passwordHash } }
      );
      await resets.deleteOne({ id: record.id });
      return result.modifiedCount === 1;
    }

    const index = this.passwordResetRecords.findIndex(
      (record) => record.tokenHash === tokenHash && record.expiresAt.getTime() > Date.now()
    );
    if (index === -1) return false;
    const [record] = this.passwordResetRecords.splice(index, 1);
    const user = this.users.find((item) => item.id === record.userId);
    if (!user) return false;
    user.password = passwordHash;
    return true;
  }

  // --- KNOWLEDGE DOCUMENTS ---
  async getDocuments(organizationId: string): Promise<KnowledgeDocument[]> {
    const database = this.getDatabase();
    if (database) {
      const filter = organizationId === 'all' ? {} : { organizationId };
      return (await database)
        .collection<KnowledgeDocument>('knowledge_documents')
        .find(filter)
        .sort({ uploadedAt: -1 })
        .toArray();
    }
    if (organizationId === 'all') {
      return this.documents;
    }
    // Strict multi-tenant isolation
    return this.documents.filter((doc) => doc.organizationId === organizationId);
  }

  async getDocumentById(id: string, organizationId?: string): Promise<KnowledgeDocument | undefined> {
    const database = this.getDatabase();
    if (database) {
      const filter = organizationId && organizationId !== 'all'
        ? { id, organizationId }
        : { id };
      return (await (await database).collection<KnowledgeDocument>('knowledge_documents').findOne(filter)) || undefined;
    }
    return this.documents.find(
      (doc) => doc.id === id && (!organizationId || organizationId === 'all' || doc.organizationId === organizationId)
    );
  }

  async createDocument(doc: Omit<KnowledgeDocument, 'id' | 'uploadedAt'>): Promise<KnowledgeDocument> {
    const id = `doc_${randomUUID()}`;
    const newDoc: KnowledgeDocument = {
      ...doc,
      id,
      chunks: doc.chunks.map((chunk, index) => ({
        ...chunk,
        id: `chunk_${id}_${index}`,
        documentId: id,
        chunkIndex: index,
      })),
      uploadedAt: new Date().toISOString(),
    };
    const database = this.getDatabase();
    if (database) {
      await (await database).collection<KnowledgeDocument>('knowledge_documents').insertOne(newDoc);
      return newDoc;
    }
    this.documents.unshift(newDoc);
    return newDoc;
  }

  async deleteDocument(id: string, organizationId: string): Promise<boolean> {
    const database = this.getDatabase();
    if (database) {
      const filter = organizationId === 'all' ? { id } : { id, organizationId };
      const result = await (await database).collection<KnowledgeDocument>('knowledge_documents').deleteOne(filter);
      return result.deletedCount > 0;
    }
    const idx = this.documents.findIndex(
      (doc) => doc.id === id && (organizationId === 'all' || doc.organizationId === organizationId)
    );
    if (idx === -1) return false;
    this.documents.splice(idx, 1);
    return true;
  }

  // --- SUPPORT TICKETS ---
  async getTickets(
    organizationId: string,
    role?: string,
    userId?: string
  ): Promise<SupportTicket[]> {
    const database = this.getDatabase();
    if (database) {
      const filter: Record<string, string> = {};
      if (organizationId !== 'all') filter.organizationId = organizationId;
      if (role === 'patient' && userId) filter.userId = userId;
      if (role === 'support_agent' && userId) filter.assignedAgentId = userId;
      return (await database)
        .collection<SupportTicket>('tickets')
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray();
    }
    let list = this.tickets;
    if (organizationId !== 'all') {
      list = list.filter((t) => t.organizationId === organizationId);
    }
    // Patient can only see their own tickets
    if (role === 'patient' && userId) {
      list = list.filter((t) => t.userId === userId);
    }
    if (role === 'support_agent' && userId) {
      list = list.filter((t) => t.assignedAgentId === userId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTicketById(id: string, organizationId?: string): Promise<SupportTicket | undefined> {
    const database = this.getDatabase();
    if (database) {
      const filter = organizationId && organizationId !== 'all'
        ? { id, organizationId }
        : { id };
      return (await (await database).collection<SupportTicket>('tickets').findOne(filter)) || undefined;
    }
    return this.tickets.find(
      (t) => t.id === id && (!organizationId || organizationId === 'all' || t.organizationId === organizationId)
    );
  }

  async createTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'replies'>): Promise<SupportTicket> {
    const year = new Date().getFullYear();
    const id = `TCK-${year}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    const newTicket: SupportTicket = {
      ...ticket,
      id,
      replies: [],
      createdAt: now,
      updatedAt: now,
    };
    const database = this.getDatabase();
    if (database) {
      await (await database).collection<SupportTicket>('tickets').insertOne(newTicket);
      return newTicket;
    }
    this.tickets.unshift(newTicket);
    return newTicket;
  }

  async updateTicket(
    id: string,
    updates: Partial<SupportTicket>,
    organizationId?: string
  ): Promise<SupportTicket | null> {
    const database = this.getDatabase();
    if (database) {
      const filter = organizationId && organizationId !== 'all'
        ? { id, organizationId }
        : { id };
      const collection = (await database).collection<SupportTicket>('tickets');
      await collection.updateOne(filter, {
        $set: { ...updates, updatedAt: new Date().toISOString() },
      });
      return (await collection.findOne(filter)) || null;
    }
    const idx = this.tickets.findIndex(
      (t) => t.id === id && (!organizationId || organizationId === 'all' || t.organizationId === organizationId)
    );
    if (idx === -1) return null;

    this.tickets[idx] = {
      ...this.tickets[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.tickets[idx];
  }

  async addTicketReply(
    ticketId: string,
    reply: Omit<TicketReply, 'id' | 'ticketId' | 'createdAt'>,
    organizationId?: string
  ): Promise<TicketReply | null> {
    const ticket = await this.getTicketById(ticketId, organizationId);
    if (!ticket) return null;

    const newReply: TicketReply = {
      ...reply,
      id: `rep_${randomUUID()}`,
      ticketId,
      createdAt: new Date().toISOString(),
    };

    const database = this.getDatabase();
    if (database) {
      const filter = organizationId && organizationId !== 'all'
        ? { id: ticketId, organizationId }
        : { id: ticketId };
      const result = await (await database).collection<SupportTicket>('tickets').updateOne(filter, {
        $push: { replies: newReply },
        $set: { updatedAt: new Date().toISOString() },
      });
      return result.modifiedCount === 1 ? newReply : null;
    }

    ticket.replies.push(newReply);
    ticket.updatedAt = new Date().toISOString();
    return newReply;
  }

  // --- CONVERSATIONS & CHAT MESSAGES ---
  async getConversations(organizationId: string, userId?: string): Promise<Conversation[]> {
    const database = this.getDatabase();
    if (database) {
      const filter: Record<string, string> = {};
      if (organizationId !== 'all') filter.organizationId = organizationId;
      if (userId) filter.userId = userId;
      return (await database)
        .collection<Conversation>('conversations')
        .find(filter)
        .sort({ lastMessageAt: -1 })
        .toArray();
    }
    let list = this.conversations;
    if (organizationId !== 'all') {
      list = list.filter((c) => c.organizationId === organizationId);
    }
    if (userId) {
      list = list.filter((c) => c.userId === userId);
    }
    return list.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }

  async getConversationById(id: string, organizationId?: string): Promise<Conversation | undefined> {
    const database = this.getDatabase();
    if (database) {
      const filter = organizationId && organizationId !== 'all'
        ? { id, organizationId }
        : { id };
      return (await (await database).collection<Conversation>('conversations').findOne(filter)) || undefined;
    }
    return this.conversations.find(
      (c) => c.id === id && (!organizationId || organizationId === 'all' || c.organizationId === organizationId)
    );
  }

  async createConversation(conv: Omit<Conversation, 'id' | 'createdAt' | 'lastMessageAt'>): Promise<Conversation> {
    const id = `conv_${randomUUID()}`;
    const now = new Date().toISOString();
    const newConv: Conversation = {
      ...conv,
      id,
      createdAt: now,
      lastMessageAt: now,
    };
    const database = this.getDatabase();
    if (database) {
      await (await database).collection<Conversation>('conversations').insertOne(newConv);
      return newConv;
    }
    this.conversations.unshift(newConv);
    this.messages[id] = [];
    return newConv;
  }

  async updateConversation(
    id: string,
    updates: Partial<Conversation>,
    organizationId?: string
  ): Promise<Conversation | null> {
    const database = this.getDatabase();
    if (database) {
      const filter = organizationId && organizationId !== 'all'
        ? { id, organizationId }
        : { id };
      const collection = (await database).collection<Conversation>('conversations');
      await collection.updateOne(filter, { $set: updates });
      return (await collection.findOne(filter)) || null;
    }
    const conversation = this.conversations.find(
      (item) => item.id === id && (!organizationId || organizationId === 'all' || item.organizationId === organizationId)
    );
    if (!conversation) return null;
    Object.assign(conversation, updates);
    return conversation;
  }

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const database = this.getDatabase();
    if (database) {
      return (await database)
        .collection<ChatMessage>('messages')
        .find({ conversationId })
        .sort({ createdAt: 1 })
        .toArray();
    }
    return this.messages[conversationId] || [];
  }

  async addMessage(msg: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    const id = `msg_${randomUUID()}`;
    const now = new Date().toISOString();
    const newMsg: ChatMessage = {
      ...msg,
      id,
      createdAt: now,
    };

    const database = this.getDatabase();
    if (database) {
      const db = await database;
      await db.collection<ChatMessage>('messages').insertOne(newMsg);
      await db.collection<Conversation>('conversations').updateOne(
        { id: msg.conversationId, organizationId: msg.organizationId },
        {
          $set: {
            lastMessageSnippet: msg.content.substring(0, 80) + (msg.content.length > 80 ? '...' : ''),
            lastMessageAt: now,
          },
        }
      );
      return newMsg;
    }

    if (!this.messages[msg.conversationId]) {
      this.messages[msg.conversationId] = [];
    }
    this.messages[msg.conversationId].push(newMsg);

    // Update conversation last snippet
    const conv = this.conversations.find((c) => c.id === msg.conversationId);
    if (conv) {
      conv.lastMessageSnippet = msg.content.substring(0, 80) + (msg.content.length > 80 ? '...' : '');
      conv.lastMessageAt = now;
    }

    return newMsg;
  }

  // --- AUDIT LOGS ---
  async getAuditLogs(organizationId?: string): Promise<AuditLog[]> {
    const database = this.getDatabase();
    if (database) {
      const filter = !organizationId || organizationId === 'all'
        ? {}
        : { $or: [{ organizationId }, { organizationId: { $exists: false } }] };
      return (await database)
        .collection<AuditLog>('audit_logs')
        .find(filter)
        .sort({ timestamp: -1 })
        .toArray();
    }
    if (!organizationId || organizationId === 'all') {
      return [...this.auditLogs].reverse();
    }
    return this.auditLogs
      .filter((l) => !l.organizationId || l.organizationId === organizationId)
      .reverse();
  }

  async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const newLog: AuditLog = {
      ...log,
      id: `log_${randomUUID()}`,
      timestamp: new Date().toISOString(),
    };
    const database = this.getDatabase();
    if (database) {
      await (await database).collection<AuditLog>('audit_logs').insertOne(newLog);
      return newLog;
    }
    this.auditLogs.push(newLog);
    return newLog;
  }

  // --- ANALYTICS ---
  async getAnalytics(organizationId: string) {
    const [tickets, convs, docs, users] = await Promise.all([
      this.getTickets(organizationId),
      this.getConversations(organizationId),
      this.getDocuments(organizationId),
      this.getUsers(organizationId),
    ]);

    const totalConversations = convs.length;
    const totalTickets = tickets.length;
    const openTickets = tickets.filter((t) => t.status === 'open').length;
    const inProgressTickets = tickets.filter((t) => t.status === 'in_progress').length;
    const resolvedTickets = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length;
    
    // AI resolution rate calculation:
    // Conversations that were resolved without escalating to a ticket
    const aiResolvedConversations = convs.filter((c) => c.status === 'resolved').length;
    const aiResolutionRate = totalConversations > 0
      ? Math.round((aiResolvedConversations / totalConversations) * 100)
      : 0;

    const firstResponseDurations = tickets.flatMap((ticket) => {
      const firstPublicReply = ticket.replies
        .filter((reply) => !reply.isInternalNote)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
      if (!firstPublicReply) return [];
      const duration = new Date(firstPublicReply.createdAt).getTime() - new Date(ticket.createdAt).getTime();
      return Number.isFinite(duration) && duration >= 0 ? [duration / 60_000] : [];
    });
    const avgResponseTimeMinutes = firstResponseDurations.length > 0
      ? Math.round(firstResponseDurations.reduce((total, duration) => total + duration, 0) / firstResponseDurations.length)
      : 0;

    const unresolvedQueries = new Map<string, { count: number; category: string }>();
    for (const ticket of tickets) {
      const query = ticket.unresolvedAiQuery?.trim();
      if (!query) continue;
      const existing = unresolvedQueries.get(query);
      unresolvedQueries.set(query, {
        count: (existing?.count || 0) + 1,
        category: ticket.category,
      });
    }

    const categoryDistribution = [
      { name: 'Billing & Insurance', count: tickets.filter((t) => t.category === 'Billing & Insurance').length },
      { name: 'Appointments', count: tickets.filter((t) => t.category === 'Appointment').length },
      { name: 'Admissions', count: tickets.filter((t) => t.category === 'Admission & Discharge').length },
      { name: 'Diagnostics', count: tickets.filter((t) => t.category === 'Lab Reports & Diagnostics').length },
      { name: 'General Inquiries', count: tickets.filter((t) => t.category === 'General Inquiry').length },
    ];
    const now = new Date();
    const conversationTrend = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - index));
      const date = day.toISOString().slice(0, 10);
      return {
        date,
        day: day.toLocaleDateString('en-US', { weekday: 'short' }),
        conversations: convs.filter((conversation) => conversation.createdAt.startsWith(date)).length,
      };
    });

    return {
      totalUsers: users.length,
      totalConversations,
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      avgResponseTimeMinutes,
      aiResolutionRate,
      totalKnowledgeDocuments: docs.length,
      categoryDistribution,
      conversationTrend,
      frequentQueries: [...unresolvedQueries.entries()]
        .map(([query, value]) => ({ query, count: value.count, category: value.category }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }
}

// Global singleton instance for the Node server runtime
const globalStore = global as typeof globalThis & {
  __healthcareDataStore?: DataStore;
};

if (!globalStore.__healthcareDataStore) {
  globalStore.__healthcareDataStore = new DataStore();
}

export const dbStore = globalStore.__healthcareDataStore;
