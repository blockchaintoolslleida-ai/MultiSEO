import type {
  SEODashboardData,
  WebsiteData,
  WebsiteStats,
  ArticleData,
  ReportData,
  NotificationData,
} from "@/types/seo";

export function getDashboardData(): SEODashboardData {
  return {
    websiteUrl: "sitioweb.com",
    kpis: {
      avgPosition: { value: 8.4, change: 2.1, trend: "up" },
      estimatedTraffic: { value: 24800, change: 12.3, trend: "up" },
      backlinks: { value: 1204, change: 48, trend: "up" },
      healthScore: { value: 72, change: 5, trend: "up" },
    },
    rankingHistory: [
      { date: "10 May", avgPosition: 14.2 }, { date: "12 May", avgPosition: 13.8 },
      { date: "14 May", avgPosition: 14.5 }, { date: "16 May", avgPosition: 13.1 },
      { date: "18 May", avgPosition: 12.9 }, { date: "20 May", avgPosition: 12.4 },
      { date: "22 May", avgPosition: 11.8 }, { date: "24 May", avgPosition: 11.2 },
      { date: "26 May", avgPosition: 10.7 }, { date: "28 May", avgPosition: 10.3 },
      { date: "30 May", avgPosition: 9.8 },  { date: "1 Jun", avgPosition: 9.5 },
      { date: "3 Jun", avgPosition: 9.2 },  { date: "5 Jun", avgPosition: 8.9 },
      { date: "7 Jun", avgPosition: 8.6 },  { date: "8 Jun", avgPosition: 8.4 },
    ],
    competitors: [
      { rank: 1, domain: "Tu web", avgPosition: 8.4, trend: "up" },
      { rank: 2, domain: "competidor1.com", avgPosition: 5.2, trend: "flat" },
      { rank: 3, domain: "competidor2.es", avgPosition: 6.8, trend: "up", highlightChange: true },
      { rank: 4, domain: "competidor3.com", avgPosition: 9.1, trend: "down" },
      { rank: 5, domain: "competidor4.net", avgPosition: 11.3, trend: "flat" },
    ],
    keywords: [
      { id: "1", keyword: "seo para empresas", position: 3, change: 2, volume: 3200, difficulty: "medium", history: [8, 7, 6, 5, 4, 3, 3], isTop3: true },
      { id: "2", keyword: "agencia seo barcelona", position: 7, change: 0, volume: 1800, difficulty: "hard", history: [7, 8, 7, 7, 6, 7, 7] },
      { id: "3", keyword: "posicionamiento web", position: 12, change: 4, volume: 5100, difficulty: "hard", history: [18, 17, 16, 15, 14, 13, 12] },
      { id: "4", keyword: "consultor seo freelance", position: 18, change: -5, volume: 2400, difficulty: "easy", history: [12, 14, 13, 15, 16, 17, 18], isFalling: true },
      { id: "5", keyword: "herramientas seo automaticas", position: 9, change: 1, volume: 890, difficulty: "easy", history: [11, 11, 10, 10, 9, 9, 9] },
    ],
  };
}

export function getWebsiteStats(): WebsiteStats {
  return { total: 6, connected: 4, noAccess: 1, error: 1 };
}

export function getWebsites(): WebsiteData[] {
  return [
    {
      id: "1", domain: "sitioweb.com", status: "connected",
      accessTypes: ["wordpress", "ftp", "cpanel"],
      keywords: 24, articles: 18, avgPosition: 8.4, lastAudit: "Hace 2h",
    },
    {
      id: "2", domain: "mitiendaonline.es", status: "connected",
      accessTypes: ["wordpress", "ssh"],
      keywords: 16, articles: 9, avgPosition: 12.1, lastAudit: "Hace 5h",
    },
    {
      id: "3", domain: "blog-antiguo.com", status: "no-access",
      accessTypes: ["wordpress"],
      keywords: 8, articles: 0, avgPosition: 22, lastAudit: "Hace 12d",
      errorMessage: "Credenciales expiradas — actualizar acceso",
    },
    {
      id: "4", domain: "old-project.net", status: "error",
      accessTypes: ["ftp", "cpanel"],
      keywords: 5, articles: 0, avgPosition: 35, lastAudit: "Nunca",
      errorMessage: "Error conexión FTP — timeout tras 30s",
    },
    {
      id: "5", domain: "agencia-marketing.io", status: "connected",
      accessTypes: ["wordpress", "ftp", "ssh"],
      keywords: 32, articles: 27, avgPosition: 5.6, lastAudit: "Hace 30m",
    },
  ];
}

