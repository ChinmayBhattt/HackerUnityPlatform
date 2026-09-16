import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

const PROTECTED_PREFIXES = ['/dashboard', '/settings', '/host', '/admin'];
const AUTH_ROUTES = ['/login', '/signup'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Refresh session and get authenticated user
  const { supabaseResponse, user } = await updateSession(request);

  // Exclude public / semi-public invite links from protection
  const isExcluded =
    pathname.startsWith('/host/join') ||
    /\/host\/[^/]+\/admin\/join/.test(pathname);

  const isProtectedRoute =
    !isExcluded &&
    PROTECTED_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
  const isAuthRoute = AUTH_ROUTES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // If user is unauthenticated and attempting to access a protected route, redirect to /login
  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    const fullTarget = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set('redirectTo', fullTarget);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and visits /login or /signup, redirect to redirectTo or /dashboard
  if (isAuthRoute && user) {
    const rawRedirect =
      request.nextUrl.searchParams.get('redirectTo') ||
      request.nextUrl.searchParams.get('redirect');
    const safeTarget =
      rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
        ? rawRedirect
        : '/dashboard';
    const redirectUrl = new URL(safeTarget, request.nextUrl.origin);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export default proxy;

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
