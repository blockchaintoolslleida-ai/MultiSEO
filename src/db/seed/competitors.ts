import { competitors } from "@/db/schema";

const websiteKeywords: Record<string, { kw: string; pos: number; chg: number; vol: number; diff: string; hist: number[]; top3: number; fall: number }[]> = {
  "1": [
    { kw: "seo para empresas", pos: 3, chg: 2, vol: 3200, diff: "medium", hist: [8,7,6,5,4,3,3], top3: 1, fall: 0 },
    { kw: "agencia seo barcelona", pos: 7, chg: 0, vol: 1800, diff: "hard", hist: [7,8,7,7,6,7,7], top3: 0, fall: 0 },
    { kw: "posicionamiento web", pos: 12, chg: 4, vol: 5100, diff: "hard", hist: [18,17,16,15,14,13,12], top3: 0, fall: 0 },
    { kw: "consultor seo freelance", pos: 18, chg: -5, vol: 2400, diff: "easy", hist: [12,14,13,15,16,17,18], top3: 0, fall: 1 },
    { kw: "herramientas seo automaticas", pos: 9, chg: 1, vol: 890, diff: "easy", hist: [11,11,10,10,9,9,9], top3: 0, fall: 0 },
  ],
  "2": [
    { kw: "tienda online seo", pos: 5, chg: 1, vol: 4100, diff: "medium", hist: [8,7,6,6,5,5,5], top3: 0, fall: 0 },
    { kw: "woocommerce optimizar", pos: 8, chg: -2, vol: 2200, diff: "medium", hist: [6,6,7,7,8,8,8], top3: 0, fall: 0 },
    { kw: "ecommerce posicionamiento", pos: 14, chg: 3, vol: 3600, diff: "hard", hist: [19,18,17,16,15,14,14], top3: 0, fall: 0 },
    { kw: "vender mas online", pos: 11, chg: 0, vol: 1500, diff: "easy", hist: [11,12,11,11,11,11,11], top3: 0, fall: 0 },
  ],
  "e74b0ab2-f1a3-4c8d-9e6b-2d5f7a8c9e01": [
    { kw: "fotografia profesional barcelona", pos: 4, chg: 1, vol: 2400, diff: "medium", hist: [8,7,6,5,4,4,4], top3: 0, fall: 0 },
    { kw: "silvia clua fotografia", pos: 1, chg: 0, vol: 1200, diff: "easy", hist: [1,1,1,1,1,1,1], top3: 1, fall: 0 },
    { kw: "fotografo bodas catalunya", pos: 6, chg: -2, vol: 3800, diff: "hard", hist: [4,4,5,5,5,6,6], top3: 0, fall: 1 },
    { kw: "fotografia artistica", pos: 9, chg: 3, vol: 1500, diff: "medium", hist: [14,12,11,10,9,9,9], top3: 0, fall: 0 },
    { kw: "reportaje fotografico profesional", pos: 11, chg: 2, vol: 2100, diff: "medium", hist: [15,14,13,12,11,11,11], top3: 0, fall: 0 },
  ],
  "1e311052-a2b4-4d9e-7f6c-3e5a8b9d0f12": [
    { kw: "psicologia trauma online", pos: 5, chg: -1, vol: 1800, diff: "medium", hist: [4,4,4,5,5,5,5], top3: 0, fall: 0 },
    { kw: "terapia emdr barcelona", pos: 8, chg: 2, vol: 2900, diff: "hard", hist: [12,11,10,9,8,8,8], top3: 0, fall: 0 },
    { kw: "tratamiento estres postraumatico", pos: 12, chg: 0, vol: 4400, diff: "hard", hist: [13,13,12,12,12,12,12], top3: 0, fall: 0 },
    { kw: "psicologo especialista en trauma", pos: 7, chg: 4, vol: 3200, diff: "medium", hist: [15,14,12,11,9,7,7], top3: 0, fall: 0 },
    { kw: "traumare psicologia", pos: 2, chg: 0, vol: 900, diff: "easy", hist: [2,2,2,2,2,2,2], top3: 1, fall: 0 },
  ],
  "dd262b94-b3c5-4e0a-8f7d-4f6b9c0e1a23": [
    { kw: "participacion ciudadana blockchain", pos: 3, chg: 1, vol: 1500, diff: "easy", hist: [6,5,4,3,3,3,3], top3: 1, fall: 0 },
    { kw: "votacion descentralizada", pos: 10, chg: -3, vol: 2800, diff: "medium", hist: [7,8,8,9,10,10,10], top3: 0, fall: 0 },
    { kw: "herramientas participacion digital", pos: 14, chg: 5, vol: 2100, diff: "medium", hist: [20,19,18,17,15,14,14], top3: 0, fall: 0 },
    { kw: "blockchain governança", pos: 8, chg: 0, vol: 1100, diff: "easy", hist: [8,8,8,8,8,8,8], top3: 0, fall: 0 },
  ],
  "3": [
    { kw: "recuperar blog antiguo", pos: 22, chg: -3, vol: 480, diff: "easy", hist: [18,19,20,20,21,22,22], top3: 0, fall: 1 },
    { kw: "migrar wordpress", pos: 25, chg: 2, vol: 1100, diff: "medium", hist: [28,27,26,25,25,25,25], top3: 0, fall: 0 },
    { kw: "blog no indexado", pos: 19, chg: 0, vol: 320, diff: "easy", hist: [20,19,19,19,19,19,19], top3: 0, fall: 0 },
  ],
  "5": [
    { kw: "agencia marketing digital", pos: 2, chg: 1, vol: 6800, diff: "hard", hist: [5,4,3,3,2,2,2], top3: 1, fall: 0 },
    { kw: "growth hacking b2b", pos: 4, chg: -1, vol: 2900, diff: "medium", hist: [3,3,3,4,4,4,4], top3: 0, fall: 0 },
    { kw: "consultoria seo tecnica", pos: 6, chg: 2, vol: 3400, diff: "hard", hist: [10,9,8,7,7,6,6], top3: 0, fall: 0 },
    { kw: "automatizacion marketing", pos: 8, chg: 0, vol: 1800, diff: "medium", hist: [8,9,8,8,8,8,8], top3: 0, fall: 0 },
    { kw: "analitica web avanzada", pos: 11, chg: 3, vol: 2100, diff: "medium", hist: [16,15,14,13,12,11,11], top3: 0, fall: 0 },
  ],
};

