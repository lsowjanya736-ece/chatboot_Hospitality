import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/auth/authorization';
import { dbStore } from '@/lib/db/storage';
import type { Organization } from '@/lib/db/types';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authorization = await authorizeRequest(request, ['super_admin']);
  if (!authorization.authorized) return authorization.response;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const updates: Partial<Organization> = {};

    if (typeof body.activeStatus === 'boolean') updates.activeStatus = body.activeStatus;
    if (typeof body.slaHours !== 'undefined') {
      const slaHours = Number(body.slaHours);
      if (!Number.isInteger(slaHours) || slaHours < 1 || slaHours > 168) {
        return NextResponse.json({ error: 'SLA must be between 1 and 168 hours' }, { status: 400 });
      }
      updates.slaHours = slaHours;
    }
    if (typeof body.contactEmail !== 'undefined') {
      const contactEmail = typeof body.contactEmail === 'string' ? body.contactEmail.trim().toLowerCase() : '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
        return NextResponse.json({ error: 'Enter a valid contact email' }, { status: 400 });
      }
      updates.contactEmail = contactEmail;
    }
    if (typeof body.phone === 'string') updates.phone = body.phone.trim().slice(0, 40);
    if (typeof body.address === 'string') updates.address = body.address.trim().slice(0, 300);
    if (typeof body.website === 'string') updates.website = body.website.trim().slice(0, 200);

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid organization settings were provided' }, { status: 400 });
    }

    const updated = await dbStore.updateOrganization(id, updates);
    if (!updated) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    await dbStore.addAuditLog({
      organizationId: id,
      userId: authorization.user.userId,
      userName: authorization.user.name,
      userRole: authorization.user.role,
      action: 'UPDATE_ORGANIZATION',
      details: `Updated organization settings for ${updated.name}: ${Object.keys(updates).join(', ')}`,
    });

    return NextResponse.json({ success: true, organization: updated });
  } catch (error) {
    console.error('Organization settings update failed:', error);
    return NextResponse.json({ error: 'Unable to update organization settings right now' }, { status: 500 });
  }
}
