import { db } from "@/db";
import { websites, tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");

    if (!websiteId) {
      return Response.json({ error: "websiteId is required" }, { status: 400 });
    }

    const tenantId = getTenantId(request);
    const website = verifyWebsiteOwnership(websiteId, tenantId);

    const tenant = db.select().from(tenants).where(eq(tenants.id, website.tenantId)).get();

    const now = new Date();
    const lastSync = website.lastGscSync ? new Date(website.lastGscSync) : null;
    const minutesAgo = lastSync
      ? Math.round((now.getTime() - lastSync.getTime()) / 60000)
      : null;

    let timeAgoLabel = "Nunca sincronizado";
    if (minutesAgo !== null) {
      if (minutesAgo < 1) timeAgoLabel = "Ahora";
      else if (minutesAgo < 60) timeAgoLabel = `Hace ${minutesAgo} min`;
      else if (minutesAgo < 1440) timeAgoLabel = `Hace ${Math.round(minutesAgo / 60)}h`;
      else timeAgoLabel = `Hace ${Math.round(minutesAgo / 1440)}d`;
    }

    return Response.json({
      data: {
        connected: tenant?.gscConnected === 1,
        hasRefreshToken: !!tenant?.gscRefreshToken,
        lastSync: website.lastGscSync ?? null,
        lastSyncLabel: timeAgoLabel,
        keywordsCount: website.keywordsCount,
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    const msg = error instanceof Error ? error.message : "Failed to fetch sync status";
    return Response.json({ error: msg }, { status: 500 });
  }
}
