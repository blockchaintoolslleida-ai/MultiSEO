import { db } from "@/db";
import { geoQueries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";

export async function GET(request: Request) {
  const tenantId = getTenantId(request);

  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");

    if (!websiteId) {
      return Response.json(
        { error: "websiteId query parameter is required" },
        { status: 400 }
      );
    }

    verifyWebsiteOwnership(websiteId, tenantId);

    const rows = db
      .select()
      .from(geoQueries)
      .where(eq(geoQueries.websiteId, websiteId))
      .all();

    return Response.json({ data: rows });
  } catch (error) {
    if (error instanceof Response) throw error;
    return Response.json({ error: "Failed to fetch GEO queries" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const tenantId = getTenantId(request);

  try {
    const body = await request.json();
    const { websiteId, keyword, query } = body;

    if (!websiteId || !keyword || !query) {
      return Response.json(
        { error: "websiteId, keyword, and query are required" },
        { status: 400 }
      );
    }

    verifyWebsiteOwnership(websiteId, tenantId);

    // Check for duplicate
    const existing = db
      .select()
      .from(geoQueries)
      .where(
        and(eq(geoQueries.websiteId, websiteId), eq(geoQueries.query, query))
      )
      .get();

    if (existing) {
      return Response.json(
        { error: "This query already exists for this website" },
        { status: 409 }
      );
    }

    const id = crypto.randomUUID();
    db.insert(geoQueries)
      .values({
        id,
        websiteId,
        keyword,
        query,
        source: "manual",
        enabled: 1,
        createdAt: new Date().toISOString(),
      })
      .run();

    const created = db.select().from(geoQueries).where(eq(geoQueries.id, id)).get();
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) throw error;
    return Response.json({ error: "Failed to create GEO query" }, { status: 500 });
  }
}
