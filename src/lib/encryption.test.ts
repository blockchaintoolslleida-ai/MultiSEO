/**
 * Tests for AES-256-GCM encryption utilities (encryption.ts).
 */
import { describe, it, expect, beforeAll } from "vitest";
import { encrypt, decrypt, isEncrypted } from "./encryption";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "a".repeat(64);
});

describe("encrypt", () => {
  it("returns a string starting with aes256gcm$", () => {
    const result = encrypt("hello");
    expect(typeof result).toBe("string");
    expect(result.startsWith("aes256gcm$")).toBe(true);
    expect(result.length).toBeGreaterThan("aes256gcm$".length);
  });

  it("produces different output for the same input (different IVs)", () => {
    const result1 = encrypt("hello");
    const result2 = encrypt("hello");
    expect(result1).not.toBe(result2);
  });
});

describe("decrypt", () => {
  it("returns the original plaintext after encrypt+decrypt round-trip", () => {
    const encrypted = encrypt("hello");
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe("hello");
  });

  it("throws on a non-encrypted value (missing prefix)", () => {
    expect(() => decrypt("plain-text")).toThrow("Value is not encrypted (missing prefix)");
  });

  it("throws on a value with the correct prefix but invalid payload format", () => {
    expect(() => decrypt("aes256gcm$invalid")).toThrow("Invalid encrypted payload format");
  });
});

describe("isEncrypted", () => {
  it("returns true for an encrypted value", () => {
    const encrypted = encrypt("test");
    expect(isEncrypted(encrypted)).toBe(true);
  });

  it("returns false for plain text", () => {
    expect(isEncrypted("plain text")).toBe(false);
  });

  it("returns false for null", () => {
    expect(isEncrypted(null)).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isEncrypted(undefined)).toBe(false);
  });

  it("returns false for an empty string", () => {
    expect(isEncrypted("")).toBe(false);
  });

  it("returns true for a string that starts with the encrypted prefix", () => {
    expect(isEncrypted("aes256gcm$something")).toBe(true);
  });
});

describe("round-trip encryption/decryption", () => {
  it("handles special characters", () => {
    const input = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~";
    expect(decrypt(encrypt(input))).toBe(input);
  });

  it("handles unicode characters", () => {
    const input = "Hello, 世界! 🌍";
    expect(decrypt(encrypt(input))).toBe(input);
  });

  it("handles an empty string", () => {
    expect(decrypt(encrypt(""))).toBe("");
  });

  it("handles a long string", () => {
    const input = "x".repeat(10000);
    expect(decrypt(encrypt(input))).toBe(input);
  });

  it("handles JSON data", () => {
    const input = JSON.stringify({
      key: "value",
      nested: { deep: true },
      arr: [1, 2, 3],
    });
    expect(decrypt(encrypt(input))).toBe(input);
  });
});
