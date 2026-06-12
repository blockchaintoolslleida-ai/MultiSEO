import { db } from "@/db";
import { geoResults } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";

export async function GET(request: Request) {
  const tenantId = getTenantId(request);

  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");

    if (!websiteId) {
      return Response.json(
        { error: "websiteId query parameter is required" },
        { status: 400 }
      );
    }

    const website = verifyWebsiteOwnership(websiteId, tenantId);

    const allResults = db
      .select()
      .from(geoResults)
      .where(eq(geoResults.websiteId, websiteId))
      .all();

    // Count brand mentions
    const brandMentions = allResults.filter((r) => r.brandMentioned === 1).length;

    // Count competitor mentions
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

    const totalMentions =
      brandMentions + [...competitorMap.values()].reduce((a, b) => a + b, 0) || 1;

    const data = [
      {
        domain: website.domain,
        mentions: brandMentions,
        percentage: Math.round((brandMentions / totalMentions) * 100),
        isTarget: true,
      },
      ...[...competitorMap.entries()]
        .map(([domain, mentions]) => ({
          domain,
          mentions,
          percentage: Math.round((mentions / totalMentions) * 100),
          isTarget: false,
        }))
        .sort((a, b) => b.mentions - a.mentions)
        .slice(0, 5),
    ];

    return Response.json({ data });
  } catch (error) {
    if (error instanceof Response) throw error;
    return Response.json({ error: "Failed to fetch share of voice" }, { status: 500 });
  }
}
