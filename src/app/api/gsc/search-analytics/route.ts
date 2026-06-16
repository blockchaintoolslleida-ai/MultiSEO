import { db } from "@/db";
import { tenants, websites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";
import { getTenantSecret } from "@/lib/tenant-secrets";
import { syncGscForWebsite } from "@/lib/gsc-sync";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { websiteId } = body;

    if (!websiteId) {
      return Response.json({ error: "websiteId is required" }, { status: 400 });
    }

    const tenantId = getTenantId(request);
    verifyWebsiteOwnership(websiteId, tenantId);

    const tenant = db.select().from(tenants).where(eq(tenants.id, tenantId)).get();
    if (!tenant) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    if (!getTenantSecret(tenant, "gscRefreshToken")) {
      return Response.json(
        { error: "Google Search Console not connected. Go to Configuración → Conectar GSC." },
        { status: 400 }
      );
    }

    const website = db.select().from(websites).where(eq(websites.id, websiteId)).get();
    const siteUrl = body.siteUrl || website?.gscSiteUrl || tenant.gscSiteUrl;

    if (!siteUrl) {
      return Response.json(
        {
          error:
            "No hay URL de sitio GSC configurada. Ve a Configuración → GSC → Buscar sitios para detectar tus propiedades verificadas.",
        },
        { status: 400 }
      );
    }

    const result = await syncGscForWebsite(websiteId);

    if (result.error) {
      // Improve INVALID_ARGUMENT message
      if (result.error.includes("INVALID_ARGUMENT")) {
        return Response.json(
          {
            error:
              "El sitio GSC configurado no es válido para tu cuenta. Ve a Configuración → GSC → Buscar sitios para detectar tus propiedades verificadas y seleccionar la correcta.",
          },
          { status: 400 }
        );
      }
      return Response.json({ error: result.error }, { status: 500 });
    }

    return Response.json({
      data: {
        keywordsImported: result.keywordsCreated,
        keywordsUpdated: result.keywordsUpdated,
        totalKeywords: result.keywordsCreated + result.keywordsUpdated,
        avgPosition: result.avgPosition,
        totalImpressions: result.totalImpressions,
        totalClicks: result.totalClicks,
        dailySnapshotsAdded: result.dailySnapshotsAdded,
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    const message = error instanceof Error ? error.message : "GSC sync failed";
    if (message.includes("INVALID_ARGUMENT")) {
      return Response.json(
        {
          error:
            "El sitio GSC configurado no es válido para tu cuenta. Ve a Configuración → GSC → Buscar sitios para detectar tus propiedades verificadas y seleccionar la correcta.",
        },
        { status: 400 }
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
