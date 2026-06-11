import { db } from "@/db";
import { tenants } from "@/db/schema";
import { refreshAccessToken, listSites } from "@/lib/google-search-console";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    if (!tenantId) {
      return Response.json({ error: "tenantId is required" }, { status: 400 });
    }

    const tenant = db.select().from(tenants).where(eq(tenants.id, tenantId)).get();
    if (!tenant || !tenant.gscRefreshToken) {
      return Response.json({ error: "GSC not connected" }, { status: 400 });
    }

    // Refresh token
    let accessToken = tenant.gscAccessToken;
    try {
      const refreshed = await refreshAccessToken(tenant.gscRefreshToken);
      accessToken = refreshed.access_token;
      db.update(tenants).set({ gscAccessToken: accessToken }).where(eq(tenants.id, tenantId)).run();
    } catch {
      if (!accessToken) {
        return Response.json({ error: "Token expired" }, { status: 401 });
      }
    }

    const sites = await listSites(accessToken);

    // Update stored site URL if we have one and none is set
    if (sites.length > 0 && !tenant.gscSiteUrl) {
      db.update(tenants)
        .set({ gscSiteUrl: sites[0] })
        .where(eq(tenants.id, tenantId))
        .run();
    }

    return Response.json({ data: { sites } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list sites";
    return Response.json({ error: message }, { status: 500 });
  }
}
