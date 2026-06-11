# Competitors Intelligence — Spec

> **Status:** Approved | **Stack:** Next.js 16, React 19, SQLite + Drizzle ORM, Tailwind 4

**Goal:** Full competitors intelligence page with ranking, keyword overlap analysis, side-by-side comparator, actionable recommendations, and manual competitor management. Data sourced from GSC sync + manual entry + keyword overlap simulation.

---

## 1. Schema Changes

### Add columns to `competitors` table

```sql
ALTER TABLE competitors ADD COLUMN keywords_overlap TEXT NOT NULL DEFAULT '[]';   -- JSON: ["keyword-id", ...]
ALTER TABLE competitors ADD COLUMN traffic_estimate INTEGER NOT NULL DEFAULT 0;
ALTER TABLE competitors ADD COLUMN is_manual INTEGER NOT NULL DEFAULT 0;
ALTER TABLE competitors ADD COLUMN last_updated TEXT NOT NULL DEFAULT '';
```

New Drizzle columns in `src/db/schema.ts`:
```
keywordsOverlap: text("keywords_overlap").notNull().default("[]"),
trafficEstimate: integer("traffic_estimate").notNull().default(0),
isManual: integer("is_manual").notNull().default(0),
lastUpdated: text("last_updated").notNull().default(""),
```

### Migration
Update `src/db/migrate.ts` with ALTER TABLE statements for the 4 new columns. Use the same `PRAGMA table_info` pattern as existing migrations.

---

## 2. API Routes

### 2.1 `GET /api/competitors?websiteId=`

Main endpoint. Returns complete analysis payload:

```json
{
  "data": {
    "kpis": {
      "totalCompetitors": 5,
      "yourAvgPosition": 8.4,
      "top3AvgPosition": 5.2,
      "overlappingKeywords": 12,
      "activeThreats": 2
    },
    "competitors": [
      {
        "id": "c1", "rank": 1, "domain": "tuweb.com", "avgPosition": 8.4,
        "trend": "up", "highlightChange": true, "keywordsOverlap": ["k1","k2"],
        "trafficEstimate": 3400, "isManual": false, "lastUpdated": "2026-06-10"
      }
    ],
    "overlapMatrix": [
      {
        "keywordId": "k1", "keyword": "seo barcelona",
        "yourPosition": 3, "competitors": [
          { "domain": "competidor1.com", "position": 1 },
          { "domain": "competidor2.com", "position": 5 }
        ]
      }
    ],
    "recommendations": [
      {
        "type": "gap" | "threat" | "opportunity" | "new_competitor",
        "priority": "high" | "medium" | "low",
        "title": "...",
        "description": "...",
        "actionLabel": "...",
        "relatedCompetitor": "domain.com",
        "relatedKeyword": "keyword"
      }
    ]
  }
}
```

**Overlap logic:** The API loads all keywords for the target website. For each competitor, it queries if that competitor exists as a website in the DB. If yes, loads its keywords and cross-references. If not (external competitor), checks the competitor's `keywordsOverlap` JSON field (populated during GSC sync or manual analysis).

**Recommendations logic:**
- `gap` — competitor outranks you on a keyword by ≥3 positions → content recommendation
- `threat` — competitor trend is "up" + highlightChange → alert
- `opportunity` — keyword where no top-5 competitor ranks ≤3 → create content
- `new_competitor` — competitor added in last 7 days → monitor

### 2.2 `POST /api/competitors`

Create manual competitor:
```
Body: { websiteId, domain, avgPosition }
```
Sets `isManual=1`, auto-calculates rank based on current count. Returns 201.

### 2.3 `PATCH /api/competitors/[id]`

Update competitor fields. Accepts: `domain`, `avgPosition`, `trend`, `keywordsOverlap`, `trafficEstimate`. Updates `lastUpdated`. Returns 200.

### 2.4 `DELETE /api/competitors/[id]`

Deletes competitor. Only allows deletion if `isManual=1` or if the competitor has no keyword overlap data (stale auto-detected). Returns 400 on protected competitors. Returns 200 on success.

### 2.5 `GET /api/competitors/overlap?websiteId=&competitorId=`

Returns detailed keyword overlap between your site and a specific competitor. Returns array of `{ keyword, yourPosition, competitorPosition, gap }` sorted by gap descending.

---

## 3. Components

### 3.1 `CompetitorKPIGrid` (`src/components/competitors/competitor-kpi-grid.tsx`)
- 4 KPI cards in a responsive grid (2×2 desktop, 1-col mobile)
- Cards: Total Competidores, Tu Posición vs Top 3, Keywords Solapadas, Amenazas Activas
- Uses `TrendBadge` pattern from GEO KPIs (green up arrow, red down arrow)
- Props: `kpis: CompetitorKPIs`

