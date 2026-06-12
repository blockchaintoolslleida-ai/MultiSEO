/**
 * Tests for startup secret validation (startup-checks.ts).
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { validateStartupSecrets } from "./startup-checks";

describe("validateStartupSecrets", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns ok=true with no errors when SESSION_SECRET is valid", () => {
    vi.stubEnv("SESSION_SECRET", "a-valid-secret-that-is-long-enough-12345");
    const result = validateStartupSecrets();
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns ok=false when SESSION_SECRET is not set", () => {
    // Ensure SESSION_SECRET is not present (afterEach restores original env)
    delete process.env.SESSION_SECRET;
    const result = validateStartupSecrets();
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("SESSION_SECRET"))).toBe(true);
  });

  it("returns ok=false when SESSION_SECRET is too short", () => {
    vi.stubEnv("SESSION_SECRET", "short");
    const result = validateStartupSecrets();
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("SESSION_SECRET"))).toBe(true);
  });

  it("returns ok=false when SESSION_SECRET is the old default value", () => {
    vi.stubEnv("SESSION_SECRET", "multiseo-dev-secret-change-in-production");
    const result = validateStartupSecrets();
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("known default"))).toBe(true);
  });

  it("returns ok=false when ENCRYPTION_KEY is set but has wrong format", () => {
    vi.stubEnv("SESSION_SECRET", "a-valid-secret-that-is-long-enough-12345");
    vi.stubEnv("ENCRYPTION_KEY", "not-valid-hex");
    const result = validateStartupSecrets();
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("ENCRYPTION_KEY"))).toBe(true);
  });

  it("produces no errors for a valid ENCRYPTION_KEY", () => {
    vi.stubEnv("SESSION_SECRET", "a-valid-secret-that-is-long-enough-12345");
    vi.stubEnv("ENCRYPTION_KEY", "a".repeat(64));
    const result = validateStartupSecrets();
    expect(result.ok).toBe(true);
    expect(result.errors.filter((e) => e.includes("ENCRYPTION_KEY"))).toHaveLength(0);
  });

  it("produces warnings for missing recommended secrets", () => {
    vi.stubEnv("SESSION_SECRET", "a-valid-secret-that-is-long-enough-12345");
    // Explicitly ensure recommended secrets are not set in the environment
    delete process.env.DEEPSEEK_API_KEY;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.ENCRYPTION_KEY;
    const result = validateStartupSecrets();
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes("DEEPSEEK_API_KEY"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("GOOGLE_CLIENT_ID"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("GOOGLE_CLIENT_SECRET"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("ENCRYPTION_KEY"))).toBe(true);
  });

  it("produces no warnings when all recommended secrets are set", () => {
    vi.stubEnv("SESSION_SECRET", "a-valid-secret-that-is-long-enough-12345");
    vi.stubEnv("DEEPSEEK_API_KEY", "sk-test");
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-client-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-client-secret");
    vi.stubEnv("ENCRYPTION_KEY", "a".repeat(64));
    const result = validateStartupSecrets();
    const relevantWarnings = result.warnings.filter(
      (w) =>
        w.includes("DEEPSEEK_API_KEY") ||
        w.includes("GOOGLE_CLIENT_ID") ||
        w.includes("GOOGLE_CLIENT_SECRET") ||
        w.includes("ENCRYPTION_KEY")
    );
    expect(relevantWarnings).toHaveLength(0);
  });
});
