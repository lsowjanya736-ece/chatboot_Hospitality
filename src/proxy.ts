import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';

const publicPaths = new Set([
  '/',
  '/login',
  '/register',
  '/setup',
  '/forgot-password',
  '/reset-password',
  '/unauthorized',
]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (publicPaths.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('healthcare_token')?.value;
  const session = token ? verifyToken(token) : null;
  if (session) {
    const role = session.role;
    const isAdminArea = pathname === '/admin' || pathname.startsWith('/admin/');
    const isConversationHistory = pathname === '/chat/history';
    const allowed = role === 'super_admin'
      ? pathname === '/super-admin' || pathname.startsWith('/super-admin/') || isAdminArea || pathname === '/profile' || isConversationHistory
      : role === 'hospital_admin'
        ? (isAdminArea || pathname === '/profile' || isConversationHistory) && !pathname.startsWith('/super-admin')
        : role === 'support_agent'
          ? pathname === '/admin/tickets' || pathname === '/profile' || pathname === '/agent'
          : role === 'patient'
            ? pathname === '/chat' || pathname.startsWith('/chat/') || pathname === '/tickets' || pathname.startsWith('/tickets/') || pathname === '/profile'
            : false;

    if (allowed) return NextResponse.next();

    const unauthorizedUrl = new URL('/unauthorized', request.url);
    unauthorizedUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(unauthorizedUrl);
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', `${pathname}${search}`);
  const response = NextResponse.redirect(loginUrl);

  if (token) {
    response.cookies.delete('healthcare_token');
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
