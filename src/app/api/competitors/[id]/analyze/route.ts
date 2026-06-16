import { db } from "@/db";
import { competitors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";
import { analyzeCompetitor } from "@/lib/competitor-analyzer";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = getTenantId(request);
    const { id } = await params;

    // Verify ownership before analysis
    const comp = db.select().from(competitors).where(eq(competitors.id, id)).get();

    if (!comp) {
      return Response.json({ error: "Competitor not found" }, { status: 404 });
    }

    verifyWebsiteOwnership(comp.websiteId, tenantId);

    const analysis = await analyzeCompetitor(id, tenantId);

    if (!analysis) {
      return Response.json(
        {
          error:
            "DeepSeek API key no configurada. Ve a Configuración → Proveedores IA y añade tu API key de DeepSeek.",
        },
        { status: 400 }
      );
    }

    const updated = db.select().from(competitors).where(eq(competitors.id, id)).get();

    if (!updated) {
      return Response.json({ error: "Competitor not found after analysis" }, { status: 500 });
    }

    return Response.json({
      data: {
        ...updated,
        keywordsOverlap: JSON.parse(updated.keywordsOverlap),
        highlightChange: updated.highlightChange === 1,
        isManual: updated.isManual === 1,
        analysis: {
          summary: analysis.summary,
          discoveredKeywords: analysis.topKeywords,
        },
      },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    const msg = error instanceof Error ? error.message : "Failed to analyze competitor";
    return Response.json({ error: msg }, { status: 500 });
  }
}
