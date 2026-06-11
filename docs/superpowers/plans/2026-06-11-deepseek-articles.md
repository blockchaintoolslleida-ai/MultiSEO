# DeepSeek Article Generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Integrate DeepSeek API for AI-powered article generation with a 3-step wizard and per-tenant API key management.

**Architecture:** New `src/lib/deepseek.ts` calls DeepSeek Chat API. `POST /api/articles/generate` resolves API key (tenant override → env default), calls DeepSeek, saves to DB. `ArticleWizard` component provides 3-step UI. `PATCH /api/tenants/[id]` allows API key configuration.

**Tech Stack:** Next.js 16.2, React 19, DeepSeek API (deepseek-chat model), SQLite + Drizzle ORM

---

### Task 1: Add deepseek_api_key to tenants schema + migrate

**Files:**
- Modify: `src/db/schema.ts` — add `deepseekApiKey: text("deepseek_api_key")` to tenants
- Modify: `src/db/migrate.ts` — add column to CREATE TABLE

Schema change in `tenants` table:

```typescript
export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  deepseekApiKey: text("deepseek_api_key"),
  createdAt: text("created_at").notNull().default(""),
});
```

Migrate change — add `deepseek_api_key TEXT` to tenants CREATE TABLE:

```sql
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  deepseek_api_key TEXT,
  created_at TEXT NOT NULL DEFAULT ''
);
```

Rebuild DB and seed to verify.

Commit: `feat: add deepseek_api_key to tenants table`

---

### Task 2: Create DeepSeek client library

**Files:**
- Create: `src/lib/deepseek.ts`

```typescript
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `Eres un redactor SEO experto. Generas artículos en español optimizados para motores de búsqueda.

Reglas:
- Usa las keywords proporcionadas de forma natural (densidad 1-2%)
- Estructura el artículo con H2 relevantes
- Incluye meta description (max 155 caracteres)
- Genera slug amigable (sin stop words)
- Añade datos, ejemplos y fuentes cuando sea relevante
- No inventes estadísticas sin base
- Responde solo con JSON válido`;

export interface GenerateParams {
  topic: string;
  keywords: string[];
  tone: string;
  length: string;
  structure: string[];
  apiKey: string;
}

export interface GeneratedArticle {
  title: string;
  metaDescription: string;
  slug: string;
  content: { h2Sections: { title: string; paragraphs: string[] }[] };
  seoScores: { keywords: number; readability: number; structure: number; originality: number };
}

function buildUserPrompt(p: GenerateParams): string {
  return `Genera un artículo SEO con estos parámetros:

TEMA: ${p.topic}
KEYWORDS: ${p.keywords.join(", ")}
TONO: ${p.tone}
EXTENSIÓN: ${p.length}
ESTRUCTURA: ${p.structure.join(", ")}

Responde ÚNICAMENTE con este JSON:
{
  "title": "título optimizado",
  "metaDescription": "meta de max 155 chars",
  "slug": "/blog/slug-del-articulo",
  "content": {
    "h2Sections": [
      { "title": "Título de la sección", "paragraphs": ["párrafo 1", "párrafo 2"] }
    ]
  },
  "seoScores": {
    "keywords": 0-100,
    "readability": 0-100,
    "structure": 0-100,
    "originality": 0-100
  }
}`;
}

export async function generateArticle(params: GenerateParams): Promise<GeneratedArticle> {
  const maxTokens = params.length === "corto" ? 1000 : params.length === "largo" ? 3000 : 2000;

  const response = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(params) },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

Commit: `feat: add DeepSeek client library`

---

### Task 3: Create POST /api/articles/generate endpoint

**Files:**
- Create: `src/app/api/articles/generate/route.ts`

```typescript
import { db } from "@/db";
import { tenants, articles } from "@/db/schema";
import { generateArticle } from "@/lib/deepseek";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, websiteId, topic, keywords, tone, length, structure } = body;

    if (!tenantId || !websiteId || !topic || !keywords?.length) {
      return Response.json({ error: "Missing required fields: tenantId, websiteId, topic, keywords" }, { status: 400 });
    }

    // Resolve API key
    const tenant = db.select().from(tenants).where(eq(tenants.id, tenantId)).get();
    if (!tenant) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    const apiKey = tenant.deepseekApiKey ?? process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "DeepSeek API key not configured. Set DEEPSEEK_API_KEY in .env.local or configure it for this tenant." }, { status: 400 });
    }

    // Generate article
    const generated = await generateArticle({ topic, keywords, tone: tone ?? "divulgativo", length: length ?? "medio", structure: structure ?? ["introducción", "secciones H2", "conclusión"], apiKey });

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
    });

    return Response.json({ data: { id, ...generated } }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate article";
    return Response.json({ error: message }, { status: 500 });
  }
}
```

Commit: `feat: add POST /api/articles/generate endpoint`

---

### Task 4: Create PATCH /api/tenants/[id] for settings

**Files:**
- Create: `src/app/api/tenants/[id]/route.ts`

```typescript
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = db.select().from(tenants).where(eq(tenants.id, id)).get();
    if (!existing) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.deepseekApiKey !== undefined) updateData.deepseekApiKey = body.deepseekApiKey;

    if (Object.keys(updateData).length > 0) {
      db.update(tenants).set(updateData).where(eq(tenants.id, id)).run();
    }

    const updated = db.select().from(tenants).where(eq(tenants.id, id)).get();
    return Response.json({ data: updated });
  } catch (error) {
    return Response.json({ error: "Failed to update tenant" }, { status: 500 });
  }
}
```

Commit: `feat: add PATCH /api/tenants/[id] for settings`

---

### Task 5: Create ArticleWizard component

**Files:**
- Create: `src/components/articles/article-wizard.tsx`

Wizard de 3 pasos con:
- Paso 1: topic, keywords (coma-separadas), website dropdown (fetch /api/websites?tenantId=...)
- Paso 2: tone (radio), length (radio), structure (checkboxes)
- Paso 3: loading spinner mientras genera, preview del artículo con secciones H2, SEO scores

Botones: Cancelar, Atrás, Siguiente, Generar, Regenerar, Guardar Draft, Publicar.

Props: `{ open: boolean; onClose: () => void; tenantId: string }`

Usa `useState` para `step` (1-3), `formData`, `generatedArticle`.

Commit: `feat: add ArticleWizard 3-step component`

---

### Task 6: Integrate wizard into Articles page

**Files:**
- Modify: `src/app/articles/page.tsx`

Add state for wizard open/close. Replace the "Generar Artículo" button onClick to open wizard. Add `<ArticleWizard>` at the end of the JSX. Pass `tenant.id` from useTenant.

Commit: `feat: integrate ArticleWizard into Articles page`

---

### Task 7: End-to-end verification

1. Add `DEEPSEEK_API_KEY=sk-...` to `.env.local`
2. Rebuild DB: `rm multiseo.db && npx tsx src/db/migrate.ts && npx tsx src/db/seed.ts`
3. Start dev server (`npm run dev`)
4. Test generate endpoint: `curl -X POST http://localhost:4000/api/articles/generate -H "Content-Type: application/json" -d '{"tenantId":"demo","websiteId":"1","topic":"Prueba de generación","keywords":["test","prueba"],"tone":"divulgativo","length":"corto","structure":["introducción","conclusión"]}'`
5. Verify article appears in GET /api/articles?tenantId=demo
6. Test tenant API key: `curl -X PATCH http://localhost:4000/api/tenants/demo -H "Content-Type: application/json" -d '{"deepseekApiKey":"sk-test"}'`
7. Open browser at `/articles`, click "Generar Artículo", verify 3-step wizard
