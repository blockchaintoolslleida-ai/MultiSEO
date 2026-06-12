/**
 * Tests for auth utilities (auth.ts).
 */
import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import {
  signSession,
  verifySession,
  sessionCookieHeader,
  SESSION_COOKIE,
  type Session,
} from "./auth";

const SAMPLE_SESSION: Session = {
  tenantId: "tenant-1",
  tenantSlug: "test-tenant",
  tenantName: "Test Tenant",
};

beforeAll(() => {
  process.env.SESSION_SECRET = "test-secret-thats-long-enough-123";
});

describe("signSession", () => {
  it("returns a string with format payload.signature", async () => {
    const token = await signSession(SAMPLE_SESSION);
    expect(typeof token).toBe("string");
    const parts = token.split(".");
    expect(parts).toHaveLength(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });

  it("different sessions produce different tokens", async () => {
    const token1 = await signSession(SAMPLE_SESSION);
    const token2 = await signSession({
      tenantId: "tenant-2",
      tenantSlug: "other-tenant",
      tenantName: "Other Tenant",
    });
    expect(token1).not.toBe(token2);
  });
});

describe("verifySession", () => {
  it("returns the original session for a valid token", async () => {
    const token = await signSession(SAMPLE_SESSION);
    const session = await verifySession(token);
    expect(session).not.toBeNull();
    expect(session!.tenantId).toBe(SAMPLE_SESSION.tenantId);
    expect(session!.tenantSlug).toBe(SAMPLE_SESSION.tenantSlug);
    expect(session!.tenantName).toBe(SAMPLE_SESSION.tenantName);
  });

  it("returns null for a tampered payload", async () => {
    const token = await signSession(SAMPLE_SESSION);
    const parts = token.split(".");
    // Tamper the first character of the payload (always changes decoded bytes).
    const tamperedPayload = parts[0][0] === "A" ? "B" + parts[0].slice(1) : "A" + parts[0].slice(1);
    const tamperedToken = `${tamperedPayload}.${parts[1]}`;
    const result = await verifySession(tamperedToken);
    expect(result).toBeNull();
  });

  it("returns null for a tampered signature", async () => {
    const token = await signSession(SAMPLE_SESSION);
    const parts = token.split(".");
    // Tamper the first character of the signature (always changes decoded bytes).
    // The last base64url char of a 32-byte HMAC contributes only 2 bits
    // and flipping between A (0) and B (1) does not change decoded output.
    const tamperedSig = parts[1][0] === "A" ? "B" + parts[1].slice(1) : "A" + parts[1].slice(1);
    const tamperedToken = `${parts[0]}.${tamperedSig}`;
    const result = await verifySession(tamperedToken);
    expect(result).toBeNull();
  });

  it("returns null for input without a dot separator", async () => {
    const result = await verifySession("not-a-valid-token");
    expect(result).toBeNull();
  });

  it("returns null for empty string", async () => {
    const result = await verifySession("");
    expect(result).toBeNull();
  });

  it("returns null for input with more than two dot-separated parts", async () => {
    const result = await verifySession("a.b.c");
    expect(result).toBeNull();
  });
});

describe("sessionCookieHeader", () => {
  const TOKEN = "payload.signature";

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("includes cookie name, HttpOnly, SameSite, Path, and Max-Age", () => {
    const header = sessionCookieHeader(TOKEN);
    expect(header).toContain(`${SESSION_COOKIE}=${TOKEN}`);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Path=/");
    expect(header).toContain("Max-Age=604800");
  });

  it("with clear=true sets Max-Age=0 and empty cookie value", () => {
    const header = sessionCookieHeader(TOKEN, true);
    expect(header).toContain(`${SESSION_COOKIE}=`);
    expect(header).toContain("Max-Age=0");
  });

  it("with clear=false includes the token", () => {
    const header = sessionCookieHeader(TOKEN, false);
    expect(header).toContain(`${SESSION_COOKIE}=${TOKEN}`);
  });

  it("includes Secure flag when NODE_ENV is production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const header = sessionCookieHeader(TOKEN);
    expect(header).toContain("Secure");
  });

  it("does NOT include Secure flag in non-production environment", () => {
    const header = sessionCookieHeader(TOKEN);
    expect(header).not.toContain("Secure");
  });

  it("in production with clear=true includes both Secure and Max-Age=0", () => {
    vi.stubEnv("NODE_ENV", "production");
    const header = sessionCookieHeader(TOKEN, true);
    expect(header).toContain("Secure");
    expect(header).toContain("Max-Age=0");
    expect(header).toContain(`${SESSION_COOKIE}=`);
  });
});
