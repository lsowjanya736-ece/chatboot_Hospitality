import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/storage';

const genericMessage = 'If an account exists for that email, password reset instructions will be sent.';

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const appUrl = process.env.APP_URL;
  if (!apiKey || !from || !appUrl) {
    return NextResponse.json({ error: 'Password recovery is not configured for this deployment' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 });
    }

    const user = await dbStore.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ success: true, message: genericMessage });
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await dbStore.createPasswordResetToken(user.id, tokenHash, expiresAt);

    const resetUrl = new URL('/reset-password', appUrl);
    resetUrl.searchParams.set('token', token);
    const escapedName = user.name.replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[character] || character);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [user.email],
        subject: 'Reset your MediCareRAG password',
        html: `<p>Hello ${escapedName},</p><p>Use the link below to choose a new password. It expires in 30 minutes and can only be used once.</p><p><a href="${resetUrl.toString()}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
        text: `Hello ${user.name},\n\nReset your password using this one-time link (expires in 30 minutes):\n${resetUrl.toString()}\n\nIf you did not request this, you can ignore this email.`,
      }),
    });
    if (!response.ok) {
      console.error('Password reset email delivery failed with status:', response.status);
      return NextResponse.json({ error: 'Unable to send password reset email right now' }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: genericMessage });
  } catch (error) {
    console.error('Password reset request failed:', error);
    return NextResponse.json({ error: 'Unable to process the password reset request' }, { status: 500 });
  }
}
