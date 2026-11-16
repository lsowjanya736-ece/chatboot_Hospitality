import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/storage';
import { getSessionUser } from '@/lib/auth/jwt';
import type { TokenPayload } from '@/lib/auth/jwt';

type AuthorizationResult =
  | { authorized: true; user: TokenPayload }
  | { authorized: false; response: NextResponse };

export async function authorizeRequest(
  request: NextRequest,
  allowedRoles?: TokenPayload['role'][]
): Promise<AuthorizationResult> {
  const session = getSessionUser(request);
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }

  const storedUser = await dbStore.getUserById(session.userId);
  if (!storedUser) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    };
  }
  if (storedUser.isActive === false) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'This account is inactive. Contact your organization administrator.' }, { status: 403 }),
    };
  }

  const user: TokenPayload = {
    userId: storedUser.id,
    name: storedUser.name,
    email: storedUser.email,
    role: storedUser.role,
    organizationId: storedUser.organizationId,
  };
  if (user.role !== 'super_admin') {
    const organization = await dbStore.getOrganizationById(user.organizationId);
    if (!organization || !organization.activeStatus) {
      return {
        authorized: false,
        response: NextResponse.json({ error: 'This organization is inactive. Contact your platform administrator.' }, { status: 403 }),
      };
    }
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }),
    };
  }

  return { authorized: true, user };
}
