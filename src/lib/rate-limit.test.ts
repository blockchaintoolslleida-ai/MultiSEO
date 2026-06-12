/**
 * Tests for in-memory rate limiter (rate-limit.ts).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createRateLimiter,
  loginRateLimiter,
  articleGenerateLimiter,
  lighthouseLimiter,
  telegramSendLimiter,
  geoScanLimiter,
} from "./rate-limit";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("first request for key returns allowed=true with remaining=maxRequests-1", () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
    const result = limiter("key-first");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.resetSeconds).toBeGreaterThan(0);
  });

  it("second request within window decrements remaining", () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
    const key = "key-second";

    limiter(key);
    const result = limiter(key);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3);
  });

  it("hitting the limit returns allowed=false with remaining=0", () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });
    const key = "key-limit";

    limiter(key); // 1
    limiter(key); // 2
    limiter(key); // 3
    const result = limiter(key); // 4th -- exceeds maxRequests

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("exceeding the limit stays blocked, resetSeconds > 0", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });
    const key = "key-exceed";

    limiter(key); // 1
    limiter(key); // 2
    limiter(key); // blocked

    const result = limiter(key); // still blocked

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.resetSeconds).toBeGreaterThan(0);
  });

  it("after window expires, allowed=true again and count resets", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });
    const key = "key-expire";

    limiter(key); // 1
    limiter(key); // 2 -- hit limit
    const blocked = limiter(key); // 3 -- blocked
    expect(blocked.allowed).toBe(false);

    // Advance past the window
    vi.advanceTimersByTime(60_001);

    const result = limiter(key);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("different keys do not interfere with each other", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });

    // Exhaust key1
    limiter("key1");
    limiter("key1");
    const blocked = limiter("key1");
    expect(blocked.allowed).toBe(false);

    // key2 should still be allowed
    const result = limiter("key2");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it("resetSeconds decreases as time passes", () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
    const key = "key-reset";

    const first = limiter(key);
    const initialReset = first.resetSeconds;

    // Advance 30 seconds
    vi.advanceTimersByTime(30_000);

    const later = limiter(key);
    expect(later.resetSeconds).toBeLessThan(initialReset);
  });

  it("resetSeconds is approximately windowMs/1000 on first request", () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
    const result = limiter("key-approx");

    expect(result.resetSeconds).toBe(60);
  });

  it("custom config with different maxRequests works", () => {
    const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });
    const result = limiter("key-custom-max");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("custom config with different windowMs works", () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 30_000 });
    const result = limiter("key-custom-win");

    expect(result.allowed).toBe(true);
    expect(result.resetSeconds).toBe(30);
  });
});

describe("Pre-configured limiters", () => {
  it("loginRateLimiter has maxRequests=5, windowMs=60_000", () => {
    const result = loginRateLimiter("login-test-key");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.resetSeconds).toBeGreaterThan(0);
  });

  it("articleGenerateLimiter has maxRequests=10, windowMs=60_000", () => {
    const result = articleGenerateLimiter("article-test-key");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
    expect(result.resetSeconds).toBeGreaterThan(0);
  });

  it("lighthouseLimiter has maxRequests=5, windowMs=60_000", () => {
    const result = lighthouseLimiter("lighthouse-test-key");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.resetSeconds).toBeGreaterThan(0);
  });

  it("telegramSendLimiter has maxRequests=20, windowMs=60_000", () => {
    const result = telegramSendLimiter("telegram-test-key");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(19);
    expect(result.resetSeconds).toBeGreaterThan(0);
  });

  it("geoScanLimiter has maxRequests=5, windowMs=60_000", () => {
    const result = geoScanLimiter("geoscan-test-key");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.resetSeconds).toBeGreaterThan(0);
  });
});
