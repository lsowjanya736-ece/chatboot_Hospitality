import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/storage';
import { signToken } from '@/lib/auth/jwt';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const organizationId = typeof body.organizationId === 'string' ? body.organizationId : '';
    const department = typeof body.department === 'string' ? body.department.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';

    if (name.length < 2 || name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid name and email address' }, { status: 400 });
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'Password must be between 8 and 128 characters' }, { status: 400 });
    }
    if (!organizationId) {
      return NextResponse.json({ error: 'Choose an organization' }, { status: 400 });
    }

    const existing = await dbStore.getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Unable to create account with those details' }, { status: 409 });
    }

    const org = await dbStore.getOrganizationById(organizationId);
    if (!org || !org.activeStatus) {
      return NextResponse.json({ error: 'Choose an active organization' }, { status: 400 });
    }

    const newUser = await dbStore.createUser({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role: 'patient',
      organizationId,
      organizationName: org.name,
      department: department || 'General',
      phone,
    });

    const token = signToken({
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      organizationId: newUser.organizationId,
    });

    const safeUser = { ...newUser };
    delete safeUser.password;

    await dbStore.addAuditLog({
      organizationId: newUser.organizationId,
      userId: newUser.id,
      userName: newUser.name,
      userRole: newUser.role,
      action: 'USER_REGISTER',
      details: `Registered account: ${newUser.name} with role ${newUser.role}`,
    });

    const response = NextResponse.json({
      success: true,
      user: safeUser,
    }, { status: 201 });
    response.cookies.set('healthcare_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error('Registration failed:', error);
    return NextResponse.json({ error: 'Unable to create the account right now' }, { status: 500 });
  }
}
