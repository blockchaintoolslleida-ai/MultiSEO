import { db } from "@/db";
import { competitors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId(request);

  try {
    const { id } = await params;
    const existing = db.select().from(competitors).where(eq(competitors.id, id)).get();
    if (!existing) {
      return Response.json({ error: "Competitor not found" }, { status: 404 });
    }

    verifyWebsiteOwnership(existing.websiteId, tenantId);

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.domain !== undefined) updateData.domain = body.domain;
    if (body.avgPosition !== undefined) updateData.avgPosition = body.avgPosition;
    if (body.trend !== undefined) updateData.trend = body.trend;
    if (body.trafficEstimate !== undefined) updateData.trafficEstimate = body.trafficEstimate;
    if (body.keywordsOverlap !== undefined) {
      updateData.keywordsOverlap = JSON.stringify(body.keywordsOverlap);
    }

    updateData.lastUpdated = new Date().toISOString();

    if (Object.keys(updateData).length > 0) {
      db.update(competitors).set(updateData).where(eq(competitors.id, id)).run();
    }

    const updated = db.select().from(competitors).where(eq(competitors.id, id)).get();
    return Response.json({
      data: {
        ...updated,
        keywordsOverlap: JSON.parse(updated!.keywordsOverlap),
        highlightChange: updated!.highlightChange === 1,
        isManual: updated!.isManual === 1,
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    const msg = error instanceof Error ? error.message : "Failed to update competitor";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId(request);

  try {
    const { id } = await params;
    const existing = db.select().from(competitors).where(eq(competitors.id, id)).get();
    if (!existing) {
      return Response.json({ error: "Competitor not found" }, { status: 404 });
    }

    verifyWebsiteOwnership(existing.websiteId, tenantId);

    if (existing.isManual === 0) {
      let hasOverlap = false;
      try {
        const overlap = JSON.parse(existing.keywordsOverlap);
        hasOverlap = overlap.length > 0;
      } catch { /* ignore */ }
      if (hasOverlap) {
        return Response.json(
          { error: "No se puede eliminar un competidor detectado automáticamente con datos de solapamiento." },
          { status: 400 }
        );
      }
    }

    db.delete(competitors).where(eq(competitors.id, id)).run();
    return Response.json({ data: { deleted: true } });
  } catch (error) {
    if (error instanceof Response) throw error;
    const msg = error instanceof Error ? error.message : "Failed to delete competitor";
    return Response.json({ error: msg }, { status: 500 });
  }
}
