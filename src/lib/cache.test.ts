/**
 * Tests for in-memory TTL cache (cache.ts).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cacheGet, cacheSet, cacheDelete, cacheDeletePrefix, cacheClear, cacheSize } from "./cache";

describe("cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    cacheClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    cacheClear();
  });

  it("stores and retrieves values", () => {
    cacheSet("test", { hello: "world" }, 60000);
    expect(cacheGet("test")).toEqual({ hello: "world" });
  });

  it("returns undefined for missing keys", () => {
    expect(cacheGet("missing")).toBeUndefined();
  });

  it("expires values after TTL", () => {
    cacheSet("test", "value", 1000);
    expect(cacheGet("test")).toBe("value");

    vi.advanceTimersByTime(1001);
    expect(cacheGet("test")).toBeUndefined();
  });

  it("deletes specific key", () => {
    cacheSet("a", 1, 60000);
    cacheSet("b", 2, 60000);
    cacheDelete("a");
    expect(cacheGet("a")).toBeUndefined();
    expect(cacheGet("b")).toBe(2);
  });

  it("deletes keys by prefix", () => {
    cacheSet("rankings:abc:30", 1, 60000);
    cacheSet("rankings:xyz:60", 2, 60000);
    cacheSet("gsc:abc", 3, 60000);
    cacheDeletePrefix("rankings:");
    expect(cacheGet("rankings:abc:30")).toBeUndefined();
    expect(cacheGet("rankings:xyz:60")).toBeUndefined();
    expect(cacheGet("gsc:abc")).toBe(3);
  });

  it("clears all entries", () => {
    cacheSet("a", 1, 60000);
    cacheSet("b", 2, 60000);
    cacheClear();
    expect(cacheSize()).toBe(0);
  });

  it("reports correct size", () => {
    expect(cacheSize()).toBe(0);
    cacheSet("a", 1, 60000);
    cacheSet("b", 2, 60000);
    expect(cacheSize()).toBe(2);
  });

  it("excludes expired entries from size", () => {
    cacheSet("a", 1, 1000);
    cacheSet("b", 2, 60000);
    vi.advanceTimersByTime(1001);
    expect(cacheSize()).toBe(1);
  });

  it("accepts different value types", () => {
    cacheSet("num", 42, 60000);
    cacheSet("str", "hello", 60000);
    cacheSet("arr", [1, 2, 3], 60000);
    cacheSet("obj", { nested: true }, 60000);
    cacheSet("nullVal", null, 60000);

    expect(cacheGet("num")).toBe(42);
    expect(cacheGet("str")).toBe("hello");
    expect(cacheGet("arr")).toEqual([1, 2, 3]);
    expect(cacheGet("obj")).toEqual({ nested: true });
    expect(cacheGet("nullVal")).toBeNull();
  });
});
