import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

/**
 * Validates the redirect target to prevent open redirect vulnerabilities.
 * Ensures the destination is a local, relative path and not an external URL.
 */
function getSafeRedirectPath(target: string | null): string {
  if (!target) return '/dashboard';

  // Must start with '/' and not '//' (protocol-relative URL) or contain backslashes
  if (target.startsWith('/') && !target.startsWith('//') && !target.includes('\\')) {
    return target;
  }

  return '/dashboard';
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const safeNext = getSafeRedirectPath(searchParams.get('next'));

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const isLocalEnv = process.env.NODE_ENV === 'development';
  const targetBase = isLocalEnv
    ? origin
    : forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : origin || process.env.NEXT_PUBLIC_APP_URL || 'https://hackersunity.com';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${targetBase}${safeNext}`);
    } else {
      console.error('[OAuth Callback] Code exchange error:', error.message);
    }
  }

  // Fallback redirect
  return NextResponse.redirect(`${targetBase}${safeNext}`);
}
