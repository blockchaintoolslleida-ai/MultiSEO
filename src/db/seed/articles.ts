import { articles } from "@/db/schema";

export function seedArticles(tx: any): void {
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
}
