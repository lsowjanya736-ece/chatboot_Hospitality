import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/storage';
import { authorizeRequest } from '@/lib/auth/authorization';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const authorization = await authorizeRequest(req, ['super_admin', 'hospital_admin']);
  if (!authorization.authorized) {
    return authorization.response;
  }
  const { user } = authorization;
  const requestedOrg = req.nextUrl.searchParams.get('organizationId');
  const orgId = user.role === 'super_admin'
    ? requestedOrg || 'all'
    : user.organizationId;
  const users = await dbStore.getUsers(orgId);
  return NextResponse.json({ success: true, users });
}

export async function POST(req: NextRequest) {
  const authorization = await authorizeRequest(req, ['super_admin', 'hospital_admin']);
  if (!authorization.authorized) {
    return authorization.response;
  }

  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = body.role;

    if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid name and email address' }, { status: 400 });
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'Password must be between 8 and 128 characters' }, { status: 400 });
    }
    if (role !== 'support_agent' && !(role === 'hospital_admin' && authorization.user.role === 'super_admin')) {
      return NextResponse.json({ error: 'That role cannot be assigned' }, { status: 403 });
    }
    if (await dbStore.getUserByEmail(email)) {
      return NextResponse.json({ error: 'Unable to create account with those details' }, { status: 409 });
    }

    const organizationId = authorization.user.role === 'super_admin'
      ? body.organizationId
      : authorization.user.organizationId;
    if (typeof organizationId !== 'string') {
      return NextResponse.json({ error: 'Choose an organization' }, { status: 400 });
    }
    const organization = await dbStore.getOrganizationById(organizationId);
    if (!organization || !organization.activeStatus) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const createdUser = await dbStore.createUser({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role,
      organizationId,
      organizationName: organization.name,
      department: typeof body.department === 'string' ? body.department.trim() : 'Support',
      phone: typeof body.phone === 'string' ? body.phone.trim() : '',
    });
    const safeUser = { ...createdUser };
    delete safeUser.password;

    await dbStore.addAuditLog({
      organizationId,
      userId: authorization.user.userId,
      userName: authorization.user.name,
      userRole: authorization.user.role,
      action: 'CREATE_USER',
      details: `Created ${role} account for ${email}`,
    });
    return NextResponse.json({ success: true, user: safeUser }, { status: 201 });
  } catch (error) {
    console.error('User creation failed:', error);
    return NextResponse.json({ error: 'Unable to create user right now' }, { status: 500 });
  }
}
