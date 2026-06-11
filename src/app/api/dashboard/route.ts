import { db } from "@/db";
import { websites, keywords, competitors, rankingHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { SEODashboardData } from "@/types/seo";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");

    if (!websiteId) {
      return Response.json({ error: "websiteId query parameter is required" }, { status: 400 });
    }

    const website = db.select().from(websites).where(eq(websites.id, websiteId)).get();
    if (!website) {
      return Response.json({ error: "Website not found" }, { status: 404 });
    }

    const kwRows = db.select().from(keywords).where(eq(keywords.websiteId, websiteId)).all();
    const compRows = db.select().from(competitors).where(eq(competitors.websiteId, websiteId)).all();
    const rankingRows = db.select().from(rankingHistory).where(eq(rankingHistory.websiteId, websiteId)).all();

    // Calculate real KPI changes from ranking history
    const sortedHistory = [...rankingRows].sort((a, b) => {
      // Parse dates like "10 May", "1 Jun" for comparison
      const months: Record<string, number> = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11 };
      const parseDate = (d: string) => {
        const [day, month] = d.split(" ");
        return months[month.toLowerCase()] * 100 + parseInt(day);
      };
      return parseDate(a.date) - parseDate(b.date);
    });

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
    const trafficTrend: "up" | "down" | "flat" = trafficChange > 5 ? "up" : trafficChange < -5 ? "down" : "flat";

    // Health trend based on last audit
    const healthTrend: "up" | "down" | "flat" = website.healthScore >= 80 ? "up" : website.healthScore >= 50 ? "flat" : "down";

    const data: SEODashboardData = {
      websiteUrl: website.domain,
      kpis: {
        avgPosition: { value: website.avgPosition, change: positionChange, trend: positionTrend },
        estimatedTraffic: { value: website.estimatedTraffic, change: Math.round(Math.abs(trafficChange)), trend: trafficTrend },
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
    return Response.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
