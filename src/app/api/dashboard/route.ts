import { db } from "@/db";
import { keywords, competitors, rankingHistory, websites } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { SEODashboardData } from "@/types/seo";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";

/** Inferred row type from the keywords table (no domain). */
type KeywordRow = typeof keywords.$inferSelect;

/** Keyword row enriched with the source website domain. */
type KeywordRowLabeled = KeywordRow & { websiteDomain: string };

/** Parse Spanish date strings like "10 May", "1 Jun" into sortable numbers. */
function parseSpanishDate(d: string): number {
  const months: Record<string, number> = {
    ene: 0,
    feb: 1,
    mar: 2,
    abr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    ago: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dic: 11,
  };
  const [day, month] = d.split(" ");
  return months[month.toLowerCase()] * 100 + parseInt(day);
}

/** Sort ranking history rows by parsed Spanish date. */
function sortRankingByDate<T extends { date: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => parseSpanishDate(a.date) - parseSpanishDate(b.date));
}

export async function GET(request: Request) {
  const tenantId = getTenantId(request);

  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");

    if (!websiteId) {
      return Response.json({ error: "websiteId query parameter is required" }, { status: 400 });
    }

    // ── Aggregate dashboard across all tenant websites ──
    if (websiteId === "all") {
      const allWebsites = db.select().from(websites).where(eq(websites.tenantId, tenantId)).all();

      if (allWebsites.length === 0) {
        return Response.json({ error: "No websites found" }, { status: 404 });
      }

      // Aggregate KPIs from website rows
      const avgPositionValue =
        Math.round((allWebsites.reduce((s, w) => s + w.avgPosition, 0) / allWebsites.length) * 10) /
        10;
      const estimatedTrafficValue = allWebsites.reduce((s, w) => s + w.estimatedTraffic, 0);
      const backlinksValue = allWebsites.reduce((s, w) => s + w.backlinksCount, 0);
      const healthScoreValue = Math.round(
        allWebsites.reduce((s, w) => s + w.healthScore, 0) / allWebsites.length
      );

      // Collect per-website data
      const allKwRows: KeywordRowLabeled[] = [];
      const compAgg = new Map<
        string,
        {
          domain: string;
          avgPosition: number;
          trend: string;
          highlightChange: number;
          count: number;
        }
      >();
      const rankingByDate = new Map<string, number[]>();

      let totalPositionChange = 0;
      let totalTrafficChange = 0;
      let websitesWithHistory = 0;

      for (const website of allWebsites) {
        const kwRows = db.select().from(keywords).where(eq(keywords.websiteId, website.id)).all();
        const compRows = db
          .select()
          .from(competitors)
          .where(eq(competitors.websiteId, website.id))
          .all();
        const rankingRows = db
          .select()
          .from(rankingHistory)
          .where(eq(rankingHistory.websiteId, website.id))
          .all();

        // Keywords: label with source website domain
        for (const kw of kwRows) {
          allKwRows.push({ ...kw, websiteDomain: website.domain });
        }

        // Competitors: deduplicate by domain, average positions
        for (const comp of compRows) {
          const existing = compAgg.get(comp.domain);
          if (existing) {
            const newCount = existing.count + 1;
            existing.avgPosition =
              (existing.avgPosition * existing.count + comp.avgPosition) / newCount;
            existing.count = newCount;
            if (comp.highlightChange) existing.highlightChange = comp.highlightChange;
          } else {
            compAgg.set(comp.domain, {
              domain: comp.domain,
              avgPosition: comp.avgPosition,
              trend: comp.trend,
              highlightChange: comp.highlightChange,
              count: 1,
            });
          }
        }

        // Ranking history: group positions by date across websites
        for (const rh of rankingRows) {
          const positions = rankingByDate.get(rh.date) || [];
          positions.push(rh.avgPosition);
          rankingByDate.set(rh.date, positions);
        }

        // Per-website position change for aggregate trend
        const sorted = sortRankingByDate(rankingRows);
        if (sorted.length >= 2) {
          const prev = sorted[sorted.length - 2].avgPosition;
          const latest = sorted[sorted.length - 1].avgPosition;
          totalPositionChange += prev - latest;
          websitesWithHistory++;
        }

        // Per-website traffic change
        const wTrafficChange = kwRows.reduce((sum, kw) => {
          const hist = JSON.parse(kw.history) as number[];
          if (hist.length >= 2) {
            const improvement = hist[hist.length - 2] - hist[hist.length - 1];
            return sum + improvement * (kw.volume / 100);
          }
          return sum;
        }, 0);
        totalTrafficChange += wTrafficChange;
      }

      // Build aggregated ranking history
      const aggregatedHistory = Array.from(rankingByDate.entries())
        .map(([date, positions]) => ({
          date,
          avgPosition:
            Math.round((positions.reduce((s, p) => s + p, 0) / positions.length) * 10) / 10,
        }))
        .sort((a, b) => parseSpanishDate(a.date) - parseSpanishDate(b.date));

      // Aggregated trends
      const avgPositionChange =
        websitesWithHistory > 0
          ? Math.round((totalPositionChange / websitesWithHistory) * 10) / 10
          : 0;
      const positionTrend: "up" | "down" | "flat" =
        avgPositionChange > 0.1 ? "up" : avgPositionChange < -0.1 ? "down" : "flat";
      const trafficTrend: "up" | "down" | "flat" =
        totalTrafficChange > 5 ? "up" : totalTrafficChange < -5 ? "down" : "flat";
      const healthTrend: "up" | "down" | "flat" =
        healthScoreValue >= 80 ? "up" : healthScoreValue >= 50 ? "flat" : "down";

      // Build competitors array sorted by avgPosition (descending)
      const aggregatedCompetitors = Array.from(compAgg.values())
        .sort((a, b) => a.avgPosition - b.avgPosition)
        .map((c, i) => ({
          rank: i + 1,
          domain: c.domain,
          avgPosition: Math.round(c.avgPosition * 10) / 10,
          trend: c.trend as "up" | "down" | "flat",
          highlightChange: c.highlightChange === 1 ? true : undefined,
        }));

      const data: SEODashboardData = {
        websiteUrl: "Todos los websites",
        kpis: {
          avgPosition: { value: avgPositionValue, change: avgPositionChange, trend: positionTrend },
          estimatedTraffic: {
            value: estimatedTrafficValue,
            change: Math.round(Math.abs(totalTrafficChange)),
            trend: trafficTrend,
          },
          backlinks: { value: backlinksValue, change: 0, trend: "flat" },
          healthScore: { value: healthScoreValue, change: 0, trend: healthTrend },
        },
        rankingHistory: aggregatedHistory,
        competitors: aggregatedCompetitors,
        keywords: allKwRows.map((k) => ({
          id: k.id,
          keyword: k.keyword,
          position: k.position,
          change: k.change,
          volume: k.volume,
          difficulty: k.difficulty as "easy" | "medium" | "hard",
          history: JSON.parse(k.history) as number[],
          isTop3: k.isTop3 === 1,
          isFalling: k.isFalling === 1,
          websiteDomain: k.websiteDomain,
        })),
      };

      return Response.json({ data });
    }

    // ── Single-website dashboard (existing behavior) ──
    const website = verifyWebsiteOwnership(websiteId, tenantId);

    const kwRows = db.select().from(keywords).where(eq(keywords.websiteId, websiteId)).all();
    const compRows = db
      .select()
      .from(competitors)
      .where(eq(competitors.websiteId, websiteId))
      .all();
    const rankingRows = db
      .select()
      .from(rankingHistory)
      .where(eq(rankingHistory.websiteId, websiteId))
      .all();

    // Calculate real KPI changes from ranking history
    const sortedHistory = sortRankingByDate(rankingRows);

    let positionChange = 0;
    let positionTrend: "up" | "down" | "flat" = "flat";
    if (sortedHistory.length >= 2) {
      const prev = sortedHistory[sortedHistory.length - 2].avgPosition;
      const latest = sortedHistory[sortedHistory.length - 1].avgPosition;
      positionChange = Math.round((prev - latest) * 10) / 10; // positive = improvement (lower position)
      positionTrend = positionChange > 0.1 ? "up" : positionChange < -0.1 ? "down" : "flat";
    }

    // Traffic change based on keyword position improvements
    const trafficChange = kwRows.reduce((sum, kw) => {
      const hist = JSON.parse(kw.history) as number[];
      if (hist.length >= 2) {
        const improvement = hist[hist.length - 2] - hist[hist.length - 1];
        return sum + improvement * (kw.volume / 100);
      }
      return sum;
    }, 0);
    const trafficTrend: "up" | "down" | "flat" =
      trafficChange > 5 ? "up" : trafficChange < -5 ? "down" : "flat";

    // Health trend based on last audit
    const healthTrend: "up" | "down" | "flat" =
      website.healthScore >= 80 ? "up" : website.healthScore >= 50 ? "flat" : "down";

    const data: SEODashboardData = {
      websiteUrl: website.domain,
      kpis: {
        avgPosition: { value: website.avgPosition, change: positionChange, trend: positionTrend },
        estimatedTraffic: {
          value: website.estimatedTraffic,
          change: Math.round(Math.abs(trafficChange)),
          trend: trafficTrend,
        },
        backlinks: { value: website.backlinksCount, change: 0, trend: "flat" },
        healthScore: { value: website.healthScore, change: 0, trend: healthTrend },
      },
      rankingHistory: rankingRows.map((r) => ({
        date: r.date,
        avgPosition: r.avgPosition,
      })),
      competitors: compRows.map((c) => ({
        rank: c.rank,
        domain: c.domain,
        avgPosition: c.avgPosition,
        trend: c.trend as "up" | "down" | "flat",
        highlightChange: c.highlightChange === 1 ? true : undefined,
      })),
      keywords: kwRows.map((k) => ({
        id: k.id,
        keyword: k.keyword,
        position: k.position,
        change: k.change,
        volume: k.volume,
        difficulty: k.difficulty as "easy" | "medium" | "hard",
        history: JSON.parse(k.history) as number[],
        isTop3: k.isTop3 === 1,
        isFalling: k.isFalling === 1,
      })),
    };

    return Response.json({ data });
  } catch (error) {
    if (error instanceof Response) throw error;
    return Response.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
