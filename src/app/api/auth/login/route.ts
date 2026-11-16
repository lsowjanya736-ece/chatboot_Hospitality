import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/storage';
import { signToken } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await dbStore.getUserByEmail(email);
    const passwordMatches = user?.password
      ? await bcrypt.compare(password, user.password)
      : false;
    if (!user || !passwordMatches) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }
    if (user.isActive === false) {
      return NextResponse.json({ error: 'This account is inactive. Contact your organization administrator.' }, { status: 403 });
    }
    if (user.role !== 'super_admin') {
      const organization = await dbStore.getOrganizationById(user.organizationId);
      if (!organization || !organization.activeStatus) {
        return NextResponse.json({ error: 'This organization is currently inactive. Contact your platform administrator.' }, { status: 403 });
      }
    }

    const token = signToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    const safeUser = { ...user };
    delete safeUser.password;

    await dbStore.addAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      details: `Successful login by ${user.name} (${user.role})`,
    });

    const response = NextResponse.json({
      success: true,
      user: safeUser,
    });
    response.cookies.set('healthcare_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ error: 'Unable to sign in right now' }, { status: 500 });
  }
}
