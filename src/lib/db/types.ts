export interface Organization {
  id: string;
  name: string;
  slug: string;
  type: 'hospital' | 'clinic' | 'diagnostic' | 'telehealth';
  contactEmail: string;
  phone: string;
  address: string;
  website: string;
  slaHours: number;
  activeStatus: boolean;
  departments: string[];
  emergencyContact: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'super_admin' | 'hospital_admin' | 'support_agent' | 'patient';
  isActive?: boolean;
  organizationId: string; // Tenant ID
  organizationName?: string;
  department?: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  sectionTitle: string;
  content: string;
  tags: string[];
  chunkIndex: number;
}

export interface KnowledgeDocument {
  id: string;
  organizationId: string;
  title: string;
  category: 'visiting_hours' | 'admissions' | 'appointments' | 'billing_insurance' | 'diagnostics' | 'telehealth' | 'general_policy';
  filename: string;
  fileType: 'pdf' | 'txt' | 'md' | 'doc' | 'docx';
  fileSizeKb: number;
  uploadedBy: string;
  uploaderName: string;
  uploadedAt: string;
  status: 'indexed' | 'processing' | 'failed';
  chunkCount: number;
  rawContent: string;
  chunks: KnowledgeChunk[];
}

export interface Citation {
  documentId: string;
  documentTitle: string;
  sectionTitle: string;
  excerpt: string;
  confidenceScore: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  organizationId: string;
  senderRole: 'patient' | 'assistant' | 'agent' | 'system';
  senderName: string;
  content: string;
  citations?: Citation[];
  confidence?: number;
  isFallback?: boolean;
  isDemoSample?: boolean;
  isEmergencyAlert?: boolean;
  escalatedToTicketId?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  title: string;
  status: 'active' | 'resolved' | 'escalated';
  lastMessageSnippet: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface TicketReply {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'patient' | 'support_agent' | 'hospital_admin' | 'super_admin' | 'system';
  message: string;
  isInternalNote: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  organizationId: string;
  organizationName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  subject: string;
  description: string;
  category: 'Billing & Insurance' | 'Appointment' | 'Admission & Discharge' | 'Lab Reports & Diagnostics' | 'General Inquiry' | 'Technical Issue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_for_user' | 'resolved' | 'closed';
  assignedAgentId?: string;
  assignedAgentName?: string;
  escalatedAt?: string;
  escalatedBy?: string;
  sourceConversationId?: string;
  unresolvedAiQuery?: string;
  replies: TicketReply[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  organizationId?: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  timestamp: string;
}
