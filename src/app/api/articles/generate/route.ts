import { db } from "@/db";
import { tenants, articles } from "@/db/schema";
import { generateArticle } from "@/lib/deepseek";
import { eq } from "drizzle-orm";
import { getTenantId } from "@/lib/tenant";
import { getTenantSecret } from "@/lib/tenant-secrets";
import { parseBody, validationErrorResponse } from "@/lib/validate";
import { z, ZodError } from "zod";

const generateArticleSchema = z.object({
  websiteId: z.string().min(1, "websiteId is required"),
  topic: z.string().min(1, "topic is required"),
  keywords: z.array(z.string()).min(1, "at least one keyword is required"),
  tone: z.string().default("divulgativo"),
  length: z.string().default("medio"),
  structure: z.array(z.string()).default(["introduccion", "secciones H2", "conclusion"]),
});

export async function POST(request: Request) {
  try {
    const tenantId = getTenantId(request);
    const body = await parseBody(request, generateArticleSchema);
    const { websiteId, topic, keywords, tone, length, structure } = body;

    // Resolve API key: tenant override → env default
    const tenant = db.select().from(tenants).where(eq(tenants.id, tenantId)).get();
    if (!tenant) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    const apiKey = getTenantSecret(tenant, "deepseekApiKey") ?? process.env.DEEPSEEK_API_KEY;
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
      tone,
      length,
      structure,
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
    if (error instanceof ZodError) return validationErrorResponse(error);
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : "Failed to generate article";
    return Response.json({ error: message }, { status: 500 });
  }
}
