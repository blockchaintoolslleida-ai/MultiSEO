import { db } from "@/db";
import { websites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId } from "@/lib/tenant";
import { parseBody, validationErrorResponse } from "@/lib/validate";
import { z, ZodError } from "zod";

const websiteCreateSchema = z.object({
  domain: z.string().min(1, "Domain is required"),
  status: z.enum(["connected", "no-access", "error"]).default("connected"),
  accessTypes: z.array(z.string()).default([]),
});

export async function GET(request: Request) {
  try {
    const tenantId = getTenantId(request);
    const rows = db.select().from(websites).where(eq(websites.tenantId, tenantId)).all();

    const data = rows.map((w) => ({
      ...w,
      accessTypes: JSON.parse(w.accessTypes) as string[],
    }));
    return Response.json({ data });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Failed to fetch websites" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tenantId = getTenantId(request);
    const body = await parseBody(request, websiteCreateSchema);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.insert(websites).values({
      id,
      tenantId,
      domain: body.domain,
      status: body.status,
      accessTypes: JSON.stringify(body.accessTypes),
      keywordsCount: 0,
      articlesCount: 0,
      avgPosition: 0,
      estimatedTraffic: 0,
      backlinksCount: 0,
      healthScore: 0,
      lastAudit: "",
      errorMessage: null,
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
    if (error instanceof ZodError) return validationErrorResponse(error);
    if (error instanceof Response) return error;
    return Response.json({ error: "Failed to create website" }, { status: 500 });
  }
}
