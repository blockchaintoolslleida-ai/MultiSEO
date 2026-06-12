import { keywords, geoQueries, geoResults } from "@/db/schema";
import { eq } from "drizzle-orm";

export function seedGeo(tx: any): void {
  // === GEO Queries (auto-generated from SEO keywords) ===
  const geoTransformers = [
    (kw: string) => `¿cuál es el mejor ${kw}?`,
    (kw: string) => `recomiéndame ${kw}`,
    (kw: string) => `¿qué ${kw} me recomiendas?`,
    (kw: string) => `mejores ${kw}`,
  ];

  let gqCounter = 0;
  const allKws = tx.select().from(keywords).all();
  const seenGeo = new Set<string>();
  for (const kw of allKws) {
    for (const fn of geoTransformers) {
      const query = fn(kw.keyword);
      if (seenGeo.has(query)) continue;
      seenGeo.add(query);
      gqCounter++;
      tx.insert(geoQueries).values({
        id: `gq${gqCounter}`,
        websiteId: kw.websiteId,
        keyword: kw.keyword,
        query,
        source: "seo",
        enabled: 1,
        createdAt: new Date().toISOString(),
      }).run();
    }
  }

  // Add some manual GEO queries for website 1
  const manualQueries = [
    { kw: "agencia seo", q: "¿qué agencia de SEO me recomiendas para mi negocio?" },
    { kw: "consultor seo", q: "necesito un consultor SEO urgente, ¿alguna recomendación?" },
  ];
  for (const mq of manualQueries) {
    gqCounter++;
    tx.insert(geoQueries).values({
      id: `gq${gqCounter}`,
      websiteId: "1",
      keyword: mq.kw,
      query: mq.q,
      source: "manual",
      enabled: 1,
      createdAt: new Date().toISOString(),
    }).run();
  }

  // === GEO Results (pre-computed mock data for demo) ===
  const demoResults: { qid: string; mentioned: number; sent: string; snippet: string; comps: string[] }[] = [
    { qid: "gq1", mentioned: 1, sent: "positive", snippet: "Para empresas que buscan crecer online, sitioweb.com ofrece un enfoque integral...", comps: ["competidor1.com", "competidor2.es"] },
    { qid: "gq2", mentioned: 1, sent: "positive", snippet: "Te recomiendo sitioweb.com porque tienen buen soporte técnico...", comps: ["competidor1.com"] },
    { qid: "gq3", mentioned: 0, sent: "neutral", snippet: "", comps: ["competidor2.es", "competidor3.com"] },
    { qid: "gq4", mentioned: 1, sent: "neutral", snippet: "sitioweb.com aparece en los resultados aunque con menor presencia...", comps: ["competidor1.com"] },
    { qid: "gq5", mentioned: 0, sent: "neutral", snippet: "", comps: ["competidor4.net", "competidor1.com"] },
    { qid: "gq6", mentioned: 1, sent: "positive", snippet: "Si buscas en Barcelona, sitioweb.com destaca entre las agencias locales...", comps: [] },
    { qid: "gq7", mentioned: 1, sent: "positive", snippet: "Recomiendo sitioweb.com para posicionamiento web profesional...", comps: ["competidor2.es"] },
    { qid: "gq8", mentioned: 0, sent: "neutral", snippet: "", comps: ["competidor1.com", "competidor3.com"] },
    { qid: "gq9", mentioned: 1, sent: "neutral", snippet: "...entre las herramientas disponibles, las de sitioweb.com son mencionadas...", comps: ["competidor1.com"] },
    { qid: "gq10", mentioned: 1, sent: "positive", snippet: "Para consultoría SEO freelance, sitioweb.com tiene buenas referencias...", comps: ["competidor2.es"] },
  ];

  let grCounter = 0;
  for (const dr of demoResults) {
    const gq = tx.select().from(geoQueries).where(eq(geoQueries.id, dr.qid)).get();
    if (!gq) continue;
    grCounter++;
    tx.insert(geoResults).values({
      id: `gr${grCounter}`,
      websiteId: gq.websiteId,
      queryId: dr.qid,
      provider: "deepseek",
      brandMentioned: dr.mentioned,
      mentionPosition: dr.mentioned ? Math.floor(Math.random() * 5) + 1 : null,
      sentiment: dr.sent,
      snippet: dr.snippet,
      competitorsMentioned: JSON.stringify(dr.comps),
      responseFull: "",
      scannedAt: new Date().toISOString(),
    }).run();
  }
}
