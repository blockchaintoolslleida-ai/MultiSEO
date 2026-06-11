import { db } from "@/db";
import { reports, websites } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    let rows;
    if (tenantId) {
      const tenantWebsites = db.select({ id: websites.id })
        .from(websites)
        .where(eq(websites.tenantId, tenantId))
        .all();
      const websiteIds = tenantWebsites.map((w) => w.id);

      if (websiteIds.length === 0) {
        return Response.json({ data: [] });
      }

      rows = db.select().from(reports).all().filter((r) =>
        websiteIds.includes(r.websiteId)
      );
    } else {
      rows = db.select().from(reports).all();
    }

    // Build a map of websiteId → domain for websiteUrl
    const allWebsites = db.select().from(websites).all();
    const domainMap = new Map(allWebsites.map((w) => [w.id, w.domain]));

    const data = rows.map((r) => ({
      ...r,
      websiteUrl: domainMap.get(r.websiteId) ?? "",
      metrics: JSON.parse(r.metrics) as Record<string, string>,
      scheduleEnabled: r.scheduleEnabled === 1,
    }));
    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
