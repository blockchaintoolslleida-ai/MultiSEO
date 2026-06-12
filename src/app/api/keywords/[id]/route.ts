import { db } from "@/db";
import { keywords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = getTenantId(request);

  try {
    const { id } = await params;
    const existing = db.select().from(keywords).where(eq(keywords.id, id)).get();
    if (!existing) {
      return Response.json({ error: "Keyword not found" }, { status: 404 });
    }

    verifyWebsiteOwnership(existing.websiteId, tenantId);

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.position !== undefined) {
      updateData.position = body.position;
      updateData.isTop3 = body.position <= 3 ? 1 : 0;

      // Update history (immutable: push then trim to last 30)
      const rawHistory: number[] = (() => { try { return JSON.parse(existing.history); } catch { return []; } })();
      const newHistory = [...rawHistory, body.position].slice(-30);
      updateData.history = JSON.stringify(newHistory);

      // Compute change from last known position
      updateData.change = body.position - existing.position;
      updateData.isFalling = body.position > existing.position && (body.position - existing.position) > 2 ? 1 : 0;
    }
    if (body.volume !== undefined) updateData.volume = body.volume;
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;

    if (Object.keys(updateData).length > 0) {
      db.update(keywords).set(updateData).where(eq(keywords.id, id)).run();
    }

    const updated = db.select().from(keywords).where(eq(keywords.id, id)).get();
    return Response.json({
      data: {
        ...updated,
        history: (() => { try { return JSON.parse(updated!.history); } catch { return []; } })(),
        isTop3: updated!.isTop3 === 1,
        isFalling: updated!.isFalling === 1,
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    const msg = error instanceof Error ? error.message : "Failed to update keyword";
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
    const existing = db.select().from(keywords).where(eq(keywords.id, id)).get();
    if (!existing) {
      return Response.json({ error: "Keyword not found" }, { status: 404 });
    }

    verifyWebsiteOwnership(existing.websiteId, tenantId);

    db.delete(keywords).where(eq(keywords.id, id)).run();

    // Update website keywords count
    const { websites } = await import("@/db/schema");
    const remaining = db.select().from(keywords).where(eq(keywords.websiteId, existing.websiteId)).all();
    const avgPos = remaining.length > 0
      ? Math.round((remaining.reduce((s, k) => s + k.position, 0) / remaining.length) * 10) / 10
      : 0;
    db.update(websites)
      .set({ keywordsCount: remaining.length, avgPosition: avgPos })
      .where(eq(websites.id, existing.websiteId))
      .run();

    return Response.json({ data: { deleted: true } });
  } catch (error) {
    if (error instanceof Response) throw error;
    const msg = error instanceof Error ? error.message : "Failed to delete keyword";
    return Response.json({ error: msg }, { status: 500 });
  }
}
