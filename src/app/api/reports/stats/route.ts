import { db } from "@/db";
import { reports, websites } from "@/db/schema";
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

    const all = db.select().from(reports).all();
    const filtered = tenantId
      ? all.filter((r) => websiteIds.includes(r.websiteId))
      : all;

    const stats = {
      total: filtered.length,
      sent: filtered.filter((r) => r.status === "sent").length,
      scheduled: filtered.filter((r) => r.status === "scheduled").length,
      draft: filtered.filter((r) => r.status === "draft").length,
    };
    return Response.json({ data: stats });
  } catch (error) {
    return Response.json({ error: "Failed to fetch report stats" }, { status: 500 });
  }
}
