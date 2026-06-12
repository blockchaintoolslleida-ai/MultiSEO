import { db } from "@/db";
import { websites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = db.select().from(websites).where(eq(websites.id, id)).get();
    if (!result) {
      return Response.json({ error: "Website not found" }, { status: 404 });
    }
    return Response.json({
      data: { ...result, accessTypes: JSON.parse(result.accessTypes) },
    });
  } catch (error) {
    return Response.json({ error: "Failed to fetch website" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = getTenantId(request);
    verifyWebsiteOwnership(id, tenantId);

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.domain !== undefined) updateData.domain = body.domain;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.accessTypes !== undefined) updateData.accessTypes = JSON.stringify(body.accessTypes);
    if (body.keywordsCount !== undefined) updateData.keywordsCount = body.keywordsCount;
    if (body.articlesCount !== undefined) updateData.articlesCount = body.articlesCount;
    if (body.avgPosition !== undefined) updateData.avgPosition = body.avgPosition;
    if (body.estimatedTraffic !== undefined) updateData.estimatedTraffic = body.estimatedTraffic;
    if (body.backlinksCount !== undefined) updateData.backlinksCount = body.backlinksCount;
    if (body.healthScore !== undefined) updateData.healthScore = body.healthScore;
    if (body.lastAudit !== undefined) updateData.lastAudit = body.lastAudit;
    if (body.errorMessage !== undefined) updateData.errorMessage = body.errorMessage;

    if (Object.keys(updateData).length > 0) {
      db.update(websites).set(updateData).where(eq(websites.id, id)).run();
    }

    const updated = db.select().from(websites).where(eq(websites.id, id)).get();
    return Response.json({
      data: { ...updated, accessTypes: JSON.parse(updated!.accessTypes) },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Failed to update website" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantId = getTenantId(request);
    verifyWebsiteOwnership(id, tenantId);
    db.delete(websites).where(eq(websites.id, id)).run();
    return Response.json({ data: { deleted: true } });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Failed to delete website" }, { status: 500 });
  }
}
