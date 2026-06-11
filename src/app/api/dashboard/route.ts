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

    const data: SEODashboardData = {
      websiteUrl: website.domain,
      kpis: {
        avgPosition: { value: website.avgPosition, change: 2.1, trend: "up" },
        estimatedTraffic: { value: website.estimatedTraffic, change: 12.3, trend: "up" },
        backlinks: { value: website.backlinksCount, change: 48, trend: "up" },
        healthScore: { value: website.healthScore, change: 5, trend: "up" },
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
