/**
 * Server-side authentication helpers for Next.js API Route Handlers.
 *
 * - authenticateRequest: validates the caller's Supabase session from cookies
 * - createAdminClient: creates a Supabase client with the service role key (fail-fast if missing)
 */

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

// ─── Environment validation ─────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[Security] Missing required environment variable: ${name}. ` +
        `Set it in .env.local or your deployment environment.`
    );
  }
  return value;
}

function getSupabaseUrl(): string {
  return requireEnv('NEXT_PUBLIC_SUPABASE_URL');
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error(
      '[Security] Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Set it in .env.local or your deployment environment.'
    );
  }
  return key;
}

function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      '[Security] Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY. ' +
        'This is a server-only secret. Never expose it to the frontend.'
    );
  }
  return key;
}

// ─── Admin Client (service role — bypasses RLS) ─────────────────────

let _adminClient: SupabaseClient<any, any, any> | null = null;

/**
 * Returns a Supabase client with the service role key.
 * This client bypasses RLS — use only in server-side API routes.
 */
export function createAdminClient(): SupabaseClient<any, any, any> {
  if (_adminClient) return _adminClient;

  _adminClient = createSupabaseClient<any>(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _adminClient;
}

// ─── Request Authentication ─────────────────────────────────────────

export interface AuthenticatedUser {
  user: User;
  userId: string;
  email: string;
}

/**
 * Authenticate an incoming API request by validating the Supabase session
 * from HTTP-only cookies.
 *
 * Returns the authenticated user on success, or null if not authenticated.
 */
export async function authenticateRequest(req?: Request): Promise<AuthenticatedUser | null> {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — can be ignored when middleware refreshes sessions
          }
        },
      },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!error && user) {
      return {
        user,
        userId: user.id,
        email: user.email || '',
      };
    }

    // Fallback: check Authorization Bearer token if request was passed
    if (req) {
      const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        const admin = createAdminClient();
        const { data: tokenUser, error: tokenErr } = await admin.auth.getUser(token);
        if (!tokenErr && tokenUser?.user) {
          return {
            user: tokenUser.user,
            userId: tokenUser.user.id,
            email: tokenUser.user.email || '',
          };
        }
      }
    }

    return null;
  } catch (err) {
    console.error('[api-auth] Authentication error:', err);
    return null;
  }
}

/**
 * Returns a 401 JSON response for unauthenticated requests.
 */
export function unauthorizedResponse(message = 'Authentication required') {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Returns a 403 JSON response for unauthorized (insufficient permissions) requests.
 */
export function forbiddenResponse(message = 'Insufficient permissions') {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Returns a 429 JSON response for rate-limited requests.
 */
export function rateLimitedResponse(retryAfterMs: number) {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  return NextResponse.json(
    { error: `Too many requests. Please try again in ${retryAfterSec} seconds.` },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSec),
      },
    }
  );
}
