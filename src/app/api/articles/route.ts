import { db } from "@/db";
import { articles, websites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const tenantId = getTenantId(request);

    // JOIN articles → websites to filter by tenant
    const tenantWebsites = db.select({ id: websites.id })
      .from(websites)
      .where(eq(websites.tenantId, tenantId))
      .all();
    const websiteIds = tenantWebsites.map((w) => w.id);

    if (websiteIds.length === 0) {
      return Response.json({ data: [] });
    }

    // Filter articles by website IDs belonging to the tenant
    const rows = db.select().from(articles).all().filter((a) =>
      websiteIds.includes(a.websiteId)
    );

    const data = rows.map((a) => ({
      ...a,
      keywords: JSON.parse(a.keywords) as string[],
      seoScores: a.seoScores ? JSON.parse(a.seoScores) : undefined,
      content: a.content ? JSON.parse(a.content) : undefined,
    }));
    return Response.json({ data });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}
