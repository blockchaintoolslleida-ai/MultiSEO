/**
 * Tests for trend calculation helpers (trends.ts).
 */
import { describe, it, expect } from "vitest";
import { computeTrend, computeDayOverDayChange, classifyKeyword, sortKeywords } from "./trends";

describe("computeTrend", () => {
  it("returns flat for single value", () => {
    expect(computeTrend([5])).toBe("flat");
  });

  it("returns flat for two identical values", () => {
    expect(computeTrend([5, 5])).toBe("flat");
  });

  it("returns up when position improves (decreases)", () => {
    // Position went from 10 → 7 → 4 (improving)
    expect(computeTrend([10, 7, 4])).toBe("up");
  });

  it("returns down when position worsens (increases)", () => {
    // Position went from 4 → 7 → 10 (declining)
    expect(computeTrend([4, 7, 10])).toBe("down");
  });

  it("returns flat for small changes below threshold", () => {
    // Default threshold is 0.5
    expect(computeTrend([5, 5.2, 4.9, 5.1])).toBe("flat");
  });

  it("respects custom threshold", () => {
    // With threshold 0, any change triggers
    expect(computeTrend([5, 5.1], 0)).toBe("down");
    // With high threshold (15), this change is below it and stays flat
    expect(computeTrend([5, 5, 15, 15], 15)).toBe("flat");
  });

  it("handles long history (uses first 3 vs last 3)", () => {
    // First 3 avg: (10 + 9 + 8) / 3 = 9
    // Last 3 avg: (5 + 5 + 5) / 3 = 5
    // Diff = 4 → "up" (improved)
    expect(computeTrend([10, 9, 8, 7, 6, 5, 5, 5])).toBe("up");
  });

  it("handles empty array", () => {
    expect(computeTrend([])).toBe("flat");
  });
});

describe("computeDayOverDayChange", () => {
  it("positive when position improves (lower number)", () => {
    // Yesterday 7, today 5 = improved by 2
    expect(computeDayOverDayChange(5, 7)).toBe(2);
  });

  it("negative when position worsens (higher number)", () => {
    expect(computeDayOverDayChange(10, 5)).toBe(-5);
  });

  it("returns zero for null values", () => {
    expect(computeDayOverDayChange(null, 5)).toBe(0);
    expect(computeDayOverDayChange(5, null)).toBe(0);
    expect(computeDayOverDayChange(null, null)).toBe(0);
  });

  it("returns zero for unchanged position", () => {
    expect(computeDayOverDayChange(5, 5)).toBe(0);
  });
});

describe("classifyKeyword", () => {
  it("classifies improving keyword", () => {
    const result = classifyKeyword({ position: 15, change: 3 });
    expect(result.priority).toBe("improved");
    expect(result.isImproving).toBe(true);
    expect(result.isTop3).toBe(false);
    expect(result.isTop10).toBe(false);
  });

  it("classifies declining keyword", () => {
    const result = classifyKeyword({ position: 5, change: -2 });
    expect(result.priority).toBe("declined");
    expect(result.isDeclining).toBe(true);
  });

  it("classifies top3 keyword with no change", () => {
    const result = classifyKeyword({ position: 2, change: 0 });
    expect(result.priority).toBe("top3");
    expect(result.isTop3).toBe(true);
    expect(result.isTop10).toBe(true);
  });

  it("classifies top10 keyword with no change", () => {
    const result = classifyKeyword({ position: 7, change: 0 });
    expect(result.priority).toBe("top10");
    expect(result.isTop3).toBe(false);
    expect(result.isTop10).toBe(true);
  });

  it("classifies other keyword with no change", () => {
    const result = classifyKeyword({ position: 25, change: 0 });
    expect(result.priority).toBe("other");
  });

  it("improvement overrides top3 for priority", () => {
    const result = classifyKeyword({ position: 2, change: 5 });
    expect(result.priority).toBe("improved");
    expect(result.isTop3).toBe(true);
  });
});

describe("sortKeywords", () => {
  const keywords = [
    { keyword: "a", position: 5, change: 0, volume: 100 },
    { keyword: "b", position: 2, change: 3, volume: 200 },
    { keyword: "c", position: 15, change: -5, volume: 50 },
    { keyword: "d", position: 1, change: 1, volume: 300 },
  ];

  it("sorts by position ascending by default", () => {
    const sorted = sortKeywords(keywords, "position");
    expect(sorted.map((k) => k.keyword)).toEqual(["d", "b", "a", "c"]);
  });

  it("sorts by improved (most improved first)", () => {
    const sorted = sortKeywords(keywords, "improved");
    expect(sorted[0].keyword).toBe("b"); // +3 = most improved
    expect(sorted[3].keyword).toBe("c"); // -5 = least improved
  });

  it("sorts by declined (most declined first)", () => {
    const sorted = sortKeywords(keywords, "declined");
    expect(sorted[0].keyword).toBe("c"); // -5 = most declined
    expect(sorted[3].keyword).toBe("b"); // +3 = least declined
  });

  it("does not mutate the input", () => {
    const original = [...keywords];
    sortKeywords(keywords, "position");
    expect(keywords).toEqual(original);
  });

  it("handles empty array", () => {
    expect(sortKeywords([], "position")).toEqual([]);
  });
});
