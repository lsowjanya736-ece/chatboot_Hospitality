import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbStore } from '@/lib/db/storage';
import { signToken } from '@/lib/auth/jwt';

function matchesSecret(submitted: string, configured: string): boolean {
  const submittedBuffer = Buffer.from(submitted);
  const configuredBuffer = Buffer.from(configured);
  return submittedBuffer.length === configuredBuffer.length && timingSafeEqual(submittedBuffer, configuredBuffer);
}

export async function POST(request: NextRequest) {
  const configuredEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const configuredPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!configuredEmail || !configuredPassword) {
    return NextResponse.json({ error: 'Platform bootstrap is not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (email !== configuredEmail || !matchesSecret(password, configuredPassword)) {
      return NextResponse.json({ error: 'Invalid bootstrap credentials' }, { status: 401 });
    }
    if (password.length < 12 || password.length > 128) {
      return NextResponse.json({ error: 'Bootstrap password must contain at least 12 characters' }, { status: 400 });
    }
    if ((await dbStore.getUsers('all')).length > 0) {
      return NextResponse.json({ error: 'Platform setup has already been completed' }, { status: 409 });
    }

    const user = await dbStore.createUser({
      name: 'Platform Administrator',
      email,
      password: await bcrypt.hash(password, 12),
      role: 'super_admin',
      organizationId: 'all',
      organizationName: 'Platform Administration',
      department: 'Platform Operations',
    });
    const token = signToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });
    await dbStore.addAuditLog({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'BOOTSTRAP_PLATFORM',
      details: 'Created the initial platform administrator',
    });

    const safeUser = { ...user };
    delete safeUser.password;
    const response = NextResponse.json({ success: true, user: safeUser }, { status: 201 });
    response.cookies.set('healthcare_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    console.error('Platform bootstrap failed:', error);
    return NextResponse.json({ error: 'Unable to set up the platform right now' }, { status: 500 });
  }
}
