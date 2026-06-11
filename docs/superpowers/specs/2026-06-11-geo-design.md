# GEO (Generative Engine Optimization) Module Design

> **Goal:** Add a GEO tracking module to MultiSEO that monitors brand visibility, share of voice, and content recommendations across AI engines (DeepSeek first, with pluggable architecture for ChatGPT, Perplexity, Google AI Overviews, Copilot).

**Architecture:** Independent `/geo` section reusing `TenantProvider`, `useApi`, `useTenant`, and website selector pattern from SEO module. New DB tables (`geo_queries`, `geo_results`), new API routes (`/api/geo/*`), new UI components (`src/components/geo/*`). Pluggable provider system: each AI engine implements a `GEOProvider` interface, added via configuration without core code changes.

**Tech Stack:** Next.js 16 App Router, React 19, SQLite + Drizzle ORM, Tailwind 4, DeepSeek API (existing integration)

---

## Database Schema

### New tables

**geo_queries** — Queries to send to AI engines (auto-generated from SEO keywords + manual)

```sql
geo_queries (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,           -- original SEO keyword
  query TEXT NOT NULL,             -- conversational version for GEO
  source TEXT DEFAULT 'seo',       -- 'seo' | 'manual'
  enabled INTEGER DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT ''
)
```

**geo_results** — Scan results from each query × provider

```sql
geo_results (
  id TEXT PRIMARY KEY,
  website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  query_id TEXT NOT NULL REFERENCES geo_queries(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,          -- 'deepseek' | 'chatgpt' | 'perplexity' | 'google' | 'copilot'
  brand_mentioned INTEGER DEFAULT 0,
  mention_position INTEGER,        -- null if not mentioned
  sentiment TEXT DEFAULT 'neutral', -- 'positive' | 'negative' | 'neutral'
  snippet TEXT,
  competitors_mentioned TEXT,      -- JSON array: ["competidor1.com", "competidor2.es"]
  response_full TEXT,
  scanned_at TEXT NOT NULL DEFAULT ''
)
```

### Columns added to `tenants`

- `geo_provider_keys TEXT` — JSON: `{"deepseek": "sk-...", "chatgpt": null, ...}`
- `geo_enabled_providers TEXT` — JSON array: `["deepseek"]`

**Migration pattern:** Same as existing GSC/Telegram columns — check via `PRAGMA table_info(tenants)`, add with `ALTER TABLE IF NOT EXISTS`.

---

## Provider System

### GEOProvider interface (`src/lib/geo/types.ts`)

```typescript
export interface GEOProviderConfig {
  apiKey: string;
  model?: string;
}

export interface GEOQueryRequest {
  query: string;
  targetBrand: string;
  competitorBrands: string[];
}

export interface GEOResponse {
  brandMentioned: boolean;
  mentionPosition: number | null;
  sentiment: 'positive' | 'negative' | 'neutral';
  snippet: string;
  competitorsMentioned: string[];
  fullResponse: string;
}

export interface GEOProvider {
  id: string;
  name: string;
  query(prompt: GEOQueryRequest): Promise<GEOResponse>;
  isAvailable(): Promise<boolean>;
}
```

### DeepSeekGEOProvider (`src/lib/geo/providers/deepseek.ts`)

Reuses `DEEPSEEK_API_KEY` from env or tenant settings. Sends a system prompt instructing DeepSeek to analyze brand presence:

```
System: Eres un analizador de visibilidad de marca. Te doy una pregunta de usuario y necesito que analices si la marca [BRAND] aparece mencionada en tu respuesta, en qué posición, con qué sentimiento, y qué competidores se mencionan. Responde SIEMPRE en JSON con este formato exacto:
{
  "brandMentioned": true/false,
  "mentionPosition": 1-10 o null,
  "sentiment": "positive"|"negative"|"neutral",
  "snippet": "texto donde se menciona la marca",
  "competitorsMentioned": ["dominio1.com", "dominio2.es"]
}

User pregunta: [QUERY]
```

### Provider factory (`src/lib/geo/providers/factory.ts`)

```typescript
export function getGEOProviders(tenant: Tenant): GEOProvider[] {
  const keys = JSON.parse(tenant.geoProviderKeys || '{}');
  const enabled = JSON.parse(tenant.geoEnabledProviders || '["deepseek"]');
  const providers: GEOProvider[] = [];
  
  if (enabled.includes('deepseek') && keys.deepseek) {
    providers.push(new DeepSeekGEOProvider({ apiKey: keys.deepseek }));
  }
  // Future: chatgpt, perplexity, google, copilot
  
  return providers;
}
```

### Query transformation (`src/lib/geo/query-transformer.ts`)

Converts SEO keywords into conversational GEO queries:

```typescript
const TRANSFORMERS = [
  (kw: string) => `¿cuál es el mejor ${kw}?`,
  (kw: string) => `recomiéndame ${kw}`,
  (kw: string) => `¿qué ${kw} me recomiendas?`,
  (kw: string) => `mejores ${kw} cerca de mi`,
];

export function transformKeyword(keyword: string): string[] {
  return TRANSFORMERS.map(fn => fn(keyword));
}
```

One SEO keyword generates multiple GEO queries (different phrasings). The user can disable individual transformed queries.

---

## API Routes

All routes follow existing patterns: `src/app/api/geo/[resource]/route.ts`

### GET `/api/geo/queries?websiteId=X`
Returns all GEO queries for a website (both SEO-auto-generated and manual).
```json
{ "data": [{ "id": "gq1", "keyword": "seo para empresas", "query": "¿cuál es el mejor seo para empresas?", "source": "seo", "enabled": true }] }
```

