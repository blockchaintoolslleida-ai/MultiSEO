/**
 * Auth utilities for MultiSEO.
 *
 * Session signing/verification uses Web Crypto API (works in Edge + Node.js).
 * Password hashing uses Node.js crypto (login API / seed only, never called from Edge).
 */

// Node crypto — only for PBKDF2 (not used in middleware/Edge)
import crypto from "crypto";

const SESSION_SECRET = process.env.SESSION_SECRET || "multiseo-dev-secret-change-in-production";
export const SESSION_COOKIE = "multiseo_session";
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export interface Session {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
}

// ---- Password hashing (Node.js only) ----

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"));
}

// ---- Session management (Web Crypto — Edge + Node.js) ----

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw", encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]
  );
}

function bytesToBase64url(bytes: ArrayBuffer): string {
  let binary = "";
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function signSession(session: Session): Promise<string> {
  const payload = btoa(JSON.stringify(session)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const signature = bytesToBase64url(sig);
  return `${payload}.${signature}`;
}

export async function verifySession(cookieValue: string): Promise<Session | null> {
  try {
    const parts = cookieValue.split(".");
    if (parts.length !== 2) return null;
    const [payload, signature] = parts;

    const key = await getKey();
    const sigBytes = base64urlToBytes(signature);
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, encoder.encode(payload));
    if (!valid) return null;

    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
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
