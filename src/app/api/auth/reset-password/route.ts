import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { dbStore } from '@/lib/db/storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === 'string' ? body.token : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return NextResponse.json({ error: 'This password reset link is invalid or expired' }, { status: 400 });
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: 'Password must be between 8 and 128 characters' }, { status: 400 });
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');
    const passwordHash = await bcrypt.hash(password, 12);
    const reset = await dbStore.consumePasswordResetToken(tokenHash, passwordHash);
    if (!reset) {
      return NextResponse.json({ error: 'This password reset link is invalid or expired' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset failed:', error);
    return NextResponse.json({ error: 'Unable to reset the password right now' }, { status: 500 });
  }
}
