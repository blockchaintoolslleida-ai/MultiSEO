import { db } from "@/db";
import { websites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const tenantId = getTenantId(request);
    const all = db.select().from(websites).where(eq(websites.tenantId, tenantId)).all();

    const stats = {
      total: all.length,
      connected: all.filter((w) => w.status === "connected").length,
      noAccess: all.filter((w) => w.status === "no-access").length,
      error: all.filter((w) => w.status === "error").length,
    };
    return Response.json({ data: stats });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
