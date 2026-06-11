import { db } from "./index";
import { tenants, websites, keywords, competitors, rankingHistory, articles, reports, notifications } from "./schema";

function seed() {
  db.transaction((tx) => {
    // Clear existing data
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
      { id: "demo", name: "Demo Company", slug: "demo-company", createdAt: new Date().toISOString() },
      { id: "acme", name: "Acme Corp", slug: "acme-corp", createdAt: new Date().toISOString() },
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
    ]).run();

    const website1Id = "1";

    tx.insert(keywords).values([
      { id: "k1", websiteId: website1Id, keyword: "seo para empresas", position: 3, change: 2, volume: 3200, difficulty: "medium", history: JSON.stringify([8, 7, 6, 5, 4, 3, 3]), isTop3: 1, isFalling: 0 },
      { id: "k2", websiteId: website1Id, keyword: "agencia seo barcelona", position: 7, change: 0, volume: 1800, difficulty: "hard", history: JSON.stringify([7, 8, 7, 7, 6, 7, 7]), isTop3: 0, isFalling: 0 },
      { id: "k3", websiteId: website1Id, keyword: "posicionamiento web", position: 12, change: 4, volume: 5100, difficulty: "hard", history: JSON.stringify([18, 17, 16, 15, 14, 13, 12]), isTop3: 0, isFalling: 0 },
      { id: "k4", websiteId: website1Id, keyword: "consultor seo freelance", position: 18, change: -5, volume: 2400, difficulty: "easy", history: JSON.stringify([12, 14, 13, 15, 16, 17, 18]), isTop3: 0, isFalling: 1 },
      { id: "k5", websiteId: website1Id, keyword: "herramientas seo automaticas", position: 9, change: 1, volume: 890, difficulty: "easy", history: JSON.stringify([11, 11, 10, 10, 9, 9, 9]), isTop3: 0, isFalling: 0 },
    ]).run();

    tx.insert(competitors).values([
      { id: "c1", websiteId: website1Id, rank: 1, domain: "Tu web", avgPosition: 8.4, trend: "up", highlightChange: 0 },
      { id: "c2", websiteId: website1Id, rank: 2, domain: "competidor1.com", avgPosition: 5.2, trend: "flat", highlightChange: 0 },
      { id: "c3", websiteId: website1Id, rank: 3, domain: "competidor2.es", avgPosition: 6.8, trend: "up", highlightChange: 1 },
      { id: "c4", websiteId: website1Id, rank: 4, domain: "competidor3.com", avgPosition: 9.1, trend: "down", highlightChange: 0 },
      { id: "c5", websiteId: website1Id, rank: 5, domain: "competidor4.net", avgPosition: 11.3, trend: "flat", highlightChange: 0 },
    ]).run();

    const history: [string, number][] = [
      ["10 May", 14.2], ["12 May", 13.8], ["14 May", 14.5], ["16 May", 13.1],
      ["18 May", 12.9], ["20 May", 12.4], ["22 May", 11.8], ["24 May", 11.2],
      ["26 May", 10.7], ["28 May", 10.3], ["30 May", 9.8],  ["1 Jun", 9.5],
      ["3 Jun", 9.2],  ["5 Jun", 8.9],   ["7 Jun", 8.6],   ["8 Jun", 8.4],
    ];
    for (const [date, avgPosition] of history) {
      tx.insert(rankingHistory).values({ websiteId: website1Id, date, avgPosition }).run();
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
