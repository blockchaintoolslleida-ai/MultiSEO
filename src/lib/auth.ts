/**
 * Auth utilities for MultiSEO.
 *
 * Session signing/verification uses Web Crypto API (works in Edge + Node.js).
 * Password hashing is in auth-password.ts (Node.js only — never imported from Edge).
 *
 * IMPORTANT: No Node.js imports, no atob/btoa — must work in Edge Runtime.
 */

const SESSION_SECRET = process.env.SESSION_SECRET || "multiseo-dev-secret-change-in-production";
export const SESSION_COOKIE = "multiseo_session";
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export interface Session {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
}

// ---- Base64url encoding (no atob/btoa, Edge-compatible) ----

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function stringToBytes(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
}

function bytesToString(bytes: Uint8Array): string {
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return str;
}

function toBase64url(bytes: Uint8Array): string {
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
  // Convert to base64url: +→-, /→_, strip padding
  return result.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64url(str: string): Uint8Array {
  // Convert base64url to standard base64
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";

  const bytes: number[] = [];
  for (let i = 0; i < b64.length; i += 4) {
    const a = BASE64_CHARS.indexOf(b64[i]);
    const b = BASE64_CHARS.indexOf(b64[i + 1]);
    const c = b64[i + 2] === "=" ? 0 : BASE64_CHARS.indexOf(b64[i + 2]);
    const d = b64[i + 3] === "=" ? 0 : BASE64_CHARS.indexOf(b64[i + 3]);
    if (a === -1 || b === -1 || c === -1 || d === -1) continue;
    const n = (a << 18) | (b << 12) | (c << 6) | d;
    bytes.push((n >> 16) & 255);
    if (b64[i + 2] !== "=") bytes.push((n >> 8) & 255);
    if (b64[i + 3] !== "=") bytes.push(n & 255);
  }
  return new Uint8Array(bytes);
}

// ---- Session management (Web Crypto — Edge + Node.js) ----

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder().encode(SESSION_SECRET);
  return crypto.subtle.importKey(
    "raw", enc as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]
  );
}

export async function signSession(session: Session): Promise<string> {
  const payload = toBase64url(stringToBytes(JSON.stringify(session)));
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload) as unknown as ArrayBuffer);
  const signature = toBase64url(new Uint8Array(sig));
  return `${payload}.${signature}`;
}

export async function verifySession(cookieValue: string): Promise<Session | null> {
  try {
    const parts = cookieValue.split(".");
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;

    const key = await getKey();
    const sigBytes = fromBase64url(signature);
    // TS strict: Uint8Array is a valid BufferSource, but TS may complain about SharedArrayBuffer
    const valid = await crypto.subtle.verify(
      "HMAC", key, sigBytes as unknown as ArrayBuffer, new TextEncoder().encode(payload) as unknown as ArrayBuffer
    );
    if (!valid) return null;

    const jsonStr = bytesToString(fromBase64url(payload));
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function sessionCookieHeader(cookieValue: string, clear = false): string {
  const flags = [
    `${SESSION_COOKIE}=${clear ? "" : cookieValue}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${clear ? 0 : MAX_AGE}`,
  ];
  if (process.env.NODE_ENV === "production") flags.push("Secure");
  return flags.join("; ");
}
