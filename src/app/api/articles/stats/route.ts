import { db } from "@/db";
import { articles, websites } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    let websiteIds: string[] = [];
    if (tenantId) {
      websiteIds = db.select({ id: websites.id })
        .from(websites)
        .where(eq(websites.tenantId, tenantId))
        .all()
        .map((w) => w.id);
    }

    const all = db.select().from(articles).all();
    const filtered = tenantId
      ? all.filter((a) => websiteIds.includes(a.websiteId))
      : all;

    const stats = {
      total: filtered.length,
      published: filtered.filter((a) => a.status === "published").length,
      draft: filtered.filter((a) => a.status === "draft").length,
      scheduled: filtered.filter((a) => a.status === "scheduled").length,
      generating: filtered.filter((a) => a.status === "generating").length,
    };
    return Response.json({ data: stats });
  } catch (error) {
    return Response.json({ error: "Failed to fetch article stats" }, { status: 500 });
  }
}
