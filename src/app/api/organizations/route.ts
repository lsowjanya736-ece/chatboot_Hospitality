import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/storage';
import { authorizeRequest } from '@/lib/auth/authorization';

export async function GET(req: NextRequest) {
  const authorization = await authorizeRequest(req, ['super_admin']);
  const organizations = await dbStore.getOrganizations();
  if (authorization.authorized) {
    return NextResponse.json({ success: true, organizations });
  }
  const publicOrganizations = organizations
    .filter((organization) => organization.activeStatus)
    .map(({ id, name, type, activeStatus }) => ({ id, name, type, activeStatus }));
  return NextResponse.json({ success: true, organizations: publicOrganizations });
}

export async function POST(req: NextRequest) {
  try {
    const authorization = await authorizeRequest(req, ['super_admin']);
    if (!authorization.authorized) {
      return authorization.response;
    }
    const session = authorization.user;

    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const contactEmail = typeof body.contactEmail === 'string' ? body.contactEmail.trim().toLowerCase() : '';
    const allowedTypes = ['hospital', 'clinic', 'diagnostic', 'telehealth'] as const;
    const type = allowedTypes.find((value) => value === body.type) || 'hospital';
    const slaHours = body.slaHours === undefined ? 4 : Number(body.slaHours);
    if (
      name.length < 2 ||
      name.length > 120 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) ||
      !Number.isInteger(slaHours) ||
      slaHours < 1 ||
      slaHours > 168
    ) {
      return NextResponse.json({ error: 'Enter a valid organization name, contact email, and SLA from 1 to 168 hours.' }, { status: 400 });
    }

    const newOrg = await dbStore.createOrganization({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      type,
      contactEmail,
      phone: typeof body.phone === 'string' ? body.phone.trim().slice(0, 40) : '',
      address: typeof body.address === 'string' ? body.address.trim().slice(0, 300) : '',
      website: typeof body.website === 'string' ? body.website.trim().slice(0, 200) : '',
      slaHours,
      activeStatus: true,
      departments: Array.isArray(body.departments)
        ? body.departments.filter((department: unknown): department is string => typeof department === 'string').slice(0, 50)
        : [],
      emergencyContact: typeof body.emergencyContact === 'string' ? body.emergencyContact.trim().slice(0, 200) : '',
    });

    await dbStore.addAuditLog({
      organizationId: newOrg.id,
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      action: 'CREATE_ORGANIZATION',
      details: `Created new healthcare tenant: ${newOrg.name} (${newOrg.type})`,
    });

    return NextResponse.json({ success: true, organization: newOrg }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create organization', details: String(error) }, { status: 500 });
  }
}
