/**
 * Transparent encryption wrappers for tenant secret fields.
 *
 * Provides getTenantSecret() and setTenantSecret() that automatically
 * decrypt on read and encrypt on write, so individual API routes don't
 * need to call encryption.ts directly.
 *
 * IMPORTANT: Node.js only — uses crypto module via encryption.ts.
 */
import { encrypt, decrypt, isEncrypted } from "./encryption";

/** Fields in the tenants table that contain secrets and must be encrypted at rest. */
const SECRET_FIELDS = new Set([
  "deepseekApiKey",
  "gscRefreshToken",
  "gscAccessToken",
  "telegramBotToken",
  "telegramChatId",
  "geoProviderKeys",
]);

/**
 * Read a secret field from a tenant row, decrypting it transparently.
 * Returns null if the field is null/undefined, or the plaintext value.
 */
export function getTenantSecret(
  tenant: Record<string, unknown>,
  field: string
): string | null {
  if (!SECRET_FIELDS.has(field)) {
    throw new Error(`Field "${field}" is not a known secret field.`);
  }

  const value = tenant[field] as string | null | undefined;
  if (!value) return null;
  if (!isEncrypted(value)) return value; // Plaintext (pre-migration) — still readable
  return decrypt(value);
}

/**
 * Encrypt a value for storage in a tenant secret field.
 * Returns the encrypted string for DB write.
 */
export function setTenantSecret(value: string): string {
  return encrypt(value);
}

/**
 * Check if a tenant row has plaintext secrets that need migration.
 */
export function hasPlaintextSecrets(tenant: Record<string, unknown>): boolean {
  for (const field of SECRET_FIELDS) {
    const value = tenant[field] as string | null | undefined;
    if (value && !isEncrypted(value)) return true;
  }
  return false;
}

/**
 * Encrypt all plaintext secrets in a tenant row, returning a new object.
 * Fields that are already encrypted or null/undefined are left unchanged.
 */
export function encryptTenantSecrets(
  tenant: Record<string, unknown>
): Record<string, unknown> {
  const updated: Record<string, unknown> = {};

  for (const field of SECRET_FIELDS) {
    const value = tenant[field] as string | null | undefined;
    if (value && !isEncrypted(value)) {
      updated[field] = encrypt(value);
    }
  }

  return updated;
}
