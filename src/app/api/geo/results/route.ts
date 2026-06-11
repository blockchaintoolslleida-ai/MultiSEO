import { db } from "@/db";
import { geoResults, geoQueries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");

    if (!websiteId) {
      return Response.json(
        { error: "websiteId query parameter is required" },
        { status: 400 }
      );
    }

    // Get all results for this website, newest first
    const allResults = db
      .select()
      .from(geoResults)
      .where(eq(geoResults.websiteId, websiteId))
      .orderBy(desc(geoResults.scannedAt))
      .all();

    // Get all queries
    const queries = db
      .select()
      .from(geoQueries)
      .where(eq(geoQueries.websiteId, websiteId))
      .all();

    // Latest scan timestamp
    const latestScan = allResults[0]?.scannedAt || null;

    // Results from the latest scan only
    const latestResults = latestScan
      ? allResults.filter((r) => r.scannedAt === latestScan)
      : [];

    const brandMentions = latestResults.filter((r) => r.brandMentioned === 1).length;
    const total = latestResults.length || 1;
    const visibility = Math.round((brandMentions / total) * 100);

    // Sentiment from latest scan
    const sentiments = latestResults
      .map((r) => r.sentiment)
      .filter((s): s is string => s !== null);
    const posCount = sentiments.filter((s) => s === "positive").length;
    const negCount = sentiments.filter((s) => s === "negative").length;
    const avgSentiment =
      posCount > negCount ? "positive" : negCount > posCount ? "negative" : "neutral";

    // Share of voice (all-time)
    const allMentions = allResults.filter((r) => r.brandMentioned === 1).length;
    const totalAllTime = allResults.length || 1;
    const shareOfVoice = Math.round((allMentions / totalAllTime) * 100);

    // Active queries count
    const activeQueries = queries.filter((q) => q.enabled === 1).length;

    // Query-level results
    const queryResults = queries.map((q) => {
      const matching = latestResults.filter((r) => r.queryId === q.id);
      const latest = matching[0];
      return {
        queryId: q.id,
        query: q.query,
        keyword: q.keyword,
        brandMentioned: latest?.brandMentioned === 1,
        snippet: latest?.snippet || "",
        sentiment: latest?.sentiment || "neutral",
        provider: latest?.provider || "",
      };
    });

    // Competitor mentions aggregation (all-time)
    const competitorMap = new Map<string, number>();
    for (const r of allResults) {
      try {
        const comps = JSON.parse(r.competitorsMentioned || "[]") as string[];
        for (const c of comps) {
          competitorMap.set(c, (competitorMap.get(c) || 0) + 1);
        }
      } catch {
        // skip malformed JSON
      }
    }
    const competitorMentions = [...competitorMap.entries()]
      .map(([domain, mentions]) => ({ domain, mentions }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 6);

    return Response.json({
      data: {
        kpis: {
          visibility: { value: visibility, change: 0, trend: "flat" as const },
          brandMentions: { value: brandMentions, change: 0, trend: "flat" as const },
          avgSentiment,
          shareOfVoice: { value: shareOfVoice, change: 0, trend: "flat" as const },
          activeQueries: { value: activeQueries },
        },
        queryResults,
        competitorMentions,
        lastScanned: latestScan,
      },
    });
  } catch (error) {
    return Response.json({ error: "Failed to fetch GEO results" }, { status: 500 });
  }
}
