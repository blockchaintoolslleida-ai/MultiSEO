/**
 * Simple in-memory rate limiter for MultiSEO API routes.
 *
 * Uses a sliding-window approach with a Map keyed by identifier (IP or tenant).
 * Adequate for single-instance deployment; can be upgraded to Redis later.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Maximum number of requests allowed within the window. */
  maxRequests: number;
  /** Time window in milliseconds. */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets. */
  resetSeconds: number;
}

const store = new Map<string, RateLimitEntry>();

/** Clean up expired entries periodically. */
function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

/** Run cleanup every 60 seconds. */
setInterval(cleanup, 60_000).unref();

/**
 * Create a rate limiter with the given config.
 * Returns a function that checks if a request identified by `key` is allowed.
 */
export function createRateLimiter(config: RateLimitConfig) {
  return function check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = store.get(key);

    // First request or window expired — reset
    if (!entry || now >= entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + config.windowMs });
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetSeconds: Math.ceil(config.windowMs / 1000),
      };
    }

    entry.count++;

    if (entry.count > config.maxRequests) {
      const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);
      return { allowed: false, remaining: 0, resetSeconds };
    }

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  };
}

// ---- Pre-configured rate limiters for specific endpoints ----

/** Login endpoint: 5 attempts per minute per IP. */
export const loginRateLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60_000,
});

/** Article generation: 10 per minute per tenant. */
export const articleGenerateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60_000,
});

/** Lighthouse audit: 5 per minute per IP. */
export const lighthouseLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60_000,
});

/** Telegram send: 20 per minute per tenant. */
export const telegramSendLimiter = createRateLimiter({
  maxRequests: 20,
  windowMs: 60_000,
});

/** Telegram listen: 10 per minute per IP. */
export const telegramListenLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60_000,
});

/** Keywords scrape: 10 per minute per tenant. */
export const keywordsScrapeLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60_000,
});

/** GEO scan: 5 per minute per tenant. */
export const geoScanLimiter = createRateLimiter({
  maxRequests: 5,
  windowMs: 60_000,
});
