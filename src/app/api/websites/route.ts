import { db } from "@/db";
import { websites } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    let rows;
    if (tenantId) {
      rows = db.select().from(websites).where(eq(websites.tenantId, tenantId)).all();
    } else {
      rows = db.select().from(websites).all();
    }

    const data = rows.map((w) => ({
      ...w,
      accessTypes: JSON.parse(w.accessTypes) as string[],
    }));
    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: "Failed to fetch websites" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    if (!body.tenantId) {
      return Response.json({ error: "tenantId is required" }, { status: 400 });
    }

    db.insert(websites).values({
      id,
      tenantId: body.tenantId,
      domain: body.domain,
      status: body.status ?? "connected",
      accessTypes: JSON.stringify(body.accessTypes ?? []),
      keywordsCount: body.keywordsCount ?? 0,
      articlesCount: body.articlesCount ?? 0,
      avgPosition: body.avgPosition ?? 0,
      estimatedTraffic: body.estimatedTraffic ?? 0,
      backlinksCount: body.backlinksCount ?? 0,
      healthScore: body.healthScore ?? 0,
      lastAudit: body.lastAudit ?? "",
      errorMessage: body.errorMessage ?? null,
      createdAt: now,
    });

    const newWebsite = db.select().from(websites).where(eq(websites.id, id)).get();
    if (!newWebsite) {
      return Response.json({ error: "Failed to create website" }, { status: 500 });
    }

    return Response.json({
      data: { ...newWebsite, accessTypes: JSON.parse(newWebsite.accessTypes) },
    }, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Failed to create website" }, { status: 500 });
  }
}
