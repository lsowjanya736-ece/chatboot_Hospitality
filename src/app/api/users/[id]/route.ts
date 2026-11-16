import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/auth/authorization';
import { dbStore } from '@/lib/db/storage';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authorization = await authorizeRequest(request, ['hospital_admin', 'super_admin']);
  if (!authorization.authorized) return authorization.response;

  try {
    const { id } = await context.params;
    const body = await request.json();
    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json({ error: 'Account status must be active or inactive' }, { status: 400 });
    }
    if (id === authorization.user.userId) {
      return NextResponse.json({ error: 'You cannot change your own account access' }, { status: 403 });
    }

    const target = await dbStore.getUserById(id);
    if (!target || target.role === 'super_admin') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (authorization.user.role !== 'super_admin' && target.organizationId !== authorization.user.organizationId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updated = await dbStore.updateUser(id, { isActive: body.isActive }, target.organizationId);
    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const safeUser = { ...updated };
    delete safeUser.password;

    await dbStore.addAuditLog({
      organizationId: target.organizationId,
      userId: authorization.user.userId,
      userName: authorization.user.name,
      userRole: authorization.user.role,
      action: body.isActive ? 'ACTIVATE_USER' : 'SUSPEND_USER',
      details: `${body.isActive ? 'Reactivated' : 'Suspended'} account ${target.email}`,
    });
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('User access update failed:', error);
    return NextResponse.json({ error: 'Unable to update account access right now' }, { status: 500 });
  }
}
