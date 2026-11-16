import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/storage';
import { authorizeRequest } from '@/lib/auth/authorization';
import type { SupportTicket } from '@/lib/db/types';

const ticketCategories: SupportTicket['category'][] = [
  'Billing & Insurance',
  'Appointment',
  'Admission & Discharge',
  'Lab Reports & Diagnostics',
  'General Inquiry',
  'Technical Issue',
];

export async function GET(req: NextRequest) {
  const authorization = await authorizeRequest(req);
  if (!authorization.authorized) {
    return authorization.response;
  }
  const { user } = authorization;
  const requestedOrg = req.nextUrl.searchParams.get('organizationId');
  const orgId = user.role === 'super_admin'
    ? requestedOrg || 'all'
    : user.organizationId;

  const tickets = await dbStore.getTickets(orgId, user.role, user.userId);
  const visibleTickets = user.role === 'patient'
    ? tickets.map((ticket) => ({
        ...ticket,
        replies: ticket.replies.filter((reply) => !reply.isInternalNote),
      }))
    : tickets;
  return NextResponse.json({ success: true, tickets: visibleTickets });
}

export async function POST(req: NextRequest) {
  try {
    const authorization = await authorizeRequest(req, ['patient']);
    if (!authorization.authorized) {
      return authorization.response;
    }
    const { user } = authorization;
    const body = await req.json();
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const requestedOrg = typeof body.organizationId === 'string' ? body.organizationId : '';
    const category = ticketCategories.includes(body.category) ? body.category : 'General Inquiry';

    if (!subject || subject.length > 200 || !description || description.length > 10_000) {
      return NextResponse.json({ error: 'Subject and description are required and must be within the allowed length' }, { status: 400 });
    }

    const orgId = user.role === 'super_admin' ? requestedOrg : user.organizationId;
    if (!orgId || (user.role !== 'super_admin' && requestedOrg && requestedOrg !== user.organizationId)) {
      return NextResponse.json({ error: 'Invalid organization' }, { status: 403 });
    }
    const org = await dbStore.getOrganizationById(orgId);
    if (!org || !org.activeStatus) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    if (typeof body.sourceConversationId === 'string') {
      const sourceConversation = await dbStore.getConversationById(body.sourceConversationId, orgId);
      if (!sourceConversation || (user.role === 'patient' && sourceConversation.userId !== user.userId)) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
    }

    const newTicket = await dbStore.createTicket({
      organizationId: orgId,
      organizationName: org.name,
      userId: user.userId,
      userName: user.name,
      userEmail: user.email,
      subject,
      description,
      category,
      priority: 'medium',
      status: 'open',
      sourceConversationId: typeof body.sourceConversationId === 'string' ? body.sourceConversationId : undefined,
      unresolvedAiQuery: typeof body.unresolvedAiQuery === 'string' ? body.unresolvedAiQuery : undefined,
    });

    await dbStore.addAuditLog({
      organizationId: orgId,
      userId: user.userId,
      userName: user.name,
      userRole: user.role,
      action: 'CREATE_TICKET',
      details: `Created Ticket #${newTicket.id}: ${newTicket.subject}`,
    });

    return NextResponse.json({ success: true, ticket: newTicket }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create ticket', details: String(error) }, { status: 500 });
  }
}