const websiteCompetitors: Record<string, { domain: string; pos: number; trend: string; highlight: number }[]> = {
  "1": [
    { domain: "Tu web", pos: 8.4, trend: "up", highlight: 0 },
    { domain: "competidor1.com", pos: 5.2, trend: "flat", highlight: 0 },
    { domain: "competidor2.es", pos: 6.8, trend: "up", highlight: 1 },
    { domain: "competidor3.com", pos: 9.1, trend: "down", highlight: 0 },
    { domain: "competidor4.net", pos: 11.3, trend: "flat", highlight: 0 },
  ],
  "2": [
    { domain: "Tu web", pos: 12.1, trend: "up", highlight: 0 },
    { domain: "tiendacompetidora.es", pos: 7.5, trend: "flat", highlight: 0 },
    { domain: "ecommercepro.com", pos: 9.2, trend: "down", highlight: 1 },
    { domain: "shoprank.io", pos: 11.8, trend: "up", highlight: 0 },
  ],
  "5": [
    { domain: "Tu web", pos: 5.6, trend: "up", highlight: 0 },
    { domain: "bigagency.com", pos: 4.1, trend: "flat", highlight: 0 },
    { domain: "marketingpro.es", pos: 6.3, trend: "up", highlight: 1 },
    { domain: "growthhackers.io", pos: 8.9, trend: "down", highlight: 0 },
    { domain: "digitalfirst.com", pos: 10.2, trend: "flat", highlight: 0 },
  ],
  "e74b0ab2-f1a3-4c8d-9e6b-2d5f7a8c9e01": [
    { domain: "silviaclua.com", pos: 5.4, trend: "up", highlight: 0 },
    { domain: "fotografo-barcelona.es", pos: 4.2, trend: "flat", highlight: 0 },
    { domain: "bodasfotografia.com", pos: 7.8, trend: "up", highlight: 1 },
  ],
  "1e311052-a2b4-4d9e-7f6c-3e5a8b9d0f12": [
    { domain: "traumare.com", pos: 6.8, trend: "up", highlight: 0 },
    { domain: "psicologiabcn.es", pos: 5.1, trend: "flat", highlight: 0 },
    { domain: "emdr-terapia.com", pos: 8.3, trend: "down", highlight: 1 },
  ],
  "dd262b94-b3c5-4e0a-8f7d-4f6b9c0e1a23": [
    { domain: "blockchaintools.cat", pos: 5.6, trend: "up", highlight: 0 },
    { domain: "governanca-digital.cat", pos: 7.1, trend: "flat", highlight: 0 },
    { domain: "decidim.barcelona", pos: 9.5, trend: "up", highlight: 1 },
  ],
};

export function seedCompetitors(tx: any): void {
  let compCounter = 0;
  for (const [wid, comps] of Object.entries(websiteCompetitors)) {
    // Get keywords for this website to build overlap references
    const siteKeywords = websiteKeywords[wid] ?? [];
    for (let i = 0; i < comps.length; i++) {
      compCounter++;
      // Simulate keyword overlap: each competitor "shares" 1-2 keywords with the target site
      const overlapKwIds: string[] = [];
      if (siteKeywords.length > 0) {
        const overlapCount = Math.min(1 + (i % 2), siteKeywords.length);
        for (let j = 0; j < overlapCount; j++) {
          const kwIdx = (i + j) % siteKeywords.length;
          // Find this keyword's ID by matching against what was inserted
          const kwId = `k${Object.keys(websiteKeywords).indexOf(wid) + (i % siteKeywords.length) + j}`;
          // Simpler: use first N keyword IDs for this website
          // We need to compute the base kwCounter for this website
          // Actually, let's just use domain + index as a reference
          overlapKwIds.push(`kw-${wid}-${kwIdx}`);
        }
      }
      // Traffic estimate based on position (lower position = more traffic)
      const trafficEst = Math.round((15 - comps[i].pos) * 250 + Math.random() * 500);

      tx.insert(competitors).values({
        id: `c${compCounter}`,
        websiteId: wid,
        rank: i + 1,
        domain: comps[i].domain,
        avgPosition: comps[i].pos,
        trend: comps[i].trend,
        highlightChange: comps[i].highlight,
        keywordsOverlap: JSON.stringify(overlapKwIds),
        trafficEstimate: trafficEst,
        isManual: 0,
        lastUpdated: new Date().toISOString(),
      }).run();
    }
  }
}
