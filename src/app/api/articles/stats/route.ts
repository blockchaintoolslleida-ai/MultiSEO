import { db } from "@/db";
import { articles, websites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const tenantId = getTenantId(request);

    const websiteIds = db.select({ id: websites.id })
      .from(websites)
      .where(eq(websites.tenantId, tenantId))
      .all()
      .map((w) => w.id);

    const all = db.select().from(articles).all();
    const filtered = all.filter((a) => websiteIds.includes(a.websiteId));

    const stats = {
      total: filtered.length,
      published: filtered.filter((a) => a.status === "published").length,
      draft: filtered.filter((a) => a.status === "draft").length,
      scheduled: filtered.filter((a) => a.status === "scheduled").length,
      generating: filtered.filter((a) => a.status === "generating").length,
    };
    return Response.json({ data: stats });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Failed to fetch article stats" }, { status: 500 });
  }
}
