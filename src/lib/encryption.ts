/**
 * AES-256-GCM encryption for sensitive database fields.
 *
 * Encrypts tenant secrets (API keys, OAuth tokens) before writing to SQLite
 * and decrypts them transparently on read.
 *
 * IMPORTANT: Node.js only — uses crypto module. Never import from Edge Runtime.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/** Separator for the encrypted payload format: iv:ciphertext:authTag (all base64). */
const SEPARATOR = ":";

/** Prefix marker to detect already-encrypted values. */
const ENCRYPTED_PREFIX = "aes256gcm$";

function getEncryptionKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      "FATAL: ENCRYPTION_KEY must be a 64-character hex string (32 bytes). " +
      "Generate one with: openssl rand -hex 32"
    );
  }
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      "FATAL: ENCRYPTION_KEY must contain only hex characters (0-9, a-f)."
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypt a plaintext string.
 * Returns a string in the format "aes256gcm$iv:ciphertext:authTag" (all base64).
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const payload = [
    iv.toString("base64"),
    encrypted.toString("base64"),
    authTag.toString("base64"),
  ].join(SEPARATOR);

  return ENCRYPTED_PREFIX + payload;
}

/**
 * Decrypt an encrypted string produced by encrypt().
 * Returns the original plaintext, or throws on invalid input.
 */
export function decrypt(encoded: string): string {
  if (!encoded.startsWith(ENCRYPTED_PREFIX)) {
    throw new Error("Value is not encrypted (missing prefix)");
  }

  const payload = encoded.slice(ENCRYPTED_PREFIX.length);
  const parts = payload.split(SEPARATOR);
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format");
  }

  const [ivB64, ciphertextB64, authTagB64] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Check if a value appears to be encrypted (starts with our prefix).
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith(ENCRYPTED_PREFIX);
}
