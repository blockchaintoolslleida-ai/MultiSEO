# Backend SQLite + Drizzle — Diseño

**Fecha:** 2026-06-11
**Alcance:** Conectar Websites + Dashboard a SQLite con Drizzle ORM
**Fuera de alcance:** Multi-tenancy, artículos, reports, integración con APIs externas de SEO

---

## 1. Stack

- **ORM:** Drizzle (tipado, ligero, sin servidor)
- **BD:** SQLite (`better-sqlite3` — sincrónico, sin dependencias externas)
- **API:** Next.js API Routes (App Router)
- **Frontend:** fetch directo desde Server/Client Components

---

## 2. Schema

### `websites`

| Columna | Tipo | PK/FK | Notas |
|---------|------|-------|-------|
| `id` | `text` | PK | UUID v4 |
| `domain` | `text` | unique | ej. "sitioweb.com" |
| `status` | `text` | | `"connected"` / `"no-access"` / `"error"` |
| `access_types` | `text` | | JSON array: `["wordpress","ftp","ssh","cpanel"]` |
| `keywords_count` | `integer` | | default 0 |
| `articles_count` | `integer` | | default 0 |
| `avg_position` | `real` | | default 0 |
| `estimated_traffic` | `integer` | | default 0 |
| `backlinks_count` | `integer` | | default 0 |
| `health_score` | `integer` | | default 0 |
| `last_audit` | `text` | | ej. "Hace 2h" |
| `error_message` | `text` | | nullable |
| `created_at` | `text` | | ISO 8601 |

### `keywords`

| Columna | Tipo | PK/FK | Notas |
|---------|------|-------|-------|
| `id` | `text` | PK | UUID v4 |
| `website_id` | `text` | FK → websites.id | |
| `keyword` | `text` | | |
| `position` | `integer` | | |
| `change` | `integer` | | |
| `volume` | `integer` | | |
| `difficulty` | `text` | | `"easy"` / `"medium"` / `"hard"` |
| `history` | `text` | | JSON array `[14, 12, 10, 8]` |
| `is_top3` | `integer` | | boolean 0/1 |
| `is_falling` | `integer` | | boolean 0/1 |

### `competitors`

| Columna | Tipo | PK/FK | Notas |
|---------|------|-------|-------|
| `id` | `text` | PK | UUID v4 |
| `website_id` | `text` | FK → websites.id | |
| `rank` | `integer` | | |
| `domain` | `text` | | dominio competidor |
| `avg_position` | `real` | | |
| `trend` | `text` | | `"up"` / `"down"` / `"flat"` |
| `highlight_change` | `integer` | | boolean 0/1 |

### `ranking_history`

| Columna | Tipo | PK/FK | Notas |
|---------|------|-------|-------|
| `id` | `integer` | PK autoincrement | |
| `website_id` | `text` | FK → websites.id | |
| `date` | `text` | | ej. "8 Jun" |
| `avg_position` | `real` | | |

---

## 3. API Routes

| Método | Ruta | Respuesta |
|--------|------|-----------|
| `GET` | `/api/websites` | `{ data: WebsiteData[] }` |
| `GET` | `/api/websites/stats` | `{ data: WebsiteStats }` |
| `GET` | `/api/websites/[id]` | `{ data: WebsiteData }` |
| `POST` | `/api/websites` | `{ data: WebsiteData }` (201) |
| `PATCH` | `/api/websites/[id]` | `{ data: WebsiteData }` |
| `DELETE` | `/api/websites/[id]` | `{ data: { deleted: true } }` |
| `GET` | `/api/dashboard?websiteId=xxx` | `{ data: SEODashboardData }` |

Errores: `{ error: "mensaje" }` con status 4xx/5xx.

---

## 4. Archivos nuevos y modificados

```
src/
├── db/
│   ├── schema.ts           ← Drizzle table definitions
│   ├── index.ts             ← DB connection (better-sqlite3 + drizzle)
│   └── seed.ts              ← Migrar mock-data.ts → SQLite (one-shot)
├── app/api/
│   ├── websites/
│   │   ├── route.ts         ← GET lista + POST crear
│   │   ├── stats/route.ts   ← GET stats
│   │   └── [id]/route.ts    ← GET, PATCH, DELETE
│   └── dashboard/
│       └── route.ts         ← GET ?websiteId=xxx
├── hooks/
│   └── use-api.ts           ← Custom hook: fetch + loading + data
├── app/
│   ├── websites/page.tsx    ← MOD: mock → fetch API
│   └── dashboard/page.tsx   ← MOD: mock → fetch API
```

---

## 5. Flujo de datos

```
Page (Client Component)
  → useApi<T>('/api/websites')
    → fetch()
      → route.ts handler
        → db.select().from(websites).all()
          → better-sqlite3 → archivo .sqlite
        ← WebsiteData[]
      ← Response.json({ data })
    ← setData()
  ← render WebsiteGrid + QuickStats
```

---

## 6. Script de seed

`seed.ts` toma los mismos datos de `mock-data.ts` y los inserta en SQLite. Se ejecuta manualmente (`npx tsx src/db/seed.ts`). En el futuro será reemplazado por migraciones Drizzle.

---

## 7. Lo que NO incluye esta fase

- Multi-tenancy (tenant_id en tablas)
- Migraciones Drizzle (usamos seed manual)
- Integración con Bright Data, DataForSEO, Anthropic API, etc.
- Actualización de Articles y Reports (siguen con mock)
- Tests
