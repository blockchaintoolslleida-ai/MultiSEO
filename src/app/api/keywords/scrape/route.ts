import { db } from "@/db";
import { keywords, competitors, rankingHistory, websites } from "@/db/schema";
import { scrapeWebsiteKeywords } from "@/lib/serp-scraper";
import { eq } from "drizzle-orm";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";

export async function POST(request: Request) {
  const tenantId = getTenantId(request);

  try {
    const body = await request.json();
    const { websiteId } = body;

    if (!websiteId) {
      return Response.json({ error: "websiteId is required" }, { status: 400 });
    }

    const website = verifyWebsiteOwnership(websiteId, tenantId);

    // Get keywords for this website
    const kwList = db.select().from(keywords).where(eq(keywords.websiteId, websiteId)).all();
    const keywordStrings = kwList.map((k) => k.keyword);

    if (keywordStrings.length === 0) {
      return Response.json({ error: "No keywords found for this website" }, { status: 400 });
    }

    // Run Playwright SERP scraper
    const results = await scrapeWebsiteKeywords(website.domain, keywordStrings);

    // Update keyword positions and history in DB
    for (const kw of kwList) {
      const scraped = results.find((r) => r.keyword === kw.keyword);
      if (scraped) {
        const history = JSON.parse(kw.history) as number[];
        history.push(scraped.position);
        // Keep last 16 positions
        const trimmed = history.slice(-16);

        const change = scraped.position - kw.position;

        db.update(keywords)
          .set({
            position: scraped.position,
            change,
            history: JSON.stringify(trimmed),
            isTop3: scraped.position <= 3 ? 1 : 0,
            isFalling: change > 3 ? 1 : 0,
          })
          .where(eq(keywords.id, kw.id))
          .run();
      }
    }

    // Update competitors from scraped data
    const scraped = results[0];
    if (scraped?.topCompetitors?.length) {
      // Delete old competitors for this website
      db.delete(competitors).where(eq(competitors.websiteId, websiteId)).run();

      // Insert scraped competitors
      for (let i = 0; i < scraped.topCompetitors.length; i++) {
        const c = scraped.topCompetitors[i];
        db.insert(competitors)
          .values({
            id: crypto.randomUUID(),
            websiteId,
            rank: i + 2, // rank 1 is the target website
            domain: c.domain,
            avgPosition: c.position,
            trend: "flat",
            highlightChange: 0,
          })
          .run();
      }
    }

    // Update website KPI
    const updatedKws = db.select().from(keywords).where(eq(keywords.websiteId, websiteId)).all();
    if (updatedKws.length > 0) {
      const avgPos =
        updatedKws.reduce((sum, k) => sum + k.position, 0) / updatedKws.length;
      db.update(websites)
        .set({ avgPosition: Math.round(avgPos * 10) / 10 })
        .where(eq(websites.id, websiteId))
        .run();
    }

    // Add ranking history point
    db.insert(rankingHistory)
      .values({
        websiteId,
        date: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
        avgPosition:
          updatedKws.length > 0
            ? Math.round(
                (updatedKws.reduce((sum, k) => sum + k.position, 0) / updatedKws.length) * 10
              ) / 10
            : 0,
      })
      .run();

    return Response.json({
      data: {
        website: website.domain,
        keywordsScraped: results.length,
        avgPosition:
          updatedKws.length > 0
            ? Math.round(
                (updatedKws.reduce((sum, k) => sum + k.position, 0) / updatedKws.length) * 10
              ) / 10
            : 0,
        competitorsUpdated: scraped?.topCompetitors?.length ?? 0,
        results: results.map((r) => ({
          keyword: r.keyword,
          position: r.position,
          url: r.url,
        })),
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    const message = error instanceof Error ? error.message : "Scraping failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
