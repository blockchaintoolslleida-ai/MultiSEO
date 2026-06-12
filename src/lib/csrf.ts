/**
 * CSRF protection utilities for MultiSEO.
 *
 * Uses the double-submit cookie pattern: a random token is set as a
 * non-HttpOnly cookie on login, and the client must send it back as
 * an x-csrf-token header on state-changing requests. The middleware
 * compares the cookie value with the header value.
 *
 * IMPORTANT: Edge-compatible — uses Web Crypto API only, no Node.js.
 */

const CSRF_COOKIE = "multiseo_csrf";
const TOKEN_BYTES = 32;
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days, matches session

/** Generate a cryptographically random CSRF token. */
export async function generateCsrfToken(): Promise<string> {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES));
  return bytesToBase64url(bytes);
}

/** Build the Set-Cookie header for the CSRF cookie. */
export function csrfCookieHeader(token: string, clear = false): string {
  const flags = [
    `${CSRF_COOKIE}=${clear ? "" : token}`,
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${clear ? 0 : MAX_AGE}`,
  ];
  if (process.env.NODE_ENV === "production") flags.push("Secure");
  return flags.join("; ");
}

export { CSRF_COOKIE };

// ---- Edge-compatible base64url (same pattern as auth.ts) ----

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function bytesToBase64url(bytes: Uint8Array): string {
  let result = "";
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const a = bytes[i];
    const b = i + 1 < len ? bytes[i + 1] : 0;
    const c = i + 2 < len ? bytes[i + 2] : 0;
    const n = (a << 16) | (b << 8) | c;
    result += BASE64_CHARS[(n >> 18) & 63];
    result += BASE64_CHARS[(n >> 12) & 63];
    result += i + 1 < len ? BASE64_CHARS[(n >> 6) & 63] : "=";
    result += i + 2 < len ? BASE64_CHARS[n & 63] : "=";
  }
  return result.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
