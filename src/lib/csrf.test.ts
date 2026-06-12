/**
 * Tests for CSRF protection utilities (csrf.ts).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { generateCsrfToken, csrfCookieHeader, CSRF_COOKIE } from "./csrf";

describe("generateCsrfToken", () => {
  it("returns a Promise<string>", async () => {
    const result = generateCsrfToken();
    expect(result).toBeInstanceOf(Promise);
    const token = await result;
    expect(typeof token).toBe("string");
  });

  it("token is a non-empty string", async () => {
    const token = await generateCsrfToken();
    expect(token.length).toBeGreaterThan(0);
  });

  it("token contains only base64url characters [A-Za-z0-9_-]", async () => {
    const token = await generateCsrfToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("token has no = padding (base64url strips it)", async () => {
    const token = await generateCsrfToken();
    expect(token).not.toContain("=");
  });

  it("two sequential calls return different tokens", async () => {
    const token1 = await generateCsrfToken();
    const token2 = await generateCsrfToken();
    expect(token1).not.toBe(token2);
  });

  it("token length is 43 characters (32 bytes -> 43 base64 chars)", async () => {
    const token = await generateCsrfToken();
    expect(token.length).toBe(43);
  });
});

describe("csrfCookieHeader", () => {
  const TOKEN = "test-csrf-token";

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("non-production: contains cookie=TOKEN, Path=/, SameSite=Lax, Max-Age=604800", () => {
    const header = csrfCookieHeader(TOKEN);
    expect(header).toContain(`${CSRF_COOKIE}=${TOKEN}`);
    expect(header).toContain("Path=/");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Max-Age=604800");
  });

  it("non-production does NOT contain Secure", () => {
    const header = csrfCookieHeader(TOKEN);
    expect(header).not.toContain("Secure");
  });

  it("production mode includes Secure", () => {
    vi.stubEnv("NODE_ENV", "production");
    const header = csrfCookieHeader(TOKEN);
    expect(header).toContain("Secure");
  });

  it("clear=true returns empty value and Max-Age=0", () => {
    const header = csrfCookieHeader(TOKEN, true);
    expect(header).toContain(`${CSRF_COOKIE}=`);
    expect(header).toContain("Max-Age=0");
  });

  it("clear=false has the token value", () => {
    const header = csrfCookieHeader(TOKEN, false);
    expect(header).toContain(`${CSRF_COOKIE}=${TOKEN}`);
  });
});
