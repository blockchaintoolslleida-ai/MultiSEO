import { db } from "@/db";
import { competitors, keywords, websites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";

export async function GET(request: Request) {
  const tenantId = getTenantId(request);

  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");
    const competitorId = searchParams.get("competitorId");

    if (!websiteId || !competitorId) {
      return Response.json(
        { error: "websiteId and competitorId are required" },
        { status: 400 }
      );
    }

    verifyWebsiteOwnership(websiteId, tenantId);

    const competitor = db
      .select()
      .from(competitors)
      .where(eq(competitors.id, competitorId))
      .get();

    if (!competitor || competitor.websiteId !== websiteId) {
      return Response.json(
        { error: "Competitor not found for this website" },
        { status: 404 }
      );
    }

    const myKeywords = db
      .select()
      .from(keywords)
      .where(eq(keywords.websiteId, websiteId))
      .all();

    const compWebsite = db
      .select()
      .from(websites)
      .all()
      .find((w) => w.domain === competitor.domain && w.id !== websiteId);

    const results: {
      keyword: string;
      yourPosition: number;
      competitorPosition: number | null;
      gap: number | null;
    }[] = [];

    for (const kw of myKeywords) {
      let competitorPosition: number | null = null;

      if (compWebsite) {
        const compKw = db
          .select()
          .from(keywords)
          .where(eq(keywords.websiteId, compWebsite.id))
          .all()
          .find((ck) => ck.keyword === kw.keyword);

        competitorPosition = compKw ? compKw.position : null;
      } else {
        try {
          const overlapArr: string[] = JSON.parse(competitor.keywordsOverlap);
          if (overlapArr.includes(kw.id)) {
            competitorPosition = competitor.avgPosition;
          }
        } catch {
          competitorPosition = null;
        }
      }

      if (competitorPosition !== null) {
        results.push({
          keyword: kw.keyword,
          yourPosition: kw.position,
          competitorPosition,
          gap: competitorPosition - kw.position,
        });
      }
    }

    results.sort((a, b) => Math.abs(b.gap!) - Math.abs(a.gap!));

    return Response.json({ data: results });
  } catch (error) {
    if (error instanceof Response) throw error;
    const msg = error instanceof Error ? error.message : "Failed to fetch overlap";
    return Response.json({ error: msg }, { status: 500 });
  }
}
