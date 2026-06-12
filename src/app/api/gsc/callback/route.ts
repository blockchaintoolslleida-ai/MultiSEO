import { db } from "@/db";
import { tenants } from "@/db/schema";
import { exchangeCodeForTokens, listSites } from "@/lib/google-search-console";
import { eq } from "drizzle-orm";
import { getTenantId } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // tenantId

    if (!code) {
      return Response.json({ error: "Missing authorization code" }, { status: 400 });
    }

    if (!state) {
      return Response.json({ error: "Missing state (tenantId)" }, { status: 400 });
    }

    // Verify tenantId from state matches the session tenant.
    // OAuth callbacks may come from a different browser, so fall back
    // to the state value if the header is missing or mismatched.
    let tenantId: string;
    try {
      const headerTenantId = getTenantId(request);
      if (headerTenantId === state) {
        tenantId = headerTenantId;
      } else {
        console.warn(
          `[callback] x-tenant-id (${headerTenantId}) does not match state (${state}), using state value`
        );
        tenantId = state;
      }
    } catch {
      // No x-tenant-id header (cross-browser OAuth flow) — use state
      console.warn(`[callback] No x-tenant-id header, using state value (${state})`);
      tenantId = state;
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // List sites to get the first available one
    let siteUrl = "";
    try {
      const sites = await listSites(tokens.access_token);
      siteUrl = sites[0] ?? "";
    } catch {
      // User might not have verified sites yet — they can set it manually later
    }

    // Store tokens in tenant
    db.update(tenants)
      .set({
        gscRefreshToken: tokens.refresh_token,
        gscAccessToken: tokens.access_token,
        gscSiteUrl: siteUrl,
        gscConnected: 1,
      })
      .where(eq(tenants.id, tenantId))
      .run();

    // Return a success page that closes itself
    return new Response(
      `<!DOCTYPE html>
<html><head><title>GSC Conectado</title>
<style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f0fdf4;color:#166534;text-align:center;flex-direction:column}
h1{font-size:24px;margin-bottom:8px}p{color:#4ade80;font-size:14px}
.check{width:64px;height:64px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:16px}
.check svg{width:32px;height:32px;color:white}</style></head>
<body><div class="check"><svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
<h1>Google Search Console conectado</h1>
<p>${siteUrl ? `Sitio: ${siteUrl}` : "Puedes configurar el sitio manualmente"}</p>
<p style="color:#9ca3af;font-size:12px;margin-top:12px">Cierra esta ventana y vuelve a MultiSEO</p></body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    if (error instanceof Response) throw error;
    const message = error instanceof Error ? error.message : "OAuth callback failed";
    return new Response(
      `<!DOCTYPE html>
<html><head><title>Error GSC</title>
<style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#fef2f2;color:#991b1b;text-align:center;flex-direction:column}
h1{font-size:20px;margin-bottom:8px}p{color:#ef4444;font-size:14px;max-width:400px}</style></head>
<body><h1>Error de conexión</h1><p>${message}</p></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
