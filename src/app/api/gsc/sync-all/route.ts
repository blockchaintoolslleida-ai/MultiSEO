import { getTenantId } from "@/lib/tenant";
import { runDailyGscSyncForAllActiveWebsites } from "@/lib/scheduler";

/**
 * POST /api/gsc/sync-all
 *
 * Manually trigger GSC sync for all active websites.
 * Protected by tenant authentication. Useful for admin debugging.
 */
export async function POST(request: Request) {
  try {
    getTenantId(request); // Auth check only — any tenant can trigger

    const result = await runDailyGscSyncForAllActiveWebsites();

    return Response.json({
      data: {
        scanned: result.scanned,
        succeeded: result.succeeded,
        failed: result.failed,
        skipped: result.skipped,
        details: result.results,
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    const message = error instanceof Error ? error.message : "Sync-all failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
