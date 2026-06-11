import { db } from "./index";
import { tenants, websites, keywords, competitors, rankingHistory, articles, reports, notifications, geoQueries, geoResults } from "./schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth-password";

function seed() {
  db.transaction((tx) => {
    // Clear existing data
    tx.delete(geoResults).run();
    tx.delete(geoQueries).run();
    tx.delete(notifications).run();
    tx.delete(reports).run();
    tx.delete(articles).run();
    tx.delete(rankingHistory).run();
    tx.delete(keywords).run();
    tx.delete(competitors).run();
    tx.delete(websites).run();
    tx.delete(tenants).run();

    // Insert tenants
    tx.insert(tenants).values([
      { id: "demo", name: "Demo Company", slug: "demo-company", passwordHash: hashPassword("demo"), createdAt: new Date().toISOString() },
      { id: "acme", name: "Acme Corp", slug: "acme-corp", passwordHash: hashPassword("acme"), createdAt: new Date().toISOString() },
    ]).run();

    const demoId = "demo";

    // Insert websites — all belong to Demo Company
    tx.insert(websites).values([
      {
        id: "1", tenantId: "demo", domain: "sitioweb.com", status: "connected",
        accessTypes: JSON.stringify(["wordpress", "ftp", "cpanel"]),
        keywordsCount: 24, articlesCount: 18, avgPosition: 8.4,
        estimatedTraffic: 24800, backlinksCount: 1204, healthScore: 72,
        lastAudit: "Hace 2h", createdAt: new Date().toISOString(),
      },
      {
        id: "2", tenantId: "demo", domain: "mitiendaonline.es", status: "connected",
        accessTypes: JSON.stringify(["wordpress", "ssh"]),
        keywordsCount: 16, articlesCount: 9, avgPosition: 12.1,
        estimatedTraffic: 12000, backlinksCount: 580, healthScore: 65,
        lastAudit: "Hace 5h", createdAt: new Date().toISOString(),
      },
      {
        id: "3", tenantId: "demo", domain: "blog-antiguo.com", status: "no-access",
        accessTypes: JSON.stringify(["wordpress"]),
        keywordsCount: 8, articlesCount: 0, avgPosition: 22,
        estimatedTraffic: 2100, backlinksCount: 94, healthScore: 40,
        lastAudit: "Hace 12d", errorMessage: "Credenciales expiradas — actualizar acceso",
        createdAt: new Date().toISOString(),
      },
      {
        id: "4", tenantId: "demo", domain: "old-project.net", status: "error",
        accessTypes: JSON.stringify(["ftp", "cpanel"]),
        keywordsCount: 5, articlesCount: 0, avgPosition: 35,
        estimatedTraffic: 800, backlinksCount: 32, healthScore: 22,
        lastAudit: "Nunca", errorMessage: "Error conexión FTP — timeout tras 30s",
        createdAt: new Date().toISOString(),
      },
      {
        id: "5", tenantId: "demo", domain: "agencia-marketing.io", status: "connected",
        accessTypes: JSON.stringify(["wordpress", "ftp", "ssh"]),
        keywordsCount: 32, articlesCount: 27, avgPosition: 5.6,
        estimatedTraffic: 42000, backlinksCount: 2100, healthScore: 88,
        lastAudit: "Hace 30m", createdAt: new Date().toISOString(),
      },
      {
        id: "e74b0ab2-f1a3-4c8d-9e6b-2d5f7a8c9e01", tenantId: "demo", domain: "www.silviaclua.com", status: "connected",
        accessTypes: JSON.stringify(["wordpress"]),
        keywordsCount: 5, articlesCount: 0, avgPosition: 6.2,
        estimatedTraffic: 5000, backlinksCount: 200, healthScore: 85,
        lastAudit: "Hace 1h", createdAt: new Date().toISOString(),
      },
      {
        id: "1e311052-a2b4-4d9e-7f6c-3e5a8b9d0f12", tenantId: "demo", domain: "www.traumare.com", status: "connected",
        accessTypes: JSON.stringify(["wordpress"]),
        keywordsCount: 5, articlesCount: 0, avgPosition: 6.8,
        estimatedTraffic: 5000, backlinksCount: 200, healthScore: 74,
        lastAudit: "Hace 1h", createdAt: new Date().toISOString(),
      },
      {
        id: "dd262b94-b3c5-4e0a-8f7d-4f6b9c0e1a23", tenantId: "demo", domain: "participa.blockchaintools.cat", status: "connected",
        accessTypes: JSON.stringify(["wordpress"]),
        keywordsCount: 4, articlesCount: 0, avgPosition: 8.8,
        estimatedTraffic: 5000, backlinksCount: 200, healthScore: 76,
        lastAudit: "Hace 1h", createdAt: new Date().toISOString(),
      },
    ]).run();

    // === Keywords per website ===
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

    let kwCounter = 0;
    for (const [wid, kws] of Object.entries(websiteKeywords)) {
      for (const k of kws) {
        kwCounter++;
        tx.insert(keywords).values({
          id: `k${kwCounter}`, websiteId: wid, keyword: k.kw, position: k.pos, change: k.chg,
          volume: k.vol, difficulty: k.diff, history: JSON.stringify(k.hist),
          isTop3: k.top3, isFalling: k.fall,
        }).run();
      }
    }

    // === Competitors per website ===
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

    // === Ranking history per website ===
    const websiteHistory: Record<string, [string, number][]> = {
      "1": [
        ["10 May",14.2],["12 May",13.8],["14 May",14.5],["16 May",13.1],["18 May",12.9],["20 May",12.4],["22 May",11.8],["24 May",11.2],["26 May",10.7],["28 May",10.3],["30 May",9.8],["1 Jun",9.5],["3 Jun",9.2],["5 Jun",8.9],["7 Jun",8.6],["8 Jun",8.4],
      ],
      "2": [
        ["10 May",16.5],["12 May",16.1],["14 May",15.8],["16 May",15.2],["18 May",14.9],["20 May",14.5],["22 May",14.1],["24 May",13.8],["26 May",13.4],["28 May",13.0],["30 May",12.7],["1 Jun",12.5],["3 Jun",12.3],["5 Jun",12.2],["7 Jun",12.1],["8 Jun",12.1],
      ],
      "3": [
        ["10 May",25.0],["12 May",24.5],["14 May",24.0],["16 May",23.8],["18 May",23.2],["20 May",23.0],["22 May",22.8],["24 May",22.5],["26 May",22.3],["28 May",22.2],["30 May",22.1],["1 Jun",22.0],["3 Jun",22.0],["5 Jun",22.0],["7 Jun",22.0],["8 Jun",22.0],
      ],
      "5": [
        ["10 May",8.2],["12 May",7.9],["14 May",7.7],["16 May",7.4],["18 May",7.2],["20 May",6.9],["22 May",6.7],["24 May",6.5],["26 May",6.3],["28 May",6.1],["30 May",5.9],["1 Jun",5.8],["3 Jun",5.7],["5 Jun",5.6],["7 Jun",5.6],["8 Jun",5.6],
      ],
      "e74b0ab2-f1a3-4c8d-9e6b-2d5f7a8c9e01": [
        ["10 May",10.2],["12 May",9.9],["14 May",9.6],["16 May",9.3],["18 May",9.0],["20 May",8.7],["22 May",8.4],["24 May",8.1],["26 May",7.8],["28 May",7.5],["30 May",7.2],["1 Jun",6.9],["3 Jun",6.6],["5 Jun",6.4],["7 Jun",6.2],["8 Jun",6.2],
      ],
      "1e311052-a2b4-4d9e-7f6c-3e5a8b9d0f12": [
        ["10 May",9.5],["12 May",9.2],["14 May",9.0],["16 May",8.8],["18 May",8.5],["20 May",8.3],["22 May",8.1],["24 May",7.9],["26 May",7.7],["28 May",7.5],["30 May",7.3],["1 Jun",7.1],["3 Jun",6.9],["5 Jun",6.8],["7 Jun",6.8],["8 Jun",6.8],
      ],
      "dd262b94-b3c5-4e0a-8f7d-4f6b9c0e1a23": [
        ["10 May",11.0],["12 May",10.8],["14 May",10.5],["16 May",10.3],["18 May",10.0],["20 May",9.8],["22 May",9.6],["24 May",9.4],["26 May",9.2],["28 May",9.0],["30 May",8.9],["1 Jun",8.8],["3 Jun",8.8],["5 Jun",8.8],["7 Jun",8.8],["8 Jun",8.8],
      ],
    };

    for (const [wid, points] of Object.entries(websiteHistory)) {
      for (const [date, avgPosition] of points) {
        tx.insert(rankingHistory).values({ websiteId: wid, date, avgPosition }).run();
      }
    }

    // Insert articles for websites 1 and 2
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

    // Insert articles for websites 1 and 2
    tx.insert(articles).values([
      {
        id: "a1", websiteId: "1", title: "Guía Completa de SEO para Empresas B2B", status: "generating",
        aiModel: "deepseek", keywords: JSON.stringify(["seo b2b", "guia seo"]),
        progress: 45, createdAt: new Date().toISOString(),
      },
      {
        id: "a2", websiteId: "2", title: "Estrategias de Link Building en 2026", status: "draft",
        aiModel: "claude", keywords: JSON.stringify(["link building", "backlinks", "autoridad dominio"]),
        seoScores: JSON.stringify({ keywords: 92, readability: 85, structure: 68, originality: 94 }),
        metaDescription: "Descubre las estrategias de link building más efectivas para 2026: guest posting, HARO digital, link baiting con datos originales.",
        slug: "/blog/estrategias-link-building-2026/",
        content: JSON.stringify({ h2Sections: [{ title: "¿Por qué el Link Building sigue siendo clave?", paragraphs: ["A pesar de los cambios en los algoritmos de Google, los backlinks continúan siendo uno de los tres factores de posicionamiento más importantes."] }, { title: "Guest posting estratégico", paragraphs: ["No se trata de publicar en cualquier sitio. La clave está en identificar medios con autoridad real en tu nicho."] }] }),
        editedAt: "Hace 2h", createdAt: new Date().toISOString(),
      },
      {
        id: "a3", websiteId: "5", title: "Tendencias SEO para Ecommerce 2026", status: "scheduled",
        aiModel: "deepseek", keywords: JSON.stringify(["seo ecommerce", "tendencias", "woocommerce"]),
        scheduledAt: "12 Jun, 09:00", createdAt: new Date().toISOString(),
      },
      {
        id: "a4", websiteId: "1", title: "Cómo Posicionar tu Web en Google en 30 Días", status: "published",
        aiModel: "claude", keywords: JSON.stringify(["posicionar web", "google"]),
        position: 3, views: 1200, publishedAt: "8 Jun", createdAt: new Date().toISOString(),
      },
      {
        id: "a5", websiteId: "1", title: "Checklist Técnico SEO para Desarrolladores Web", status: "published",
        aiModel: "claude", keywords: JSON.stringify(["seo tecnico", "desarrolladores"]),
        position: 12, views: 890, publishedAt: "6 Jun", createdAt: new Date().toISOString(),
      },
      {
        id: "a6", websiteId: "2", title: "Herramientas de IA para Automatizar tu SEO", status: "published",
        aiModel: "deepseek", keywords: JSON.stringify(["ia seo", "herramientas"]),
        position: 5, views: 2100, publishedAt: "4 Jun", createdAt: new Date().toISOString(),
      },
    ]).run();

    // Insert reports for websites 1, 2
    tx.insert(reports).values([
      {
        id: "r1", websiteId: "1", name: "Informe Mensual — Junio 2026", status: "scheduled",
        frequency: "monthly", period: "Junio 2026",
        scheduleDescription: "día 1 de cada mes", scheduleEnabled: 1,
        metrics: JSON.stringify({ "Posición Media": "8.4 ↑", "Tráfico Estimado": "24.8K", "Backlinks": "1,204" }),
        colorScheme: "indigo",
        shareUrl: "https://multiseo.app/report/demo/june-2026?token=eyJhbG...",
        shareExpiresIn: 13, createdAt: new Date().toISOString(),
      },
      {
        id: "r2", websiteId: "2", name: "Informe Semanal — Semana 23", status: "sent",
        frequency: "weekly", period: "2-8 Jun 2026",
        scheduleDescription: "cada lunes 08:00", scheduleEnabled: 1,
        metrics: JSON.stringify({ "Keywords Top 10": "8/16", "Artículos Publicados": "2", "Mejora Semanal": "+2.3%" }),
        colorScheme: "green",
        shareUrl: "https://multiseo.app/report/demo/week-23?token=abc...",
        shareExpiresIn: 4, createdAt: new Date().toISOString(),
      },
      {
        id: "r3", websiteId: "1", name: "Nuevo Reporte Personalizado", status: "draft",
        frequency: "custom", period: "",
        scheduleEnabled: 0,
        metrics: JSON.stringify({}),
        colorScheme: "indigo", createdAt: new Date().toISOString(),
      },
    ]).run();

    // Insert notifications for demo tenant
    tx.insert(notifications).values([
      { id: "n1", tenantId: "demo", message: "competidor2.es subió 3 posiciones", type: "warning", time: "Hace 10m", read: 0, createdAt: new Date().toISOString() },
      { id: "n2", tenantId: "demo", message: "Artículo 'SEO B2B' generado con éxito", type: "success", time: "Hace 1h", read: 0, createdAt: new Date().toISOString() },
      { id: "n3", tenantId: "demo", message: "Conexión FTP fallida en old-project.net", type: "error", time: "Hace 3h", read: 0, createdAt: new Date().toISOString() },
      { id: "n4", tenantId: "demo", message: "Informe semanal listo para enviar", type: "info", time: "Hace 5h", read: 1, createdAt: new Date().toISOString() },
    ]).run();
  });

  console.log("Seed completed: 2 tenants, 5 websites, 5 keywords, 5 competitors, 16 ranking points, 6 articles, 3 reports, 4 notifications");
}

seed();
