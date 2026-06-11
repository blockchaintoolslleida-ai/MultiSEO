import { db } from "@/db";
import { tenants, articles } from "@/db/schema";
import { generateArticle } from "@/lib/deepseek";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, websiteId, topic, keywords, tone, length, structure } = body;

    if (!tenantId || !websiteId || !topic || !keywords?.length) {
      return Response.json(
        { error: "Missing required fields: tenantId, websiteId, topic, keywords" },
        { status: 400 }
      );
    }

    // Resolve API key: tenant override → env default
    const tenant = db.select().from(tenants).where(eq(tenants.id, tenantId)).get();
    if (!tenant) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    const apiKey = tenant.deepseekApiKey ?? process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "DeepSeek API key not configured. Set DEEPSEEK_API_KEY in .env.local or configure it for this tenant." },
        { status: 400 }
      );
    }

    // Generate article via DeepSeek
    const generated = await generateArticle({
      topic,
      keywords,
      tone: tone ?? "divulgativo",
      length: length ?? "medio",
      structure: structure ?? ["introducción", "secciones H2", "conclusión"],
      apiKey,
    });

    // Save to DB
    const id = crypto.randomUUID();
    db.insert(articles).values({
      id,
      websiteId,
      title: generated.title,
      status: "draft",
      aiModel: "deepseek",
      keywords: JSON.stringify(keywords),
      metaDescription: generated.metaDescription,
      slug: generated.slug,
      content: JSON.stringify(generated.content),
      seoScores: JSON.stringify(generated.seoScores),
      createdAt: new Date().toISOString(),
    }).run();

    return Response.json({ data: { id, ...generated } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate article";
    return Response.json({ error: message }, { status: 500 });
  }
}
