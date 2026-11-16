import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/storage';
import { authorizeRequest } from '@/lib/auth/authorization';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authorization = await authorizeRequest(req, ['patient', 'hospital_admin', 'super_admin']);
  if (!authorization.authorized) {
    return authorization.response;
  }
  const { id } = await context.params;
  const organizationId = authorization.user.role === 'super_admin'
    ? 'all'
    : authorization.user.organizationId;
  const conv = await dbStore.getConversationById(id, organizationId);

  if (!conv || (authorization.user.role === 'patient' && conv.userId !== authorization.user.userId)) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const messages = await dbStore.getMessages(id);
  return NextResponse.json({ success: true, conversation: conv, messages });
}
