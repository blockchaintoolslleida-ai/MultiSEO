import { db } from "@/db";
import { tenants } from "@/db/schema";
import { refreshAccessToken, listSites } from "@/lib/google-search-console";
import { eq } from "drizzle-orm";
import { getTenantId } from "@/lib/tenant";
import { getTenantSecret, setTenantSecret } from "@/lib/tenant-secrets";

export async function GET(request: Request) {
  try {
    const tenantId = getTenantId(request);

    const tenant = db.select().from(tenants).where(eq(tenants.id, tenantId)).get();
    if (!tenant || !getTenantSecret(tenant, "gscRefreshToken")) {
      return Response.json({ error: "GSC not connected" }, { status: 400 });
    }

    // Refresh token
    let accessToken = getTenantSecret(tenant, "gscAccessToken");
    try {
      const refreshToken = getTenantSecret(tenant, "gscRefreshToken");
      const refreshed = await refreshAccessToken(refreshToken!);
      accessToken = refreshed.access_token;
      db.update(tenants).set({ gscAccessToken: setTenantSecret(accessToken!) }).where(eq(tenants.id, tenantId)).run();
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
    if (error instanceof Response) throw error;
    const message = error instanceof Error ? error.message : "Failed to list sites";
    return Response.json({ error: message }, { status: 500 });
  }
}
