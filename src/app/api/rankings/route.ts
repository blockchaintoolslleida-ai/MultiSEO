import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";
import { getRankings } from "@/lib/rankings-service";
import { cacheGet, cacheSet } from "@/lib/cache";

const VALID_SORT = ["improved", "declined", "position", "clicks", "impressions"] as const;

/**
 * GET /api/rankings?websiteId=xxx&days=30&sort=position
 *
 * Returns ranked keywords with 30-day history, trends, and summary metrics.
 * Cached for 10 minutes per website/days combination.
 */
export async function GET(request: Request) {
  try {
    const tenantId = getTenantId(request);
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");
    const daysParam = searchParams.get("days");
    const sortParam = searchParams.get("sort");

    if (!websiteId) {
      return Response.json({ error: "websiteId is required" }, { status: 400 });
    }

    verifyWebsiteOwnership(websiteId, tenantId);

    const days = Math.min(Math.max(parseInt(daysParam ?? "30", 10) || 30, 7), 90);
    const sort = VALID_SORT.includes(sortParam as (typeof VALID_SORT)[number])
      ? (sortParam as "improved" | "declined" | "position" | "clicks" | "impressions")
      : "position";

    // Check cache
    const cacheKey = `rankings:${websiteId}:${days}:${sort}`;
    const cached = cacheGet<ReturnType<typeof getRankings>>(cacheKey);
    if (cached) {
      return Response.json({ data: cached });
    }

    const data = getRankings({ websiteId, days, sort });

    // Cache for 10 minutes
    cacheSet(cacheKey, data, 10 * 60_000);

    return Response.json({ data });
  } catch (error) {
    if (error instanceof Response) throw error;
    if (
      error instanceof Error &&
      "status" in error &&
      (error as { status: number }).status === 404
    ) {
      return Response.json({ error: "Website not found" }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Failed to fetch rankings";
    return Response.json({ error: message }, { status: 500 });
  }
}
