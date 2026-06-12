import { db } from "@/db";
import { geoResults, geoQueries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";

export async function GET(request: Request) {
  const tenantId = getTenantId(request);

  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");

    if (!websiteId) {
      return Response.json(
        { error: "websiteId query parameter is required" },
        { status: 400 }
      );
    }

    verifyWebsiteOwnership(websiteId, tenantId);

    const allResults = db
      .select()
      .from(geoResults)
      .where(eq(geoResults.websiteId, websiteId))
      .all();

    const queries = db
      .select()
      .from(geoQueries)
      .where(eq(geoQueries.websiteId, websiteId))
      .all();

    const recommendations: {
      type: "content" | "backlinks" | "technical";
      title: string;
      description: string;
      priority: "high" | "medium" | "low";
    }[] = [];

    // Analyze gaps — find queries where brand is NOT mentioned
    if (queries.length > 0 && allResults.length > 0) {
      const mentioned = new Set(
        allResults.filter((r) => r.brandMentioned === 1).map((r) => r.queryId)
      );

      const notMentioned = queries.filter((q) => !mentioned.has(q.id));
      if (notMentioned.length > 0) {
        const sampleKws = [...new Set(notMentioned.map((q) => q.keyword))].slice(0, 3);
        recommendations.push({
          type: "content",
          title: `Crear contenido sobre "${sampleKws.join(", ")}"`,
          description: `No apareces en ${notMentioned.length} queries GEO para estas keywords. Los competidores están ganando visibilidad en IA con contenido específico. Prioriza crear guías prácticas y casos de uso.`,
          priority: "high",
        });
      }
    }

    // Backlinks recommendation from competitor mentions
    const allCompetitors = new Set<string>();
    for (const r of allResults) {
      try {
        const comps = JSON.parse(r.competitorsMentioned || "[]") as string[];
        for (const c of comps) allCompetitors.add(c);
      } catch {
        // skip malformed JSON
      }
    }
    if (allCompetitors.size > 0) {
      const topComps = [...allCompetitors].slice(0, 3).join(", ");
      recommendations.push({
        type: "backlinks",
        title: `Reforzar backlinks frente a ${allCompetitors.size} competidores`,
        description: `${topComps} están siendo mencionados por las IAs. Analiza sus perfiles de backlinks y busca oportunidades similares.`,
        priority: "medium",
      });
    }

    // Sentiment analysis
    if (allResults.length > 0) {
      const positiveRate =
        allResults.filter((r) => r.sentiment === "positive").length / allResults.length;
      if (positiveRate < 0.5) {
        recommendations.push({
          type: "technical",
          title: "Mejorar sentimiento de marca en IA",
          description:
            "Menos del 50% de las menciones tienen sentimiento positivo. Publica casos de éxito, testimonios y contenido que refuerce tu reputación.",
          priority: "medium",
        });
      }
    }

    // Fallback when no data
    if (recommendations.length === 0) {
      recommendations.push({
        type: "content",
        title: "Ejecuta tu primer escaneo GEO",
        description:
          "Haz clic en 'Escanear Ahora' para analizar cómo te ven las IAs. Necesitamos datos para generar recomendaciones personalizadas.",
        priority: "high",
      });
    }

    return Response.json({ data: recommendations });
  } catch (error) {
    if (error instanceof Response) throw error;
    return Response.json({ error: "Failed to generate recommendations" }, { status: 500 });
  }
}
