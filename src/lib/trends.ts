/**
 * Trend calculation helpers for SEO rankings.
 *
 * Pure functions — no side effects, no DB access. Easy to unit test.
 */

export type Trend = "up" | "down" | "flat";

/**
 * Compute the trend direction based on a series of position values.
 * Compares the average of the first 3 data points with the average of the last 3.
 * Lower position = better ranking, so "up" means position number decreased (improved).
 */
export function computeTrend(positions: number[], threshold: number = 0.5): Trend {
  if (positions.length < 2) return "flat";

  const n = Math.min(3, Math.floor(positions.length / 2));
  const firstSlice = positions.slice(0, n);
  const lastSlice = positions.slice(-n);

  const firstAvg = firstSlice.reduce((s, v) => s + v, 0) / firstSlice.length;
  const lastAvg = lastSlice.reduce((s, v) => s + v, 0) / lastSlice.length;
  const diff = firstAvg - lastAvg; // Positive = improved (position went down)

  if (diff > threshold) return "up";
  if (diff < -threshold) return "down";
  return "flat";
}

/**
 * Calculate the day-over-day position change.
 * Returns 0 if either value is null (insufficient data).
 * Positive = improved (lower position number).
 */
export function computeDayOverDayChange(today: number | null, yesterday: number | null): number {
  if (today === null || yesterday === null) return 0;
  return yesterday - today;
}

/** Priority classification for sorting keywords. */
export type KeywordPriority = "improved" | "declined" | "top10" | "top3" | "other";

export interface ClassifiableKeyword {
  position: number;
  change: number;
}

export interface ClassifiedKeyword extends ClassifiableKeyword {
  priority: KeywordPriority;
  isTop3: boolean;
  isTop10: boolean;
  isDeclining: boolean;
  isImproving: boolean;
}

/**
 * Classify a keyword into a priority bucket for sorting/display.
 */
export function classifyKeyword(kw: ClassifiableKeyword): ClassifiedKeyword {
  const isTop3 = kw.position <= 3;
  const isTop10 = kw.position <= 10;
  const isImproving = kw.change > 0;
  const isDeclining = kw.change < 0;

  let priority: KeywordPriority;
  if (kw.change > 0) {
    priority = "improved";
  } else if (kw.change < 0) {
    priority = "declined";
  } else if (isTop3) {
    priority = "top3";
  } else if (isTop10) {
    priority = "top10";
  } else {
    priority = "other";
  }

  return { ...kw, priority, isTop3, isTop10, isDeclining, isImproving };
}

/**
 * Sort keywords by the specified priority field.
 * Returns a new sorted array (immutable).
 */
export function sortKeywords<T extends ClassifiableKeyword>(
  keywords: T[],
  sort: "improved" | "declined" | "position" | "clicks" | "impressions"
): T[] {
  const sorted = [...keywords];

  switch (sort) {
    case "improved":
      sorted.sort((a, b) => b.change - a.change); // Most improved first
      break;
    case "declined":
      sorted.sort((a, b) => a.change - b.change); // Most declined first
      break;
    case "position":
    default:
      sorted.sort((a, b) => a.position - b.position); // Best position first
      break;
  }

  return sorted;
}
