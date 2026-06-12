/**
 * Unit tests for client-ip.ts — validates getClientIp() IP extraction.
 */
import { describe, it, expect } from "vitest";
import { getClientIp } from "./client-ip";

describe("getClientIp", () => {
  it("returns 127.0.0.1 when no headers are set", () => {
    const request = new Request("http://test");

    const result = getClientIp(request);

    expect(result).toBe("127.0.0.1");
  });

  it("returns a single IP from x-forwarded-for", () => {
    const request = new Request("http://test", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });

    const result = getClientIp(request);

    expect(result).toBe("1.2.3.4");
  });

  it("returns the leftmost IP from a comma-separated x-forwarded-for chain", () => {
    const request = new Request("http://test", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });

    const result = getClientIp(request);

    expect(result).toBe("1.2.3.4");
  });

  it("returns the IP from x-real-ip when x-forwarded-for is absent", () => {
    const request = new Request("http://test", {
      headers: { "x-real-ip": "10.0.0.1" },
    });

    const result = getClientIp(request);

    expect(result).toBe("10.0.0.1");
  });

  it("prefers x-forwarded-for over x-real-ip when both headers are present", () => {
    const request = new Request("http://test", {
      headers: {
        "x-forwarded-for": "1.2.3.4",
        "x-real-ip": "10.0.0.1",
      },
    });

    const result = getClientIp(request);

    expect(result).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is set but empty", () => {
    const request = new Request("http://test", {
      headers: {
        "x-forwarded-for": ",",
        "x-real-ip": "10.0.0.1",
      },
    });

    const result = getClientIp(request);

    expect(result).toBe("10.0.0.1");
  });

  it("trims whitespace from the extracted IP", () => {
    const request = new Request("http://test", {
      headers: { "x-forwarded-for": "  192.168.1.1  " },
    });

    const result = getClientIp(request);

    expect(result).toBe("192.168.1.1");
  });
});
