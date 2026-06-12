import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId } from "@/lib/tenant";

export async function POST(request: Request) {
  try {
    const tenantId = getTenantId(request);

    const tenant = db.select().from(tenants).where(eq(tenants.id, tenantId)).get();
    if (!tenant) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    db.update(tenants)
      .set({
        gscRefreshToken: null,
        gscAccessToken: null,
        gscSiteUrl: null,
        gscConnected: 0,
      })
      .where(eq(tenants.id, tenantId))
      .run();

    return Response.json({ data: { disconnected: true } });
  } catch (error) {
    if (error instanceof Response) throw error;
    const msg = error instanceof Error ? error.message : "Disconnect failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
