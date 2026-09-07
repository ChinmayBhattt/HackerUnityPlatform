/**
 * In-memory sliding-window rate limiter for Next.js API routes.
 *
 * Uses a Map keyed by identifier (IP address, user ID, etc.) storing
 * an array of timestamps. On each call, expired entries are pruned.
 *
 * For production at scale, replace with Redis-backed rate limiting.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Prune stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const cutoff = now - windowMs * 2; // Extra margin
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

/**
 * Check whether a request identified by `key` is within the rate limit.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  cleanupStaleEntries(config.windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the current window
  const windowStart = now - config.windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0]!;
    const resetInMs = oldestInWindow + config.windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(resetInMs, 0),
    };
  }

  // Allow the request and record the timestamp
  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetInMs: config.windowMs,
  };
}

/**
 * Extract client IP from a Next.js request for use as a rate-limit key.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]!.trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '127.0.0.1';
}

// ─── Preset Configurations ──────────────────────────────────────────

/** Auth endpoints: 5 attempts per 15 minutes */
export const AUTH_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
};

/** Signup: 3 attempts per hour */
export const SIGNUP_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000,
};

/** Email sending: 5 per 15 minutes */
export const EMAIL_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
};

/** General API: 30 per minute */
export const API_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};
