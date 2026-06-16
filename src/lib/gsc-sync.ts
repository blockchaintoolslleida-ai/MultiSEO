/**
 * GSC Sync Engine — reusable library for syncing Google Search Console data.
 *
 * Extracted from the API route so it can be called from:
 * - Manual "Sincronizar GSC" button
 * - Daily cron scheduler
 * - POST /api/gsc/sync-all admin endpoint
 */

import { db } from "@/db";
import { tenants, websites, keywords, rankingHistory, keywordRankingHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { refreshAccessToken, getSearchAnalyticsPaginated } from "@/lib/google-search-console";
import { getTenantSecret, setTenantSecret } from "@/lib/tenant-secrets";

export interface GscSyncResult {
  websiteId: string;
  keywordsCreated: number;
  keywordsUpdated: number;
  dailySnapshotsAdded: number;
  avgPosition: number;
  totalClicks: number;
  totalImpressions: number;
  error?: string;
}

/**
 * Sync GSC data for a single website.
 * Silently returns an error string if GSC is not connected or the sync fails.
 */
export async function syncGscForWebsite(websiteId: string): Promise<GscSyncResult> {
  // 1. Look up website
  const website = db.select().from(websites).where(eq(websites.id, websiteId)).get();
  if (!website) {
    return {
      websiteId,
      keywordsCreated: 0,
      keywordsUpdated: 0,
      dailySnapshotsAdded: 0,
      avgPosition: 0,
      totalClicks: 0,
      totalImpressions: 0,
      error: "Website not found",
    };
  }

  // 2. Look up tenant
  const tenant = db.select().from(tenants).where(eq(tenants.id, website.tenantId)).get();
  if (!tenant) {
    return {
      websiteId,
      keywordsCreated: 0,
      keywordsUpdated: 0,
      dailySnapshotsAdded: 0,
      avgPosition: 0,
      totalClicks: 0,
      totalImpressions: 0,
      error: "Tenant not found",
    };
  }

  // 3. Check GSC connection
  if (!getTenantSecret(tenant, "gscRefreshToken")) {
    return {
      websiteId,
      keywordsCreated: 0,
      keywordsUpdated: 0,
      dailySnapshotsAdded: 0,
      avgPosition: 0,
      totalClicks: 0,
      totalImpressions: 0,
      error: "GSC not connected",
    };
  }

  // 4. Refresh access token
  let accessToken = getTenantSecret(tenant, "gscAccessToken");
  try {
    const refreshToken = getTenantSecret(tenant, "gscRefreshToken");
    const refreshed = await refreshAccessToken(refreshToken!);
    accessToken = refreshed.access_token;
    db.update(tenants)
      .set({ gscAccessToken: setTenantSecret(accessToken!) })
      .where(eq(tenants.id, website.tenantId))
      .run();
  } catch {
    if (!accessToken) {
      return {
        websiteId,
        keywordsCreated: 0,
        keywordsUpdated: 0,
        dailySnapshotsAdded: 0,
        avgPosition: 0,
        totalClicks: 0,
        totalImpressions: 0,
        error: "GSC token refresh failed",
      };
    }
  }

  // 5. Determine site URL
  const siteUrl = website.gscSiteUrl || tenant.gscSiteUrl;
  if (!siteUrl) {
    return {
      websiteId,
      keywordsCreated: 0,
      keywordsUpdated: 0,
      dailySnapshotsAdded: 0,
      avgPosition: 0,
      totalClicks: 0,
      totalImpressions: 0,
      error: "No GSC site URL configured",
    };
  }

  // 6. Fetch search analytics with pagination (last 28 days, up to 500 rows)
  const endDate = new Date().toISOString().split("T")[0];
  const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const rows = await getSearchAnalyticsPaginated(
    accessToken,
    siteUrl,
    startDate,
    endDate,
    250,
    500
  );

  if (rows.length === 0) {
    // Update website sync timestamp anyway
    db.update(websites)
      .set({ lastGscSync: new Date().toISOString() })
      .where(eq(websites.id, websiteId))
      .run();
    return {
      websiteId,
      keywordsCreated: 0,
      keywordsUpdated: 0,
      dailySnapshotsAdded: 0,
      avgPosition: 0,
      totalClicks: 0,
      totalImpressions: 0,
    };
  }

  // 7. Upsert keywords
  const existingKws = db.select().from(keywords).where(eq(keywords.websiteId, websiteId)).all();
  const existingMap = new Map(existingKws.map((k) => [k.keyword, k]));
  const todayISO = new Date().toISOString().split("T")[0];

  let newCount = 0;
  let updatedCount = 0;
  let snapshotsAdded = 0;

  for (const row of rows) {
    const position = Math.round(row.position * 10) / 10;
    const existing = existingMap.get(row.query);

    let keywordId: string;

    if (existing) {
      keywordId = existing.id;
      const history = (() => {
        try {
          return JSON.parse(existing.history);
        } catch {
          return [];
        }
      })();
      history.push(position);
      if (history.length > 30) history.shift();

      const currentChange = existing.position - position;
      const previousChange =
        history.length >= 2 ? history[history.length - 2] - history[history.length - 3] || 0 : 0;
      const isFalling =
        history.length >= 2 && history[history.length - 1] > history[history.length - 2] ? 1 : 0;

      db.update(keywords)
        .set({
          position,
          change: Math.round(currentChange),
          volume: row.impressions,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          difficulty: position <= 6 ? "easy" : position <= 20 ? "medium" : "hard",
          isTop3: position <= 3 ? 1 : 0,
          isFalling,
          history: JSON.stringify(history),
        })
        .where(eq(keywords.id, existing.id))
        .run();
      updatedCount++;
      existingMap.delete(row.query);
    } else {
      keywordId = crypto.randomUUID();
      db.insert(keywords)
        .values({
          id: keywordId,
          websiteId,
          keyword: row.query,
          position,
          change: 0,
          volume: row.impressions,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          difficulty: position <= 6 ? "easy" : position <= 20 ? "medium" : "hard",
          history: JSON.stringify([position]),
          isTop3: position <= 3 ? 1 : 0,
          isFalling: 0,
        })
        .run();
      newCount++;
    }

    // 8. Insert daily snapshot (skip if already exists for today)
    const existingSnapshot = db
      .select()
      .from(keywordRankingHistory)
      .where(eq(keywordRankingHistory.keywordId, keywordId))
      .all()
      .find((r) => r.date === todayISO);

    if (!existingSnapshot) {
      db.insert(keywordRankingHistory)
        .values({
          keywordId,
          date: todayISO,
          position,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
        })
        .run();
      snapshotsAdded++;
    }
  }

  // 9. Update website KPIs
  const updatedKws = db.select().from(keywords).where(eq(keywords.websiteId, websiteId)).all();
  const avgPos =
    updatedKws.length > 0
      ? Math.round((updatedKws.reduce((sum, k) => sum + k.position, 0) / updatedKws.length) * 10) /
        10
      : 0;
  const totalClicks = updatedKws.reduce((sum, k) => sum + k.clicks, 0);
  const totalImpressions = updatedKws.reduce((sum, k) => sum + k.impressions, 0);

  db.update(websites)
    .set({
      keywordsCount: updatedKws.length,
      avgPosition: avgPos,
      estimatedTraffic: Math.round(totalImpressions * 0.032),
      lastGscSync: new Date().toISOString(),
    })
    .where(eq(websites.id, websiteId))
    .run();

  // 10. Add website-level ranking history point
  const todayLabel = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const existingRh = db
    .select()
    .from(rankingHistory)
    .where(eq(rankingHistory.websiteId, websiteId))
    .all()
    .find((r) => r.date === todayLabel);

  if (!existingRh) {
    db.insert(rankingHistory).values({ websiteId, date: todayLabel, avgPosition: avgPos }).run();
  }

  return {
    websiteId,
    keywordsCreated: newCount,
    keywordsUpdated: updatedCount,
    dailySnapshotsAdded: snapshotsAdded,
    avgPosition: avgPos,
    totalClicks,
    totalImpressions,
  };
}
