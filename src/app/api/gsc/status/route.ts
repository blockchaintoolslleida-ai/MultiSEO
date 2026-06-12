import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const tenantId = getTenantId(request);

    const tenant = db.select().from(tenants).where(eq(tenants.id, tenantId)).get();
    if (!tenant) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    return Response.json({
      data: {
        connected: tenant.gscConnected === 1,
        siteUrl: tenant.gscSiteUrl ?? "",
        hasRefreshToken: !!tenant.gscRefreshToken,
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    const message = error instanceof Error ? error.message : "Failed to check GSC status";
    return Response.json({ error: message }, { status: 500 });
  }
}
