import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId, FORBIDDEN_ERROR } from "@/lib/tenant";
import { getTenantSecret, setTenantSecret } from "@/lib/tenant-secrets";

function maskKey(key: string): string {
  if (!key || key.length <= 8) return "***";
  return key.slice(0, 4) + "***" + key.slice(-2);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userTenantId = getTenantId(request);

    if (id !== userTenantId) {
      throw FORBIDDEN_ERROR;
    }

    const tenant = db.select().from(tenants).where(eq(tenants.id, id)).get();
    if (!tenant) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    let geoProviderKeys: Record<string, string> = {};
    try {
      geoProviderKeys = JSON.parse(getTenantSecret(tenant, "geoProviderKeys") || "{}");
    } catch { /* ignore */ }

    let geoEnabledProviders: string[] = [];
    try {
      geoEnabledProviders = JSON.parse(tenant.geoEnabledProviders || '["deepseek"]');
    } catch { /* ignore */ }

    // Mask all API keys
    const maskedKeys: Record<string, string> = {};
    for (const [k, v] of Object.entries(geoProviderKeys)) {
      maskedKeys[k] = v ? maskKey(v) : "";
    }

    const deepseekKey = getTenantSecret(tenant, "deepseekApiKey");
    const telegramToken = getTenantSecret(tenant, "telegramBotToken");

    return Response.json({
      data: {
        geoProviderKeys: maskedKeys,
        geoEnabledProviders,
        deepseekApiKey: deepseekKey ? maskKey(deepseekKey) : "",
        gscConnected: tenant.gscConnected === 1,
        gscSiteUrl: tenant.gscSiteUrl ?? "",
        telegramBotToken: telegramToken ? maskKey(telegramToken) : "",
        telegramChatId: getTenantSecret(tenant, "telegramChatId") ?? "",
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    const msg = error instanceof Error ? error.message : "Failed to fetch settings";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userTenantId = getTenantId(request);

    if (id !== userTenantId) {
      throw FORBIDDEN_ERROR;
    }

    const existing = db.select().from(tenants).where(eq(tenants.id, id)).get();
    if (!existing) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.deepseekApiKey !== undefined) updateData.deepseekApiKey = setTenantSecret(body.deepseekApiKey);
    if (body.telegramBotToken !== undefined) updateData.telegramBotToken = setTenantSecret(body.telegramBotToken);
    if (body.telegramChatId !== undefined) updateData.telegramChatId = setTenantSecret(body.telegramChatId);

    // Merge geoProviderKeys
    if (body.geoProviderKeys !== undefined) {
      const current: Record<string, string> = (() => {
        try { return JSON.parse(getTenantSecret(existing, "geoProviderKeys") || "{}"); } catch { return {}; }
      })();
      const merged = { ...current, ...body.geoProviderKeys };
      updateData.geoProviderKeys = setTenantSecret(JSON.stringify(merged));
    }

    if (body.geoEnabledProviders !== undefined) {
      updateData.geoEnabledProviders = JSON.stringify(body.geoEnabledProviders);
    }

    if (Object.keys(updateData).length > 0) {
      db.update(tenants).set(updateData).where(eq(tenants.id, id)).run();
    }

    // Return updated (masked) settings — reuse GET logic by calling ourselves
    const updated = db.select().from(tenants).where(eq(tenants.id, id)).get();
    let geoProviderKeys: Record<string, string> = {};
    try { geoProviderKeys = JSON.parse(getTenantSecret(updated!, "geoProviderKeys") || "{}"); } catch {}
    let geoEnabledProviders: string[] = [];
    try { geoEnabledProviders = JSON.parse(updated!.geoEnabledProviders || '["deepseek"]'); } catch {}

    const maskedKeys: Record<string, string> = {};
    for (const [k, v] of Object.entries(geoProviderKeys)) {
      maskedKeys[k] = v ? maskKey(v) : "";
    }

    const deepseekKey = getTenantSecret(updated!, "deepseekApiKey");
    const telegramToken = getTenantSecret(updated!, "telegramBotToken");

    return Response.json({
      data: {
        geoProviderKeys: maskedKeys,
        geoEnabledProviders,
        deepseekApiKey: deepseekKey ? maskKey(deepseekKey) : "",
        gscConnected: updated!.gscConnected === 1,
        gscSiteUrl: updated!.gscSiteUrl ?? "",
        telegramBotToken: telegramToken ? maskKey(telegramToken) : "",
        telegramChatId: getTenantSecret(updated!, "telegramChatId") ?? "",
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    const msg = error instanceof Error ? error.message : "Failed to update settings";
    return Response.json({ error: msg }, { status: 500 });
  }
}