### 3.2 `CompetitorRanking` (`src/components/competitors/competitor-ranking.tsx`)
- Full-width card with ranked list
- Each row: rank #, domain, position bar (colored gradient), avg position number, trend indicator, threat badge
- Highlight your own site (rank 1 in seed, adjusted dynamically)
- Click on row expands inline detail: keywords shared count, traffic estimate, last updated
- Props: `competitors: Competitor[]`, `onSelect: (id: string) => void`

### 3.3 `KeywordOverlapMatrix` (`src/components/competitors/keyword-overlap-matrix.tsx`)
- Card with title "Keywords Compartidas"
- Table: columns = top competitors (max 5), rows = keywords where overlap exists
- Cells show position number or "—" if no overlap
- Color intensity: green (position 1-3), yellow (4-10), red (11+), gray (no data)
- Legend below table
- Props: `matrix: OverlapMatrixRow[]`

### 3.4 `CompetitorComparator` (`src/components/competitors/competitor-comparator.tsx`)
- Card with multi-select checkboxes (max 3 competitors + your site always included)
- Side-by-side columns: domain header, avg position, traffic, top 5 shared keywords with positions
- Your site column highlighted with brand color border
- Props: `competitors: Competitor[]`, `yourDomain: string`, `yourPosition: number`

### 3.5 `CompetitorIntelligence` (`src/components/competitors/competitor-intelligence.tsx`)
- Card with title "Intelligence" and AI sparkle icon
- List of recommendation cards, each with:
  - Type icon: 📉 gap, ⚠️ threat, 💡 opportunity, 🆕 new_competitor
  - Priority badge (rojo/ambar/verde)
  - Title + description
  - Action button (e.g., "Crear contenido", "Investigar")
- Props: `recommendations: CompetitorRecommendation[]`

### 3.6 `CompetitorManager` (`src/components/competitors/competitor-manager.tsx`)
- Collapsible section at bottom of page
- Table of all competitors with: domain, position, source (GSC/manual badge), actions (edit inline, delete)
- "Añadir Competidor" button → inline form row with domain + avg position inputs + save/cancel
- Edit mode: click edit icon → row becomes editable (domain, avg position, trend selector) + save/cancel
- Delete: confirmation for manual competitors, disabled for GSC-imported with overlap data
- Props: `competitors: Competitor[]`, `websiteId: string`, `onRefresh: () => void`

---

## 4. Page (`src/app/competitors/page.tsx`)

Same pattern as Dashboard and GEO pages:
- `"use client"` with `useTenant`, `useApi`, `useState`/`useEffect`
- Website selector dropdown (fetches from `/api/websites?tenantId=`)
- Breadcrumb: Home > Tenant > Competidores
- Loading spinner while fetching
- Layout (scroll vertical):

```
┌──────────────────────────────────────────────┐
│ 🏠 Tenant > Competidores    [Website ▼]      │
│ Competidores Intelligence                     │
├──────────────────────────────────────────────┤
│ CompetitorKPIGrid (4 cards)                   │
├──────────────────────────────────────────────┤
│ CompetitorRanking (full width)                │
├──────────────────────┬───────────────────────┤
│ KeywordOverlapMatrix │ CompetitorComparator  │
├──────────────────────┴───────────────────────┤
│ CompetitorIntelligence                        │
├──────────────────────────────────────────────┤
│ CompetitorManager (collapsible)               │
└──────────────────────────────────────────────┘
```

---

## 5. Navigation Update

Add "Competidores" to `NAV_SECTIONS` in `src/lib/constants.ts` under "Analytics" section, replacing or alongside the existing entry. Use `Monitor` icon (already imported in nav-item).

---

## 6. Seed Data Update

Update `src/db/seed.ts`:
- Add `keywordsOverlap` data to existing competitors — cross-reference keywords from `websiteKeywords` Record
- Add `trafficEstimate` values (estimated from volume × position)
- Set `isManual=0` for seed competitors
- Set `lastUpdated` to current date

---

## 7. Types (`src/types/seo.ts` additions)

```typescript
export interface CompetitorKPIs {
  totalCompetitors: number;
  yourAvgPosition: number;
  top3AvgPosition: number;
  overlappingKeywords: number;
  activeThreats: number;
}

export interface OverlapMatrixRow {
  keywordId: string;
  keyword: string;
  yourPosition: number;
  competitors: { domain: string; position: number }[];
}

export interface CompetitorRecommendation {
  type: "gap" | "threat" | "opportunity" | "new_competitor";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  actionLabel: string;
  relatedCompetitor?: string;
  relatedKeyword?: string;
}

// Extend CompetitorData
export interface CompetitorFull extends CompetitorData {
  id: string;
  keywordsOverlap: string[];
  trafficEstimate: number;
  isManual: boolean;
  lastUpdated: string;
}
```

---

## 8. Implementation Order

1. Schema + migration (add 4 columns to competitors table)
2. Types (add new interfaces to seo.ts)
3. API routes (5 endpoints)
4. Seed data update
5. Components (6 components)
6. Page (`/competitors`)
7. Navigation update
8. E2E testing with real websites