export function getArticles(): ArticleData[] {
  return [
    {
      id: "1", title: "Guía Completa de SEO para Empresas B2B", status: "generating",
      aiModel: "deepseek", websiteUrl: "sitioweb.com", progress: 45, keywords: ["seo b2b", "guia seo"],
    },
    {
      id: "2", title: "Estrategias de Link Building en 2026", status: "draft",
      aiModel: "claude", websiteUrl: "mitiendaonline.es", editedAt: "Hace 2h",
      keywords: ["link building", "backlinks", "autoridad dominio"],
      seoScores: { keywords: 92, readability: 85, structure: 68, originality: 94 },
      metaDescription: "Descubre las estrategias de link building más efectivas para 2026: guest posting, HARO digital, link baiting con datos originales.",
      slug: "/blog/estrategias-link-building-2026/",
      content: {
        h2Sections: [
          { title: "¿Por qué el Link Building sigue siendo clave?", paragraphs: ["A pesar de los cambios en los algoritmos de Google, los backlinks continúan siendo uno de los tres factores de posicionamiento más importantes."] },
          { title: "Guest posting estratégico", paragraphs: ["No se trata de publicar en cualquier sitio. La clave está en identificar medios con autoridad real en tu nicho."] },
        ],
      },
    },
    {
      id: "3", title: "Tendencias SEO para Ecommerce 2026", status: "scheduled",
      aiModel: "deepseek", websiteUrl: "agencia-marketing.io", scheduledAt: "12 Jun, 09:00",
      keywords: ["seo ecommerce", "tendencias", "woocommerce"],
    },
    {
      id: "4", title: "Cómo Posicionar tu Web en Google en 30 Días", status: "published",
      aiModel: "claude", websiteUrl: "sitioweb.com", publishedAt: "8 Jun",
      keywords: ["posicionar web", "google"],
      position: 3, views: 1200,
    },
    {
      id: "5", title: "Checklist Técnico SEO para Desarrolladores Web", status: "published",
      aiModel: "claude", websiteUrl: "sitioweb.com", publishedAt: "6 Jun",
      keywords: ["seo tecnico", "desarrolladores"],
      position: 12, views: 890,
    },
    {
      id: "6", title: "Herramientas de IA para Automatizar tu SEO", status: "published",
      aiModel: "deepseek", websiteUrl: "mitiendaonline.es", publishedAt: "4 Jun",
      keywords: ["ia seo", "herramientas"],
      position: 5, views: 2100,
    },
  ];
}

export function getReports(): ReportData[] {
  return [
    {
      id: "1", name: "Informe Mensual — Junio 2026", status: "scheduled", frequency: "monthly",
      websiteUrl: "sitioweb.com", period: "Junio 2026",
      scheduleDescription: "día 1 de cada mes", scheduleEnabled: true,
      metrics: { "Posición Media": "8.4 ↑", "Tráfico Estimado": "24.8K", "Backlinks": "1,204" },
      colorScheme: "indigo",
      shareUrl: "https://multiseo.app/report/demo/june-2026?token=eyJhbG...",
      shareExpiresIn: 13,
    },
    {
      id: "2", name: "Informe Semanal — Semana 23", status: "sent", frequency: "weekly",
      websiteUrl: "mitiendaonline.es", period: "2-8 Jun 2026",
      scheduleDescription: "cada lunes 08:00", scheduleEnabled: true,
      metrics: { "Keywords Top 10": "8/16", "Artículos Publicados": "2", "Mejora Semanal": "+2.3%" },
      colorScheme: "green",
      shareUrl: "https://multiseo.app/report/demo/week-23?token=abc...",
      shareExpiresIn: 4,
    },
    {
      id: "3", name: "Nuevo Reporte Personalizado", status: "draft", frequency: "custom",
      websiteUrl: "", period: "",
      scheduleEnabled: false,
      metrics: {},
      colorScheme: "indigo",
    },
  ];
}

export function getNotifications(): NotificationData[] {
  return [
    { id: "1", message: "competidor2.es subió 3 posiciones", type: "warning", time: "Hace 10m", read: false },
    { id: "2", message: "Artículo 'SEO B2B' generado con éxito", type: "success", time: "Hace 1h", read: false },
    { id: "3", message: "Conexión FTP fallida en old-project.net", type: "error", time: "Hace 3h", read: false },
    { id: "4", message: "Informe semanal listo para enviar", type: "info", time: "Hace 5h", read: true },
  ];
}
