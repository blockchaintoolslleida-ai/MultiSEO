import { db } from "@/db";
import { tenants, websites, keywords, competitors, rankingHistory } from "@/db/schema";
import { refreshAccessToken, getSearchAnalytics } from "@/lib/google-search-console";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, websiteId } = body;

    if (!tenantId || !websiteId) {
      return Response.json(
        { error: "tenantId and websiteId are required" },
        { status: 400 }
      );
    }

    // Get tenant with GSC tokens
    const tenant = db.select().from(tenants).where(eq(tenants.id, tenantId)).get();
    if (!tenant) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    if (!tenant.gscRefreshToken) {
      return Response.json(
        { error: "Google Search Console not connected. Go to Configuración → Conectar GSC." },
        { status: 400 }
      );
    }

    const website = db.select().from(websites).where(eq(websites.id, websiteId)).get();
    if (!website) {
      return Response.json({ error: "Website not found" }, { status: 404 });
    }

    // Refresh access token
    let accessToken = tenant.gscAccessToken;
    try {
      const refreshed = await refreshAccessToken(tenant.gscRefreshToken);
      accessToken = refreshed.access_token;
      // Update stored token
      db.update(tenants)
        .set({ gscAccessToken: accessToken })
        .where(eq(tenants.id, tenantId))
        .run();
    } catch {
      // If refresh fails, try the stored access token (might still be valid for ~1h)
      if (!accessToken) {
        return Response.json(
          { error: "GSC token expired. Please reconnect Google Search Console." },
          { status: 401 }
        );
      }
    }

    // Determine site URL for GSC (from body → tenant setting → domain fallback)
    const siteUrl =
      body.siteUrl ||
      tenant.gscSiteUrl ||
      `sc_domain:${website.domain}`;

    // Fetch search analytics (last 28 days)
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const rows = await getSearchAnalytics(accessToken, siteUrl, startDate, endDate, 50);

    if (rows.length === 0) {
      return Response.json({
        data: {
          keywordsImported: 0,
          message: "No search analytics data found for this site. Make sure the site is verified in Google Search Console.",
        },
      });
    }

    // Delete old keywords for this website and replace with GSC data
    db.delete(keywords).where(eq(keywords.websiteId, websiteId)).run();

    // Insert keywords from GSC data
    for (const row of rows) {
      db.insert(keywords)
        .values({
          id: crypto.randomUUID(),
          websiteId,
          keyword: row.query,
          position: Math.round(row.position * 10) / 10,
          change: 0, // No historical comparison on first import
          volume: row.impressions,
          difficulty: row.position <= 6 ? "easy" : row.position <= 20 ? "medium" : "hard",
          history: JSON.stringify([Math.round(row.position * 10) / 10]),
          isTop3: row.position <= 3 ? 1 : 0,
          isFalling: 0,
        })
        .run();
    }

    // Update website KPIs
    const updatedKws = db.select().from(keywords).where(eq(keywords.websiteId, websiteId)).all();
    if (updatedKws.length > 0) {
      const avgPos =
        updatedKws.reduce((sum, k) => sum + k.position, 0) / updatedKws.length;
      const totalVolume = updatedKws.reduce((sum, k) => sum + k.volume, 0);

      db.update(websites)
        .set({
          keywordsCount: updatedKws.length,
          avgPosition: Math.round(avgPos * 10) / 10,
          estimatedTraffic: Math.round(totalVolume * 0.032), // Rough CTR estimate
        })
        .where(eq(websites.id, websiteId))
        .run();
    }

    // Add ranking history point
    const avgPos =
      updatedKws.length > 0
        ? Math.round((updatedKws.reduce((sum, k) => sum + k.position, 0) / updatedKws.length) * 10) / 10
        : 0;

    db.insert(rankingHistory)
      .values({
        websiteId,
        date: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
        avgPosition: avgPos,
      })
      .run();

    // Build competitor list from top domains in results
    const topKws = [...rows]
      .sort((a, b) => a.position - b.position)
      .slice(0, 5);

    db.delete(competitors).where(eq(competitors.websiteId, websiteId)).run();
    for (let i = 0; i < topKws.length; i++) {
      db.insert(competitors)
        .values({
          id: crypto.randomUUID(),
          websiteId,
          rank: i + 1,
          domain: `competidor-${i + 1}.com`, // Real competitor domains require extra API call
          avgPosition: topKws[i].position,
          trend: "flat",
          highlightChange: 0,
        })
        .run();
    }

    return Response.json({
      data: {
        keywordsImported: rows.length,
        avgPosition: avgPos,
        totalImpressions: rows.reduce((sum, r) => sum + r.impressions, 0),
        totalClicks: rows.reduce((sum, r) => sum + r.clicks, 0),
        topQueries: rows.slice(0, 5).map((r) => ({
          query: r.query,
          position: Math.round(r.position * 10) / 10,
          clicks: r.clicks,
          impressions: r.impressions,
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GSC sync failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
