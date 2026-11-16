import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/storage';
import { authorizeRequest } from '@/lib/auth/authorization';
import type { SupportTicket, TicketReply } from '@/lib/db/types';

const ticketStatuses: SupportTicket['status'][] = [
  'open',
  'in_progress',
  'waiting_for_user',
  'resolved',
  'closed',
];
const ticketPriorities: SupportTicket['priority'][] = ['low', 'medium', 'high', 'urgent'];

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authorization = await authorizeRequest(req);
  if (!authorization.authorized) {
    return authorization.response;
  }
  const { id } = await context.params;
  const organizationId = authorization.user.role === 'super_admin'
    ? 'all'
    : authorization.user.organizationId;
  const ticket = await dbStore.getTicketById(id, organizationId);
  if (!ticket || (authorization.user.role === 'patient' && ticket.userId !== authorization.user.userId)) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }
  if (authorization.user.role === 'support_agent' && ticket.assignedAgentId !== authorization.user.userId) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  const visibleTicket = authorization.user.role === 'patient'
    ? { ...ticket, replies: ticket.replies.filter((reply) => !reply.isInternalNote) }
    : ticket;
  return NextResponse.json({ success: true, ticket: visibleTicket });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authorization = await authorizeRequest(req, ['support_agent', 'hospital_admin', 'super_admin']);
  if (!authorization.authorized) {
    return authorization.response;
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const organizationId = authorization.user.role === 'super_admin'
      ? 'all'
      : authorization.user.organizationId;
    const ticket = await dbStore.getTicketById(id, organizationId);
    if (!ticket || (authorization.user.role === 'support_agent' && ticket.assignedAgentId !== authorization.user.userId)) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    const updates: Partial<SupportTicket> = {};

    if (body.escalate === true) {
      if (ticket.status === 'resolved' || ticket.status === 'closed') {
        return NextResponse.json({ error: 'Resolved tickets cannot be escalated' }, { status: 409 });
      }
      updates.escalatedAt = new Date().toISOString();
      updates.escalatedBy = authorization.user.name;
      updates.priority = 'urgent';
      if (ticket.status === 'open' || ticket.status === 'waiting_for_user') updates.status = 'in_progress';
    }

    if (typeof body.status !== 'undefined') {
      if (!ticketStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid ticket status' }, { status: 400 });
      }
      updates.status = body.status;
    }
    if (typeof body.priority !== 'undefined') {
      if (!ticketPriorities.includes(body.priority)) {
        return NextResponse.json({ error: 'Invalid ticket priority' }, { status: 400 });
      }
      updates.priority = body.priority;
    }
    if (typeof body.assignedAgentId !== 'undefined') {
      if (authorization.user.role === 'support_agent') {
        return NextResponse.json({ error: 'Only administrators can reassign tickets' }, { status: 403 });
      }
      if (typeof body.assignedAgentId !== 'string' || !body.assignedAgentId) {
        return NextResponse.json({ error: 'A valid agent is required' }, { status: 400 });
      }
      const agent = await dbStore.getUserById(body.assignedAgentId);
      if (!agent || agent.role !== 'support_agent' || agent.isActive === false) {
        return NextResponse.json({ error: 'Support agent not found' }, { status: 404 });
      }
      if (agent.organizationId !== ticket.organizationId) {
        return NextResponse.json({ error: 'Agent must belong to the ticket organization' }, { status: 403 });
      }
      updates.assignedAgentId = agent.id;
      updates.assignedAgentName = agent.name;
    }

    const updated = await dbStore.updateTicket(id, updates, organizationId);
    if (!updated) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    await dbStore.addAuditLog({
      organizationId: updated.organizationId,
      userId: authorization.user.userId,
      userName: authorization.user.name,
      userRole: authorization.user.role,
      action: body.escalate === true ? 'ESCALATE_TICKET' : 'UPDATE_TICKET',
      details: body.escalate === true ? `Escalated ticket ${id} to urgent priority` : `Updated ticket ${id}`,
    });
    return NextResponse.json({ success: true, ticket: updated });
  } catch (error) {
    console.error('Ticket update failed:', error);
    return NextResponse.json({ error: 'Unable to update ticket right now' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authorization = await authorizeRequest(req);
  if (!authorization.authorized) {
    return authorization.response;
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message || message.length > 10_000) {
      return NextResponse.json({ error: 'Reply must contain between 1 and 10,000 characters' }, { status: 400 });
    }
    const organizationId = authorization.user.role === 'super_admin'
      ? 'all'
      : authorization.user.organizationId;
    const ticket = await dbStore.getTicketById(id, organizationId);
    if (!ticket || (authorization.user.role === 'patient' && ticket.userId !== authorization.user.userId)) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    if (authorization.user.role === 'support_agent' && ticket.assignedAgentId !== authorization.user.userId) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const staffRoles = ['support_agent', 'hospital_admin', 'super_admin'];
    const isStaff = staffRoles.includes(authorization.user.role);
    if (body.isInternalNote === true && !isStaff) {
      return NextResponse.json({ error: 'Only support staff can add internal notes' }, { status: 403 });
    }

    const senderRole: TicketReply['senderRole'] = authorization.user.role === 'super_admin'
      ? 'super_admin'
      : authorization.user.role;
    const reply = await dbStore.addTicketReply(
      id,
      {
        senderId: authorization.user.userId,
        senderName: authorization.user.name,
        senderRole,
        message,
        isInternalNote: isStaff && body.isInternalNote === true,
      },
      organizationId
    );
    if (!reply) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (isStaff && ticket.status === 'open') {
      await dbStore.updateTicket(id, { status: 'in_progress' }, organizationId);
    }
    return NextResponse.json({ success: true, reply }, { status: 201 });
  } catch (error) {
    console.error('Ticket reply failed:', error);
    return NextResponse.json({ error: 'Unable to add reply right now' }, { status: 500 });
  }
}
