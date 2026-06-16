/**
 * Shared DeepSeek competitor analysis logic.
 *
 * Used by both the auto-analyze flow on competitor creation
 * (POST /api/competitors) and the manual re-analyze button
 * (POST /api/competitors/[id]/analyze).
 */
import { db } from "@/db";
import { competitors, tenants, websites, keywords } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantSecret } from "@/lib/tenant-secrets";

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

export interface CompetitorAnalysisResult {
  estimatedPosition: number;
  estimatedTraffic: number;
  topKeywords: string[];
  trend: "up" | "down" | "flat";
  summary: string;
}

function parseAnalysisResponse(raw: string): CompetitorAnalysisResult {
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

/**
 * Analyze a competitor using DeepSeek AI.
 *
 * Updates the competitor row with estimated position, traffic, and trend.
 * Also populates keyword overlap and inserts up to 3 discovered keywords.
 *
 * @returns The analysis result, or `null` if the API key is missing,
 *          the API call fails, or the response cannot be parsed.
 */
export async function analyzeCompetitor(
  competitorId: string,
  tenantId: string
): Promise<CompetitorAnalysisResult | null> {
  // ── Look up competitor ──
  const comp = db.select().from(competitors).where(eq(competitors.id, competitorId)).get();
  if (!comp) return null;

  // ── Look up website for domain context ──
  const website = db.select().from(websites).where(eq(websites.id, comp.websiteId)).get();
  if (!website) return null;

  // ── Get DeepSeek API key ──
  const tenant = db.select().from(tenants).where(eq(tenants.id, tenantId)).get();
  if (!tenant) return null;

  let geoKeys: Record<string, string> = {};
  try {
    const raw = getTenantSecret(tenant, "geoProviderKeys");
    geoKeys = JSON.parse(raw || "{}");
  } catch {
    /* empty */
  }

  const apiKey = geoKeys.deepseek;
  if (!apiKey) return null; // silently skip — key not configured

  // ── Get website keywords for context ──
  const siteKeywords = db
    .select()
    .from(keywords)
    .where(eq(keywords.websiteId, comp.websiteId))
    .all()
    .slice(0, 15);
  const keywordList = siteKeywords.map((k) => k.keyword);

  // ── Call DeepSeek ──
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

  let analysis: CompetitorAnalysisResult;
  try {
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

    if (!response.ok) return null; // API error — silently skip

    const data = await response.json();
    const rawContent = data.choices[0].message.content;
    analysis = parseAnalysisResponse(rawContent);
  } catch {
    return null; // network or parse error — silently skip
  }

  // ── Update competitor with analysis results ──
  const now = new Date().toISOString();
  db.update(competitors)
    .set({
      avgPosition: analysis.estimatedPosition,
      trafficEstimate: analysis.estimatedTraffic,
      trend: analysis.trend,
      lastUpdated: now,
    })
    .where(eq(competitors.id, competitorId))
    .run();

  // ── Update keywordsOverlap if a matching website exists ──
  const allWebsites = db.select().from(websites).all();
  const matchingWebsite = allWebsites.find(
    (w) => normalizeDomain(w.domain) === normalizeDomain(comp.domain) && w.id !== comp.websiteId
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
      .where(eq(competitors.id, competitorId))
      .run();
  }

  // ── Insert discovered keywords ──
  if (analysis.topKeywords.length > 0) {
    // Batch-check which keywords already exist for this website
    const existingKws = db
      .select({ keyword: keywords.keyword })
      .from(keywords)
      .where(eq(keywords.websiteId, comp.websiteId))
      .all();
    const existingSet = new Set(existingKws.map((k) => k.keyword));

    for (const kw of analysis.topKeywords.slice(0, 3)) {
      if (!existingSet.has(kw)) {
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

  return analysis;
}

/** Strip protocol and trailing slash so domain matching works. */
export function normalizeDomain(d: string): string {
  return d.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}
