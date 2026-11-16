import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/jwt';
import { dbStore } from '@/lib/db/storage';

export async function GET(req: NextRequest) {
  const session = getSessionUser(req);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = await dbStore.getUserById(session.userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (user.isActive === false) {
    const response = NextResponse.json({ error: 'This account is inactive' }, { status: 403 });
    response.cookies.delete('healthcare_token');
    return response;
  }
  if (user.role !== 'super_admin') {
    const organization = await dbStore.getOrganizationById(user.organizationId);
    if (!organization || !organization.activeStatus) {
      return NextResponse.json({ error: 'This organization is inactive' }, { status: 403 });
    }
  }

  const safeUser = { ...user };
  delete safeUser.password;
  return NextResponse.json({ success: true, user: safeUser });
}
