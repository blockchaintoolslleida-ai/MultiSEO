/**
 * Rankings Service — business logic for the /api/rankings endpoint.
 *
 * Aggregates keyword data with daily history snapshots, computes trends
 * and summaries. Keeps the API route handler thin.
 */

import { db } from "@/db";
import { keywords, websites, keywordRankingHistory } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import type { RankingsApiResponse, RankingKeyword, RankingsSummary } from "@/types/seo";
import { computeTrend, computeDayOverDayChange } from "@/lib/trends";

export interface RankingsQueryParams {
  websiteId: string;
  days: number;
  sort: "improved" | "declined" | "position" | "clicks" | "impressions";
}

function daysAgo(days: number): string {
  const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
}

/**
 * Build a RankingsApiResponse for a given website and date range.
 */
export function getRankings(params: RankingsQueryParams): RankingsApiResponse {
  const { websiteId, days, sort } = params;

  const website = db.select().from(websites).where(eq(websites.id, websiteId)).get();
  if (!website) {
    throw Object.assign(new Error("Website not found"), { status: 404 });
  }

  const allKeywords = db.select().from(keywords).where(eq(keywords.websiteId, websiteId)).all();

  const startDate = daysAgo(days);
  const endDate = new Date().toISOString().split("T")[0];

  // Build ranking keywords with history
  const rankingKeywords: RankingKeyword[] = allKeywords.map((kw) => {
    // Fetch daily snapshots for this keyword in the date range
    const historyRows = db
      .select()
      .from(keywordRankingHistory)
      .where(
        and(
          eq(keywordRankingHistory.keywordId, kw.id),
          gte(keywordRankingHistory.date, startDate),
          lte(keywordRankingHistory.date, endDate)
        )
      )
      .all();

    const history = historyRows.map((h) => ({
      date: h.date,
      position: h.position,
      clicks: h.clicks,
      impressions: h.impressions,
      ctr: h.ctr,
    }));

    // If we have history but no entry for today, add the current position
    const hasToday = history.length > 0 && history[history.length - 1].date === endDate;
    if (!hasToday) {
      history.push({
        date: endDate,
        position: kw.position,
        clicks: kw.clicks,
        impressions: kw.impressions,
        ctr: kw.ctr,
      });
    }

    // Compute trend from history positions
    const positions = history.map((h) => h.position);
    const trend = computeTrend(positions);

    // Day-over-day change: compare last two history entries, or use kw.change
    let change = kw.change;
    if (history.length >= 2) {
      change = computeDayOverDayChange(
        history[history.length - 1].position,
        history[history.length - 2].position
      );
    }

    return {
      id: kw.id,
      keyword: kw.keyword,
      position: kw.position,
      change,
      clicks: kw.clicks,
      impressions: kw.impressions,
      ctr: kw.ctr,
      difficulty: kw.difficulty as "easy" | "medium" | "hard",
      trend,
      isTop3: kw.isTop3 === 1,
      isFalling: kw.isFalling === 1,
      history,
    };
  });

  // Sort
  switch (sort) {
    case "improved":
      rankingKeywords.sort((a, b) => b.change - a.change);
      break;
    case "declined":
      rankingKeywords.sort((a, b) => a.change - b.change);
      break;
    case "position":
    default:
      rankingKeywords.sort((a, b) => a.position - b.position);
      break;
  }

  // Compute summary
  const totalKeywords = rankingKeywords.length;
  const avgPosition =
    totalKeywords > 0
      ? Math.round((rankingKeywords.reduce((s, k) => s + k.position, 0) / totalKeywords) * 10) / 10
      : 0;
  const totalClicks = rankingKeywords.reduce((s, k) => s + k.clicks, 0);
  const totalImpressions = rankingKeywords.reduce((s, k) => s + k.impressions, 0);
  const avgCtr =
    totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 1000) / 1000 : 0;
  const improved = rankingKeywords.filter((k) => k.change > 0).length;
  const declined = rankingKeywords.filter((k) => k.change < 0).length;
  const top10 = rankingKeywords.filter((k) => k.position <= 10).length;
  const top3 = rankingKeywords.filter((k) => k.position <= 3).length;

  const summary: RankingsSummary = {
    avgPosition,
    totalClicks,
    totalImpressions,
    avgCtr,
    improved,
    declined,
    top10,
    top3,
  };

  return {
    websiteId,
    websiteDomain: website.domain,
    period: { startDate, endDate, days },
    lastSync: website.lastGscSync ?? null,
    summary,
    keywords: rankingKeywords,
    total: totalKeywords,
  };
}
