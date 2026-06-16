/**
 * MultiSEO Scheduler — daily automated tasks.
 *
 * Uses node-cron to schedule recurring jobs within the Next.js process.
 * Started from instrumentation.ts on server boot.
 */

import cron from "node-cron";
import { db } from "@/db";
import { websites, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { syncGscForWebsite } from "@/lib/gsc-sync";
import { getTenantSecret } from "@/lib/tenant-secrets";
import { cacheDeletePrefix } from "@/lib/cache";

/** Prevent overlapping sync runs for the same website. */
const runningSyncs = new Set<string>();

let cronJob: ReturnType<typeof cron.schedule> | null = null;

/**
 * Run GSC sync for all active websites that have GSC connected.
 * Skips websites that are already being synced.
 */
export async function runDailyGscSyncForAllActiveWebsites(): Promise<{
  scanned: number;
  succeeded: number;
  failed: number;
  skipped: number;
  results: Array<{
    websiteId: string;
    domain: string;
    keywordsCreated: number;
    keywordsUpdated: number;
    error?: string;
  }>;
}> {
  const allWebsites = db.select().from(websites).all();
  const results: Array<{
    websiteId: string;
    domain: string;
    keywordsCreated: number;
    keywordsUpdated: number;
    error?: string;
  }> = [];
  let scanned = 0;
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (const website of allWebsites) {
    if (runningSyncs.has(website.id)) {
      skipped++;
      continue;
    }

    const tenant = db.select().from(tenants).where(eq(tenants.id, website.tenantId)).get();
    if (!tenant || !getTenantSecret(tenant, "gscRefreshToken")) {
      continue; // Skip websites without GSC
    }

    scanned++;
    runningSyncs.add(website.id);

    try {
      const result = await syncGscForWebsite(website.id);
      if (result.error) {
        failed++;
        results.push({
          websiteId: website.id,
          domain: website.domain,
          keywordsCreated: 0,
          keywordsUpdated: 0,
          error: result.error,
        });
      } else {
        succeeded++;
        results.push({
          websiteId: website.id,
          domain: website.domain,
          keywordsCreated: result.keywordsCreated,
          keywordsUpdated: result.keywordsUpdated,
        });
      }

      // Invalidate rankings cache for this website
      cacheDeletePrefix(`rankings:${website.id}`);
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : "Unknown error";
      results.push({
        websiteId: website.id,
        domain: website.domain,
        keywordsCreated: 0,
        keywordsUpdated: 0,
        error: msg,
      });
    } finally {
      runningSyncs.delete(website.id);
    }

    // Small delay between websites to avoid GSC rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return { scanned, succeeded, failed, skipped, results };
}

/** Start the daily scheduler. Idempotent — safe to call multiple times. */
export function startScheduler(): void {
  if (cronJob) return;

  // Daily at 03:00 UTC (off-peak for GSC API)
  cronJob = cron.schedule("0 3 * * *", async () => {
    console.log("[Scheduler] Daily GSC sync starting...");
    const result = await runDailyGscSyncForAllActiveWebsites();
    console.log(
      `[Scheduler] GSC sync complete: scanned=${result.scanned} ok=${result.succeeded} failed=${result.failed} skipped=${result.skipped}`
    );
    if (result.failed > 0) {
      console.warn(
        "[Scheduler] Sync failures:",
        result.results
          .filter((r) => r.error)
          .map((r) => `${r.domain}: ${r.error}`)
          .join("; ")
      );
    }
  });

  console.log("[Scheduler] Daily GSC sync scheduled for 03:00 UTC");
}

/** Stop the scheduler. Useful for graceful shutdown. */
export function stopScheduler(): void {
  cronJob?.stop();
  cronJob = null;
}
