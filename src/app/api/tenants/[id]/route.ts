import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = db.select().from(tenants).where(eq(tenants.id, id)).get();
    if (!existing) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.deepseekApiKey !== undefined) updateData.deepseekApiKey = body.deepseekApiKey;

    if (Object.keys(updateData).length > 0) {
      db.update(tenants).set(updateData).where(eq(tenants.id, id)).run();
    }

    const updated = db.select().from(tenants).where(eq(tenants.id, id)).get();
    return Response.json({ data: updated });
  } catch (error) {
    return Response.json({ error: "Failed to update tenant" }, { status: 500 });
  }
}
