/**
 * Simple in-memory TTL cache for MultiSEO.
 *
 * Uses a Map with expiration timestamps — same pattern as rate-limit.ts.
 * Adequate for single-instance deployment; can be upgraded to Redis later.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/** Clean up expired entries periodically. */
function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now >= entry.expiresAt) {
      store.delete(key);
    }
  }
}

/** Run cleanup every 5 minutes. */
setInterval(cleanup, 5 * 60_000).unref();

/** Retrieve a cached value. Returns undefined if missing or expired. */
export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() >= entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.data;
}

/** Store a value in the cache with a TTL in milliseconds. */
export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/** Remove a specific key from the cache. */
export function cacheDelete(key: string): void {
  store.delete(key);
}

/** Remove all entries matching a prefix. Useful for invalidation. */
export function cacheDeletePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}

/** Clear the entire cache. */
export function cacheClear(): void {
  store.clear();
}

/** Return the number of non-expired entries (for debugging). */
export function cacheSize(): number {
  const now = Date.now();
  let count = 0;
  for (const [, entry] of store) {
    if (now < entry.expiresAt) count++;
  }
  return count;
}
