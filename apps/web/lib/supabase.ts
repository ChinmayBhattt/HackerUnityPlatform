import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.error(
      '[Security Alert] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
  }
}

// 7-day session lifetime (604,800 seconds) - reduced from previous insecure 400 days
export const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * Standard Supabase browser client with secure 7-day cookie sessions.
 * LocalStorage cookie persistence is intentionally omitted to prevent sessions surviving logout/expiry.
 */
export const supabase = createBrowserClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    cookieOptions: {
      maxAge: COOKIE_MAX_AGE_SECONDS,
      sameSite: 'lax',
      path: '/',
    },
  }
);