### POST `/api/geo/queries`
Adds a manual GEO query.
```json
// Request: { "websiteId": "1", "keyword": "seo barato", "query": "¿mejor agencia seo económica?" }
// Response: { "data": { "id": "gq-new", ... } }
```

### DELETE `/api/geo/queries/[id]`
Deletes a manual GEO query. SEO-generated queries cannot be deleted, only disabled.

### POST `/api/geo/scan`
Runs a full scan: sends all enabled queries to all enabled providers, stores results.
```json
// Request: { "websiteId": "1" }
// Response: { "data": { "queriesScanned": 12, "providersUsed": ["deepseek"], "brandMentions": 7, "avgSentiment": "positive", "duration": "3.2s" } }
```

Flow:
1. Load `geo_queries` for website where `enabled = 1`
2. Load providers via factory
3. For each query × provider (sequential with 500ms delay between calls):
   - Call `provider.query()`
   - Save `geo_result` row
4. Return summary

### GET `/api/geo/results?websiteId=X`
Returns the latest scan results aggregated.
```json
{
  "data": {
    "kpis": {
      "visibility": { "value": 62, "change": 3, "trend": "up" },
      "brandMentions": { "value": 7, "change": 12, "trend": "up" },
      "avgSentiment": { "value": "positive" },
      "shareOfVoice": { "value": 34, "change": -2, "trend": "down" },
      "activeQueries": { "value": 12 }
    },
    "queryResults": [{ "query": "...", "brandMentioned": true, "snippet": "...", "sentiment": "positive" }],
    "competitorMentions": [{ "domain": "competidor1.com", "mentions": 5 }, { "domain": "competidor2.es", "mentions": 3 }]
  }
}
```

### GET `/api/geo/share-of-voice?websiteId=X`
Aggregates competitor mentions across all queries.
```json
{ "data": [{ "domain": "sitioweb.com", "mentions": 7, "percentage": 34 }, { "domain": "competidor1.com", "mentions": 5, "percentage": 24 }] }
```

### GET `/api/geo/recommendations?websiteId=X`
Generates actionable recommendations by analyzing scan results with DeepSeek.
```json
{ "data": [{ "type": "content", "title": "Crear contenido sobre automatización SEO", "description": "Apareces en 0/5 queries. Competidores lideran con guías prácticas.", "priority": "high" }] }
```

---

## Frontend

### Navigation entry

New sidebar item in `src/components/layout/sidebar.tsx`:
```typescript
{
  title: "Análisis",
  items: [
    { label: "Dashboard SEO", href: "/dashboard", icon: "chart" },
    { label: "GEO Tracker", href: "/geo", icon: "bot" },        // NEW
    { label: "Artículos", href: "/articles", icon: "file" },
    { label: "Reportes", href: "/reports", icon: "report" },
  ]
}
```

### Page: `src/app/geo/page.tsx`

"use client" page with same state pattern as dashboard:
- `websiteId` state + website selector dropdown
- `useApi<GEOResults>(...)` for KPIs and query results
- `useApi<ShareOfVoice[]>(...)` for competitive chart
- `useApi<Recommendation[]>(...)` for recommendations
- "Escanear Ahora" button → `POST /api/geo/scan` → loading → refetch

### Components (all in `src/components/geo/`)

**`geo-kpi-grid.tsx`** — 5 KPI cards: Visibilidad (%), Brand Mentions (#), Sentimiento Medio (emoji), Share of Voice (%), Queries Activas (#). Reuses same visual pattern as `kpi-grid.tsx`.

**`share-of-voice-chart.tsx`** — Horizontal bar chart showing brand vs competitors mention percentages. Pure CSS bars with labels. No chart library dependency.

**`visibility-list.tsx`** — List of queries with ✅/❌ indicator for brand mention, snippet preview, sentiment badge. Expandable to show full AI response.

**`recommendations-panel.tsx`** — Cards with type icons (📝 content, 🔗 backlinks, 🏗️ technical), priority badge (high/medium/low), and description.

**`query-manager.tsx`** — Table: query text, source badge (SEO/manual), enable/disable toggle, delete button (manual only). Add manual query form at bottom.

### Data flow

```
User clicks "Escanear Ahora"
  → POST /api/geo/scan { websiteId }
  → Server queries DeepSeek (and other enabled providers)
  → Results saved to geo_results
  → Response returns summary
  → Page refetches /api/geo/results, /api/geo/share-of-voice, /api/geo/recommendations
  → All components update with fresh data
```

---

## Seed Data (`src/db/seed.ts` additions)

For demo tenant, auto-generate GEO queries from existing keywords:
- Website "1": 5 keywords → ~20 GEO queries (4 transformers × 5 keywords)
- A few manual GEO queries for demonstration
- Pre-computed `geo_results` for the first scan (show realistic data on first load)

---

## Implementation Order

1. **Schema + migration** — Add `geo_queries`, `geo_results` tables + `tenants` columns
2. **Provider system** — `GEOProvider` interface + `DeepSeekGEOProvider` + factory + query transformer
3. **API routes** — `/api/geo/queries` (GET/POST/DELETE), `/api/geo/scan` (POST), `/api/geo/results` (GET), `/api/geo/share-of-voice` (GET), `/api/geo/recommendations` (GET)
4. **Seed data** — Generate GEO queries from existing keywords, pre-computed results
5. **Frontend components** — KPIs, share of voice chart, visibility list, recommendations, query manager
6. **Page + navigation** — `/geo` page, sidebar entry, breadcrumb
7. **E2E verification** — Scan, verify results display, test with website selector
