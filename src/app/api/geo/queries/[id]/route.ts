import { db } from "@/db";
import { geoQueries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId(request);

  try {
    const { id } = await params;

    const existing = db
      .select()
      .from(geoQueries)
      .where(eq(geoQueries.id, id))
      .get();

    if (!existing) {
      return Response.json({ error: "GEO query not found" }, { status: 404 });
    }

    verifyWebsiteOwnership(existing.websiteId, tenantId);

    // Only manual queries can be deleted
    if (existing.source !== "manual") {
      return Response.json(
        {
          error:
            "Only manually created queries can be deleted. SEO-generated queries can be disabled instead.",
        },
        { status: 400 }
      );
    }

    db.delete(geoQueries).where(eq(geoQueries.id, id)).run();

    return Response.json({ data: { deleted: true } });
  } catch (error) {
    if (error instanceof Response) throw error;
    return Response.json({ error: "Failed to delete GEO query" }, { status: 500 });
  }
}
