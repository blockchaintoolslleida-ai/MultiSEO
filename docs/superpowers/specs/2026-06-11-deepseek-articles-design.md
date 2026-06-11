# DeepSeek Article Generation — Diseño

**Fecha:** 2026-06-11
**Alcance:** Integrar DeepSeek API para generación de artículos SEO con wizard de 3 pasos y gestión de API keys por tenant
**Fuera de alcance:** Otras APIs (Anthropic, DataForSEO, Bright Data), edición inline de artículos, programación de generación automática

---

## 1. API Key Management

### Variable de entorno

```
# .env.local
DEEPSEEK_API_KEY=sk-...
```

### Columna nueva en `tenants`

| Columna | Tipo | Notas |
|---------|------|-------|
| `deepseek_api_key` | `text` | nullable. Si es null, se usa `DEEPSEEK_API_KEY` del entorno |

### Lógica de resolución

```typescript
const apiKey = tenant.deepseekApiKey ?? process.env.DEEPSEEK_API_KEY;
if (!apiKey) return Response.json({ error: "DeepSeek API key not configured" }, { status: 400 });
```

### Settings endpoint

`PATCH /api/tenants/[id]` — acepta `{ deepseekApiKey: "sk-..." }` y actualiza el tenant.

---

## 2. Wizard de 3 pasos

### Componente: `ArticleWizard` (`src/components/articles/article-wizard.tsx`)

Modal/panel que se abre al hacer clic en "Generar Artículo".

#### Paso 1: Tema y Keywords

Campos:
- `topic` (texto) — título/tema del artículo
- `keywords` (texto, separadas por coma) — keywords objetivo
- `websiteId` (select) — dropdown con los websites del tenant activo

Validación: topic requerido (min 10 chars), al menos 1 keyword

#### Paso 2: Configuración

Campos:
- `tone` (radio) — `"profesional"` | `"divulgativo"` | `"técnico"`
- `length` (radio) — `"corto"` (~500 palabras) | `"medio"` (~1000) | `"largo"` (~2000)
- `structure` (checkboxes) — `["introducción", "secciones H2", "conclusión", "FAQ"]`
- `model` (fijo por ahora) — "DeepSeek"

#### Paso 3: Preview

Muestra el artículo generado:
- Título, meta description, slug
- Contenido renderizado con secciones H2
- SEO Scores (keywords, readability, structure, originality)

Botones: `[Regenerar]` `[Atrás]` `[Guardar como Draft]` `[Publicar]`

---

## 3. DeepSeek Integration

### System Prompt

Eres un redactor SEO experto. Generas artículos en español optimizados para motores de búsqueda. Reglas: usa keywords con densidad 1-2%, estructura H2 relevante, meta description ≤155 chars, slug sin stop words, añade datos/ejemplos reales, no inventes estadísticas, responde solo JSON válido.

### API Call (`src/lib/deepseek.ts`)

```typescript
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

export async function generateArticle(params: GenerateParams): Promise<GeneratedArticle> {
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
      max_tokens: params.length === "corto" ? 1000 : params.length === "largo" ? 3000 : 2000,
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

### Endpoint `POST /api/articles/generate`

1. Recibe `{ tenantId, websiteId, topic, keywords, tone, length, structure }`
2. Resuelve API key (tenant override → env default → error 400)
3. Llama a `generateArticle()`
4. Inserta artículo en DB con status `"draft"` y `aiModel: "deepseek"`
5. Devuelve el artículo generado (201)

---

## 4. Archivos

| Archivo | Acción |
|---------|--------|
| `.env.local` | CREATE: `DEEPSEEK_API_KEY=...` |
| `src/db/schema.ts` | MOD: añadir `deepseekApiKey` a tabla `tenants` |
| `src/db/migrate.ts` | MOD: añadir columna `deepseek_api_key` |
| `src/db/seed.ts` | MOD: seed tenants con deepseek_api_key=null |
| `src/lib/deepseek.ts` | CREATE: función `generateArticle()` |
| `src/app/api/articles/generate/route.ts` | CREATE: POST endpoint |
| `src/app/api/tenants/[id]/route.ts` | CREATE: PATCH endpoint para settings |
| `src/components/articles/article-wizard.tsx` | CREATE: wizard 3 pasos |
| `src/app/articles/page.tsx` | MOD: integrar wizard, abrir modal |

---

## 5. Lo que NO incluye

- Streaming de generación (se usa respuesta completa)
- Cola de generación en background
- Soporte para Anthropic Claude (solo DeepSeek)
- Edición inline del artículo generado
- Programación automática de artículos
- UI de settings de API key (se configura vía API por ahora)
