import { db } from "@/db";
import { competitors, keywords, websites } from "@/db/schema";
import { eq } from "drizzle-orm";
import type {
  CompetitorFull,
  CompetitorKPIs,
  OverlapMatrixRow,
  CompetitorRecommendation,
} from "@/types/seo";
import { ONE_WEEK_MS, POSITION_THRESHOLDS, MAX_RECOMMENDATIONS } from "@/lib/constants";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";
import { analyzeCompetitor, normalizeDomain } from "@/lib/competitor-analyzer";

export async function GET(request: Request) {
  const tenantId = getTenantId(request);

  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");

    if (!websiteId) {
      return Response.json({ error: "websiteId is required" }, { status: 400 });
    }

    const website = verifyWebsiteOwnership(websiteId, tenantId);

    const compRows = db
      .select()
      .from(competitors)
      .where(eq(competitors.websiteId, websiteId))
      .all()
      .sort((a, b) => a.rank - b.rank);

    const myKeywords = db.select().from(keywords).where(eq(keywords.websiteId, websiteId)).all();

    const allWebsites = db.select().from(websites).all();
    const allKeywords = db.select().from(keywords).all();

    const overlapMatrix: OverlapMatrixRow[] = [];
    const overlappingKeywordIds = new Set<string>();

    for (const kw of myKeywords) {
      const compPositions: { domain: string; position: number }[] = [];

      for (const comp of compRows) {
        const compWebsite = allWebsites.find(
          (w) => normalizeDomain(w.domain) === normalizeDomain(comp.domain) && w.id !== websiteId
        );

        if (compWebsite) {
          const compKw = allKeywords.find(
            (ck) => ck.websiteId === compWebsite.id && ck.keyword === kw.keyword
          );
          if (compKw) {
            compPositions.push({ domain: comp.domain, position: compKw.position });
            overlappingKeywordIds.add(kw.id);
          }
        } else {
          try {
            const overlapArr: string[] = JSON.parse(comp.keywordsOverlap);
            if (overlapArr.includes(kw.id)) {
              compPositions.push({ domain: comp.domain, position: comp.avgPosition });
              overlappingKeywordIds.add(kw.id);
            }
          } catch {
            // Skip if JSON parse fails
          }
        }
      }

      if (compPositions.length > 0) {
        overlapMatrix.push({
          keywordId: kw.id,
          keyword: kw.keyword,
          yourPosition: kw.position,
          competitors: compPositions,
        });
      }
    }

    const yourAvgPosition = website.avgPosition;
    const top3Comps = compRows
      .filter((c) => c.domain !== website.domain)
      .slice(0, POSITION_THRESHOLDS.TOP3);
    const top3AvgPosition =
      top3Comps.length > 0
        ? Math.round((top3Comps.reduce((s, c) => s + c.avgPosition, 0) / top3Comps.length) * 10) /
          10
        : 0;

    const activeThreats = compRows.filter(
      (c) => c.trend === "up" && c.highlightChange === 1
    ).length;

    const kpis: CompetitorKPIs = {
      totalCompetitors: compRows.length,
      yourAvgPosition: Math.round(yourAvgPosition * 10) / 10,
      top3AvgPosition,
      overlappingKeywords: overlappingKeywordIds.size,
      activeThreats,
    };

    const compsFull: CompetitorFull[] = compRows.map((c) => ({
      id: c.id,
      rank: c.rank,
      domain: c.domain,
      avgPosition: c.avgPosition,
      trend: c.trend as "up" | "down" | "flat",
      highlightChange: c.highlightChange === 1,
      keywordsOverlap: (() => {
        try {
          return JSON.parse(c.keywordsOverlap);
        } catch {
          return [];
        }
      })(),
      trafficEstimate: c.trafficEstimate,
      isManual: c.isManual === 1,
      lastUpdated: c.lastUpdated,
    }));

    const recommendations: CompetitorRecommendation[] = [];

    for (const row of overlapMatrix) {
      for (const comp of row.competitors) {
        const gap = row.yourPosition - comp.position;
        if (gap >= 3) {
          recommendations.push({
            type: "gap",
            priority: gap >= 5 ? "high" : "medium",
            title: `${comp.domain} te supera en "${row.keyword}"`,
            description: `El competidor ${comp.domain} está en posición ${comp.position} mientras tú estás en ${row.yourPosition}. Una diferencia de ${gap} posiciones.`,
            actionLabel: "Crear contenido optimizado",
            relatedCompetitor: comp.domain,
            relatedKeyword: row.keyword,
          });
        }
      }
    }

    for (const c of compsFull) {
      if (c.trend === "up" && c.highlightChange) {
        recommendations.push({
          type: "threat",
          priority: "high",
          title: `${c.domain} está subiendo rápido`,
          description: `${c.domain} ha mejorado sus posiciones significativamente esta semana. Posición actual: ${c.avgPosition}.`,
          actionLabel: "Investigar estrategia",
          relatedCompetitor: c.domain,
        });
      }
    }

    const topCompDomains = new Set(compsFull.filter((c) => c.rank <= 5).map((c) => c.domain));
    for (const kw of myKeywords) {
      if (kw.position > 3 && kw.position <= 10) {
        const hasStrongCompetitor = overlapMatrix
          .find((r) => r.keywordId === kw.id)
          ?.competitors.some((c) => c.position <= 3 && topCompDomains.has(c.domain));

        if (!hasStrongCompetitor) {
          recommendations.push({
            type: "opportunity",
            priority: kw.position <= 5 ? "high" : "medium",
            title: `Oportunidad en "${kw.keyword}"`,
            description: `Estás en posición ${kw.position} y ningún competidor del top 5 rankea en top 3. Puedes capturar esta keyword con contenido enfocado.`,
            actionLabel: "Crear contenido",
            relatedKeyword: kw.keyword,
          });
        }
      }
    }

    const weekAgo = new Date(Date.now() - ONE_WEEK_MS).toISOString();
    for (const c of compsFull) {
      if (c.lastUpdated >= weekAgo && c.isManual) {
        recommendations.push({
          type: "new_competitor",
          priority: "medium",
          title: `Nuevo competidor: ${c.domain}`,
          description: `${c.domain} ha sido añadido recientemente. Monitoriza sus movimientos de cerca.`,
          actionLabel: "Ver competidor",
          relatedCompetitor: c.domain,
        });
      }
    }

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    const topRecommendations = recommendations.slice(0, MAX_RECOMMENDATIONS);

    return Response.json({
      data: { kpis, competitors: compsFull, overlapMatrix, recommendations: topRecommendations },
    });
  } catch (error) {
    if (error instanceof Response) throw error;
    const msg = error instanceof Error ? error.message : "Failed to fetch competitors";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const tenantId = getTenantId(request);

  try {
    const body = await request.json();
    const { websiteId, domain: rawDomain, avgPosition } = body;

    if (!websiteId || !rawDomain) {
      return Response.json({ error: "websiteId and domain are required" }, { status: 400 });
    }

    const domain = normalizeDomain(rawDomain);
    verifyWebsiteOwnership(websiteId, tenantId);

    const existing = db
      .select()
      .from(competitors)
      .where(eq(competitors.websiteId, websiteId))
      .all()
      .find((c) => normalizeDomain(c.domain) === domain);

    if (existing) {
      return Response.json(
        { error: "Este competidor ya existe para este website" },
        { status: 409 }
      );
    }

    // Detect keyword overlap: if any website in the system has this domain,
    // pull its keywords to populate the overlap matrix
    const allWebsites = db.select().from(websites).all();
    const matchingWebsite = allWebsites.find(
      (w) => normalizeDomain(w.domain) === domain && w.id !== websiteId
    );

    let keywordsOverlap: string[] = [];
    let trafficEstimate = 0;

    if (matchingWebsite) {
      const compKeywords = db
        .select()
        .from(keywords)
        .where(eq(keywords.websiteId, matchingWebsite.id))
        .all();
      keywordsOverlap = compKeywords.map((k) => k.id);
      trafficEstimate = compKeywords.reduce((sum, k) => sum + k.volume, 0);
    }

    const currentCount = db
      .select()
      .from(competitors)
      .where(eq(competitors.websiteId, websiteId))
      .all().length;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.insert(competitors)
      .values({
        id,
        websiteId,
        domain,
        rank: currentCount + 1,
        avgPosition: avgPosition ?? 0,
        trend: "flat",
        highlightChange: 0,
        keywordsOverlap: JSON.stringify(keywordsOverlap),
        trafficEstimate,
        isManual: 1,
        lastUpdated: now,
      })
      .run();

    let created = db.select().from(competitors).where(eq(competitors.id, id)).get();

    // Auto-analyze with DeepSeek AI (silently skip if key missing or API fails)
    try {
      const analysisResult = await analyzeCompetitor(id, tenantId);
      if (analysisResult) {
        created = db.select().from(competitors).where(eq(competitors.id, id)).get();
      }
    } catch (err) {
      // Competitor was already created — analysis is best-effort
      if (process.env.NODE_ENV === "development") {
        console.error("Auto-analyze competitor failed:", err);
      }
    }

    if (!created) {
      return Response.json(
        { error: "Competitor created but could not be retrieved" },
        { status: 500 }
      );
    }

    return Response.json(
      {
        data: {
          ...created,
          keywordsOverlap: JSON.parse(created.keywordsOverlap),
          highlightChange: created.highlightChange === 1,
          isManual: created.isManual === 1,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Response) throw error;
    const msg = error instanceof Error ? error.message : "Failed to create competitor";
    return Response.json({ error: msg }, { status: 500 });
  }
}
