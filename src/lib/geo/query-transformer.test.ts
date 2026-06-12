/**
 * Unit tests for query-transformer.ts — validates keyword-to-query transformation.
 */
import { describe, it, expect } from "vitest";
import { transformKeywordToQueries, transformAllKeywords } from "./query-transformer";

describe("transformKeywordToQueries", () => {
  it("returns 4 queries for a normal keyword", () => {
    const result = transformKeywordToQueries("seo barcelona");

    expect(result).toHaveLength(4);
  });

  it("returns queries that contain the original keyword", () => {
    const result = transformKeywordToQueries("seo barcelona");

    for (const query of result) {
      expect(query).toContain("seo barcelona");
    }
  });

  it("returns queries in Spanish using the expected phrases", () => {
    const result = transformKeywordToQueries("seo barcelona");

    expect(result[0]).toBe("¿cuál es el mejor seo barcelona?");
    expect(result[1]).toBe("recomiéndame seo barcelona");
    expect(result[2]).toBe("¿qué seo barcelona me recomiendas?");
    expect(result[3]).toBe("mejores seo barcelona");
  });

  it("handles an empty keyword gracefully", () => {
    const result = transformKeywordToQueries("");

    expect(result).toHaveLength(4);
    expect(result[0]).toBe("¿cuál es el mejor ?");
  });

  it("preserves keywords with special characters", () => {
    const result = transformKeywordToQueries("café & tè");

    expect(result).toHaveLength(4);
    for (const query of result) {
      expect(query).toContain("café & tè");
    }
  });
});

describe("transformAllKeywords", () => {
  it("returns 8 results for 2 keywords (4 queries per keyword)", () => {
    const result = transformAllKeywords([
      { keyword: "a" },
      { keyword: "b" },
    ]);

    expect(result).toHaveLength(8);
  });

  it("returns an empty array when given an empty array", () => {
    const result = transformAllKeywords([]);

    expect(result).toEqual([]);
  });

  it("returns objects with { keyword, query } shape", () => {
    const result = transformAllKeywords([{ keyword: "seo" }]);

    expect(result).toHaveLength(4);
    for (const item of result) {
      expect(item).toHaveProperty("keyword");
      expect(item).toHaveProperty("query");
      expect(typeof item.keyword).toBe("string");
      expect(typeof item.query).toBe("string");
      expect(item.keyword).toBe("seo");
    }
  });
});
