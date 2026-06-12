/**
 * Startup secret validation for MultiSEO.
 *
 * Called at application startup via instrumentation.ts to verify
 * that all required environment variables are present before the
 * server begins accepting requests.
 *
 * IMPORTANT: Node.js only — never import from Edge Runtime files.
 */

const REQUIRED_SECRETS = ["SESSION_SECRET"] as const;

const RECOMMENDED_SECRETS = [
  "DEEPSEEK_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "ENCRYPTION_KEY",
] as const;

const OLD_DEFAULTS = new Set([
  "multiseo-dev-secret-change-in-production",
]);

export interface StartupCheckResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function validateStartupSecrets(): StartupCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required secrets — server cannot start without these
  for (const name of REQUIRED_SECRETS) {
    const value = process.env[name];
    if (!value || value.length < 16) {
      errors.push(
        `FATAL: ${name} environment variable is not set or is too short (min 16 chars). The server cannot start without a strong secret.`
      );
    } else if (OLD_DEFAULTS.has(value)) {
      errors.push(
        `FATAL: ${name} is set to a known default value. Set a unique, random secret in your environment.`
      );
    }
  }

  // Recommended secrets — warn if missing but allow startup
  for (const name of RECOMMENDED_SECRETS) {
    if (!process.env[name]) {
      warnings.push(
        `WARNING: ${name} is not set. Features depending on this secret will fail at runtime.`
      );
    }
  }

  // Validate ENCRYPTION_KEY format if set
  const encKey = process.env.ENCRYPTION_KEY;
  if (encKey) {
    if (!/^[0-9a-fA-F]{64}$/.test(encKey)) {
      errors.push(
        "FATAL: ENCRYPTION_KEY must be a 64-character hex string (32 bytes)."
      );
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}
