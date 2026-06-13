import { db } from "@/db";
import { competitors, tenants, websites, keywords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId, verifyWebsiteOwnership } from "@/lib/tenant";
import { getTenantSecret, setTenantSecret } from "@/lib/tenant-secrets";

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

interface AnalysisResult {
  estimatedPosition: number;
  estimatedTraffic: number;
  topKeywords: string[];
  trend: "up" | "down" | "flat";
  summary: string;
}

function parseAnalysisResponse(raw: string): AnalysisResult {
  // Clean markdown code fences
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);

  const parsed = JSON.parse(cleaned.trim());
  return {
    estimatedPosition: parsed.estimatedPosition ?? 0,
    estimatedTraffic: parsed.estimatedTraffic ?? 0,
    topKeywords: parsed.topKeywords ?? [],
    trend: parsed.trend ?? "flat",
    summary: parsed.summary ?? "",
  };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = getTenantId(request);
    const { id } = await params;

    const comp = db.select().from(competitors).where(eq(competitors.id, id)).get();

    if (!comp) {
      return Response.json({ error: "Competitor not found" }, { status: 404 });
    }

    const website = verifyWebsiteOwnership(comp.websiteId, tenantId);

    // Get DeepSeek API key
    const tenant = db.select().from(tenants).where(eq(tenants.id, tenantId)).get();

    if (!tenant) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    const geoKeysRaw = getTenantSecret(tenant, "geoProviderKeys");
    let geoKeys: Record<string, string> = {};
    try {
      geoKeys = JSON.parse(geoKeysRaw || "{}");
    } catch {
      /* empty */
    }

    const apiKey = geoKeys.deepseek;
    if (!apiKey) {
      return Response.json(
        {
          error:
            "DeepSeek API key no configurada. Ve a Configuración → Proveedores IA y añade tu API key de DeepSeek.",
        },
        { status: 400 }
      );
    }

    // Get website keywords for context
    const siteKeywords = db
      .select()
      .from(keywords)
      .where(eq(keywords.websiteId, comp.websiteId))
      .all()
      .slice(0, 15);

    const keywordList = siteKeywords.map((k) => k.keyword);

    // Call DeepSeek for competitor analysis
    const prompt = `Analiza el sitio web competidor "${comp.domain}" en comparación con "${website.domain}".

Keywords objetivo de mi sitio: ${keywordList.join(", ") || "no disponibles"}

Devuelve ÚNICAMENTE este JSON con una estimación razonable basada en tu conocimiento del sector SEO:
{
  "estimatedPosition": número (posición media estimada en Google, 1-100),
  "estimatedTraffic": número (tráfico orgánico mensual estimado),
  "topKeywords": ["keyword1", "keyword2", "keyword3"] (máximo 5 keywords probables),
  "trend": "up" | "down" | "flat",
  "summary": "breve resumen de 1 frase sobre la posición competitiva de este sitio"
}`;

    const response = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "Eres un analista SEO experto. Respondes solo con JSON válido. Das estimaciones realistas basadas en tu conocimiento del mercado SEO español.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 600,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return Response.json({ error: `DeepSeek API error: ${err}` }, { status: 502 });
    }

    const data = await response.json();
    const rawContent = data.choices[0].message.content;

    let analysis: AnalysisResult;
    try {
      analysis = parseAnalysisResponse(rawContent);
    } catch {
      return Response.json(
        { error: "DeepSeek returned an invalid response. Try again." },
        { status: 502 }
      );
    }

    // Update competitor with analysis results
    const now = new Date().toISOString();
    db.update(competitors)
      .set({
        avgPosition: analysis.estimatedPosition,
        trafficEstimate: analysis.estimatedTraffic,
        trend: analysis.trend,
        lastUpdated: now,
      })
      .where(eq(competitors.id, id))
      .run();

    // Store keywords in the overlap field if there's a matching website
    const allWebsites = db.select().from(websites).all();
    const matchingWebsite = allWebsites.find(
      (w) =>
        w.domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "") ===
          comp.domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "") && w.id !== comp.websiteId
    );

    if (matchingWebsite) {
      const overlapKws = db
        .select()
        .from(keywords)
        .where(eq(keywords.websiteId, matchingWebsite.id))
        .all();
      const overlapIds = overlapKws.map((k) => k.id);
      db.update(competitors)
        .set({ keywordsOverlap: JSON.stringify(overlapIds) })
        .where(eq(competitors.id, id))
        .run();
    }

    // Also update suggested keywords from the analysis
    if (analysis.topKeywords.length > 0) {
      // Add discovered keywords as potential keywords for the website
      for (const kw of analysis.topKeywords.slice(0, 3)) {
        const existingKw = db.select().from(keywords).where(eq(keywords.keyword, kw)).get();
        if (!existingKw) {
          db.insert(keywords)
            .values({
              id: crypto.randomUUID(),
              websiteId: comp.websiteId,
              keyword: kw,
              position: analysis.estimatedPosition + Math.floor(Math.random() * 5),
              change: 0,
              volume: Math.round(analysis.estimatedTraffic * 0.1),
              difficulty: "medium",
              history: JSON.stringify([analysis.estimatedPosition]),
              isTop3: 0,
              isFalling: 0,
            })
            .run();
        }
      }
    }

    const updated = db.select().from(competitors).where(eq(competitors.id, id)).get();

    return Response.json({
      data: {
        ...updated,
        keywordsOverlap: JSON.parse(updated!.keywordsOverlap),
        highlightChange: updated!.highlightChange === 1,
        isManual: updated!.isManual === 1,
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
