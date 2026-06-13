import { db } from "@/db";
import { websites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";

/**
 * POST /api/websites/[id]/test
 *
 * Simulates testing a website connection. In production this would
 * actually attempt to reach the site via WordPress REST API, FTP, SSH, or cPanel.
 * For now it validates the website exists, belongs to the tenant, and returns
 * a simulated result based on the current status.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = getTenantId(request);
    verifyWebsiteOwnership(id, tenantId);

    const website = db.select().from(websites).where(eq(websites.id, id)).get();
    if (!website) {
      return Response.json({ error: "Website not found" }, { status: 404 });
    }

    // Simulate connection test with a small delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Attempt a real HTTP check if the domain is reachable
    let testResult: { success: boolean; message: string; status?: string };
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`https://${website.domain}`, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeout);

      testResult = {
        success: true,
        message: `Conexión exitosa a ${website.domain} (HTTP ${response.status})`,
        status: "connected",
      };
    } catch {
      // Domain unreachable — keep current status but report the issue
      const isHttpsError = true;
      testResult = {
        success: false,
        message: isHttpsError
          ? `No se pudo conectar a ${website.domain}. Verifica que el sitio esté accesible.`
          : `Error de conexión con ${website.domain}`,
        status: "error",
      };
    }

    // Update website status based on test result
    if (testResult.status) {
      db.update(websites)
        .set({
          status: testResult.status,
          errorMessage: testResult.success ? null : testResult.message,
          lastAudit: new Date().toISOString().split("T")[0],
        })
        .where(eq(websites.id, id))
        .run();
    }

    return Response.json({ data: testResult });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Failed to test website" }, { status: 500 });
  }
}
