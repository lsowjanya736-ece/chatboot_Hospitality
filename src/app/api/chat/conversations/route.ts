import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/storage';
import { authorizeRequest } from '@/lib/auth/authorization';

export async function GET(req: NextRequest) {
  const authorization = await authorizeRequest(req, ['patient', 'hospital_admin', 'super_admin']);
  if (!authorization.authorized) {
    return authorization.response;
  }
  const { user } = authorization;
  const requestedOrg = req.nextUrl.searchParams.get('organizationId');
  const orgId = user.role === 'super_admin' ? requestedOrg || 'all' : user.organizationId;
  const userId = user.role === 'patient' ? user.userId : undefined;

  const conversations = await dbStore.getConversations(orgId, userId);
  return NextResponse.json({ success: true, conversations });
}

export async function POST(req: NextRequest) {
  try {
    const authorization = await authorizeRequest(req, ['patient']);
    if (!authorization.authorized) {
      return authorization.response;
    }
    const { user } = authorization;
    const body = await req.json();
    const orgId = user.organizationId;
    const userId = user.userId;
    const userName = user.name;

    if (typeof body.title !== 'undefined' && (typeof body.title !== 'string' || body.title.length > 200)) {
      return NextResponse.json({ error: 'Invalid conversation title' }, { status: 400 });
    }

    const conv = await dbStore.createConversation({
      organizationId: orgId,
      userId,
      userName,
      title: typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'New Support Conversation',
      status: 'active',
      lastMessageSnippet: 'Session started',
    });

    return NextResponse.json({ success: true, conversation: conv }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create conversation', details: String(error) }, { status: 500 });
  }
}
