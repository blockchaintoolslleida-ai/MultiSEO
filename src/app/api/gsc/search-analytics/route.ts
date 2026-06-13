import { db } from "@/db";
import { tenants, websites, keywords, rankingHistory } from "@/db/schema";
import { refreshAccessToken, getSearchAnalytics } from "@/lib/google-search-console";
import { eq } from "drizzle-orm";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";
import { getTenantSecret, setTenantSecret } from "@/lib/tenant-secrets";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { websiteId } = body;

    if (!websiteId) {
      return Response.json({ error: "websiteId is required" }, { status: 400 });
    }

    const tenantId = getTenantId(request);
    verifyWebsiteOwnership(websiteId, tenantId);

    // Get tenant with GSC tokens
    const tenant = db.select().from(tenants).where(eq(tenants.id, tenantId)).get();
    if (!tenant) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    if (!getTenantSecret(tenant, "gscRefreshToken")) {
      return Response.json(
        { error: "Google Search Console not connected. Go to Configuración → Conectar GSC." },
        { status: 400 }
      );
    }

    // Refresh access token
    let accessToken = getTenantSecret(tenant, "gscAccessToken");
    try {
      const refreshToken = getTenantSecret(tenant, "gscRefreshToken");
      const refreshed = await refreshAccessToken(refreshToken!);
      accessToken = refreshed.access_token;
      // Update stored token
      db.update(tenants)
        .set({ gscAccessToken: setTenantSecret(accessToken!) })
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

    // Determine site URL for GSC (from body → tenant setting)
    const siteUrl = body.siteUrl || tenant.gscSiteUrl;

    if (!siteUrl) {
      return Response.json(
        {
          error:
            "No hay URL de sitio GSC configurada. Ve a Configuración → GSC → Buscar sitios para detectar tus propiedades verificadas.",
        },
        { status: 400 }
      );
    }

    // Fetch search analytics (last 28 days)
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const rows = await getSearchAnalytics(accessToken, siteUrl, startDate, endDate, 50);

    if (rows.length === 0) {
      return Response.json({
        data: {
          keywordsImported: 0,
          keywordsUpdated: 0,
          message:
            "No search analytics data found for this site. Make sure the site is verified in Google Search Console.",
        },
      });
    }

    // Get existing keywords for upsert
    const existingKws = db.select().from(keywords).where(eq(keywords.websiteId, websiteId)).all();
    const existingMap = new Map(existingKws.map((k) => [k.keyword, k]));

    let newCount = 0;
    let updatedCount = 0;

    // Upsert keywords from GSC data
    for (const row of rows) {
      const existing = existingMap.get(row.query);
      const position = Math.round(row.position * 10) / 10;

      if (existing) {
        // Update existing keyword
        const history = (() => {
          try {
            return JSON.parse(existing.history);
          } catch {
            return [];
          }
        })();
        history.push(position);
        if (history.length > 30) history.shift(); // Keep last 30 data points

        db.update(keywords)
          .set({
            position,
            volume: row.impressions,
            difficulty: position <= 6 ? "easy" : position <= 20 ? "medium" : "hard",
            isTop3: position <= 3 ? 1 : 0,
            isFalling:
              history.length >= 2 && history[history.length - 1] > history[history.length - 2]
                ? 1
                : 0,
            history: JSON.stringify(history),
          })
          .where(eq(keywords.id, existing.id))
          .run();
        updatedCount++;
        existingMap.delete(row.query);
      } else {
        // Insert new keyword
        db.insert(keywords)
          .values({
            id: crypto.randomUUID(),
            websiteId,
            keyword: row.query,
            position,
            change: 0,
            volume: row.impressions,
            difficulty: position <= 6 ? "easy" : position <= 20 ? "medium" : "hard",
            history: JSON.stringify([position]),
            isTop3: position <= 3 ? 1 : 0,
            isFalling: 0,
          })
          .run();
        newCount++;
      }
    }

    // Keywords no longer in GSC → don't delete, just let them age naturally
    // (users can manage them via Rankings page)

    // Update website KPIs
    const updatedKws = db.select().from(keywords).where(eq(keywords.websiteId, websiteId)).all();
    if (updatedKws.length > 0) {
      const avgPos = updatedKws.reduce((sum, k) => sum + k.position, 0) / updatedKws.length;
      const totalVolume = updatedKws.reduce((sum, k) => sum + k.volume, 0);

      db.update(websites)
        .set({
          keywordsCount: updatedKws.length,
          avgPosition: Math.round(avgPos * 10) / 10,
          estimatedTraffic: Math.round(totalVolume * 0.032),
          lastGscSync: new Date().toISOString(),
        })
        .where(eq(websites.id, websiteId))
        .run();
    }

    // Add ranking history point
    const avgPos =
      updatedKws.length > 0
        ? Math.round(
            (updatedKws.reduce((sum, k) => sum + k.position, 0) / updatedKws.length) * 10
          ) / 10
        : 0;

    db.insert(rankingHistory)
      .values({
        websiteId,
        date: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
        avgPosition: avgPos,
      })
      .run();

    // Note: Competitors are now managed manually via /competitors page.
    // GSC sync no longer creates fake competitors.

    return Response.json({
      data: {
        keywordsImported: newCount,
        keywordsUpdated: updatedCount,
        totalKeywords: updatedKws.length,
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
    if (error instanceof Response) throw error;
    const message = error instanceof Error ? error.message : "GSC sync failed";
    // Improve INVALID_ARGUMENT message
    if (message.includes("INVALID_ARGUMENT")) {
      return Response.json(
        {
          error:
            "El sitio GSC configurado no es válido para tu cuenta. Ve a Configuración → GSC → Buscar sitios para detectar tus propiedades verificadas y seleccionar la correcta.",
        },
        { status: 400 }
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
