import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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

export async function GET(request: NextRequest) {
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

  const redirectUrl = `${targetBase}${safeNext}`;
  const response = NextResponse.redirect(redirectUrl);

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (code && supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('[OAuth Callback] Code exchange error:', error.message);
      }
    }
  } catch (err: any) {
    console.error('[OAuth Callback] Exception in callback route:', err);
  }

  return response;
}
