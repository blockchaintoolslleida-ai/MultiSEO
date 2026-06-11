# Competitors Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full competitors intelligence page with ranking, keyword overlap analysis, side-by-side comparator, actionable recommendations, and manual competitor management.

**Architecture:** 5 API routes serve data from the existing `competitors` table (extended with 4 new columns). 6 React components compose into a scroll-vertical page at `/competitors`. Keyword overlap is simulated by cross-referencing keywords between websites already in the database. Recommendations are generated server-side from gap/threat/opportunity detection logic.

**Tech Stack:** Next.js 16 App Router, React 19, SQLite + Drizzle ORM, Tailwind 4, lucide-react icons

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/db/schema.ts` | Modify | Add 4 columns to competitors table |
| `src/db/migrate.ts` | Modify | ALTER TABLE for new columns |
| `src/types/seo.ts` | Modify | Add CompetitorFull, CompetitorKPIs, OverlapMatrixRow, CompetitorRecommendation types |
| `src/app/api/competitors/route.ts` | Create | GET analysis + POST manual |
| `src/app/api/competitors/[id]/route.ts` | Create | PATCH + DELETE competitor |
| `src/app/api/competitors/overlap/route.ts` | Create | GET detailed keyword overlap |
| `src/db/seed.ts` | Modify | Add keywordsOverlap, trafficEstimate, isManual, lastUpdated to seed competitors |
| `src/components/competitors/competitor-kpi-grid.tsx` | Create | 4 KPI cards |
| `src/components/competitors/competitor-ranking.tsx` | Create | Ranked competitor list |
| `src/components/competitors/keyword-overlap-matrix.tsx` | Create | Heatmap table |
| `src/components/competitors/competitor-comparator.tsx` | Create | Side-by-side comparison |
| `src/components/competitors/competitor-intelligence.tsx` | Create | Recommendation cards |
| `src/components/competitors/competitor-manager.tsx` | Create | Add/edit/delete competitors |
| `src/app/competitors/page.tsx` | Create | Main page |
| `src/lib/constants.ts` | Modify | Add Competidores nav item |
| `src/components/layout/nav-item.tsx` | Verify | Monitor icon already imported |

---

### Task 1: Add new columns to schema and migration

**Files:**
- Modify: `src/db/schema.ts:49-57`
- Modify: `src/db/migrate.ts:55-55`

- [ ] **Step 1: Add columns to Drizzle schema**

In `src/db/schema.ts`, replace the competitors table definition at lines 49-57:

```typescript
export const competitors = sqliteTable("competitors", {
  id: text("id").primaryKey(),
  websiteId: text("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  rank: integer("rank").notNull(),
  domain: text("domain").notNull(),
  avgPosition: real("avg_position").notNull(),
  trend: text("trend").notNull().default("flat"),
  highlightChange: integer("highlight_change").notNull().default(0),
  keywordsOverlap: text("keywords_overlap").notNull().default("[]"),
  trafficEstimate: integer("traffic_estimate").notNull().default(0),
  isManual: integer("is_manual").notNull().default(0),
  lastUpdated: text("last_updated").notNull().default(""),
});
```

- [ ] **Step 2: Add ALTER TABLE migration**

In `src/db/migrate.ts`, add after the competitors CREATE TABLE block (after line 55). Insert after the `competitors` CREATE TABLE and before the `ranking_history` CREATE TABLE:

```typescript
// Add new columns to competitors (if not exist)
const compCols = sqlite.pragma("table_info(competitors)").map((c: any) => c.name);
if (!compCols.includes("keywords_overlap")) {
  sqlite.exec("ALTER TABLE competitors ADD COLUMN keywords_overlap TEXT NOT NULL DEFAULT '[]'");
}
if (!compCols.includes("traffic_estimate")) {
  sqlite.exec("ALTER TABLE competitors ADD COLUMN traffic_estimate INTEGER NOT NULL DEFAULT 0");
}
if (!compCols.includes("is_manual")) {
  sqlite.exec("ALTER TABLE competitors ADD COLUMN is_manual INTEGER NOT NULL DEFAULT 0");
}
if (!compCols.includes("last_updated")) {
  sqlite.exec("ALTER TABLE competitors ADD COLUMN last_updated TEXT NOT NULL DEFAULT ''");
}
```

- [ ] **Step 3: Run migration to verify columns are added**

Run: `npx.cmd tsx src/db/migrate.ts`
Expected: "Tables created successfully"

- [ ] **Step 4: Verify columns exist in SQLite**

Run: `npx.cmd tsx -e "import Database from 'better-sqlite3'; import * as path from 'path'; const db = new Database(path.resolve(process.cwd(), 'multiseo.db')); console.log(db.pragma('table_info(competitors)').map((c: any) => c.name)); db.close();"`
Expected: Output includes `keywords_overlap`, `traffic_estimate`, `is_manual`, `last_updated`

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/migrate.ts
git commit -m "feat: add keywordsOverlap, trafficEstimate, isManual, lastUpdated columns to competitors"
```

---

### Task 2: Add TypeScript types

**Files:**
- Modify: `src/types/seo.ts:20-26`

- [ ] **Step 1: Add new type interfaces**

In `src/types/seo.ts`, after the existing `CompetitorData` interface (after line 26), add:

```typescript
export interface CompetitorFull extends CompetitorData {
  id: string;
  keywordsOverlap: string[];
  trafficEstimate: number;
  isManual: boolean;
  lastUpdated: string;
}

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

export interface CompetitorsFullData {
  kpis: CompetitorKPIs;
  competitors: CompetitorFull[];
  overlapMatrix: OverlapMatrixRow[];
  recommendations: CompetitorRecommendation[];
}
```

- [ ] **Step 2: Check TypeScript compilation**

Run: `npx.cmd tsc --noEmit`
Expected: No new errors (may have pre-existing errors unrelated to our changes)

- [ ] **Step 3: Commit**

```bash
git add src/types/seo.ts
git commit -m "feat: add CompetitorFull, CompetitorKPIs, OverlapMatrixRow, CompetitorRecommendation types"
```

---

### Task 3: Create GET /api/competitors (main analysis endpoint)

**Files:**
- Create: `src/app/api/competitors/route.ts`

- [ ] **Step 1: Create the GET + POST route handler**

Create `src/app/api/competitors/route.ts`:

```typescript
import { db } from "@/db";
import { competitors, keywords, websites, rankingHistory } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { CompetitorFull, CompetitorKPIs, OverlapMatrixRow, CompetitorRecommendation } from "@/types/seo";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");

    if (!websiteId) {
      return Response.json({ error: "websiteId is required" }, { status: 400 });
    }

    const website = db.select().from(websites).where(eq(websites.id, websiteId)).get();
    if (!website) {
      return Response.json({ error: "Website not found" }, { status: 404 });
    }

    // Get all competitors for this website
    const compRows = db
      .select()
      .from(competitors)
      .where(eq(competitors.websiteId, websiteId))
      .orderBy(competitors.rank)
      .all();

    // Get target website keywords
    const myKeywords = db.select().from(keywords).where(eq(keywords.websiteId, websiteId)).all();

    // Build overlap matrix by cross-referencing keywords with competitor websites
    const allWebsites = db.select().from(websites).all();
    const allKeywords = db.select().from(keywords).all();

    const overlapMatrix: OverlapMatrixRow[] = [];
    const overlappingKeywordIds = new Set<string>();

    for (const kw of myKeywords) {
      const compPositions: { domain: string; position: number }[] = [];

      for (const comp of compRows) {
        // Try to find the competitor as a website in our DB
        const compWebsite = allWebsites.find(
          (w) => w.domain === comp.domain && w.id !== websiteId
        );

        if (compWebsite) {
          // Find matching keyword in competitor's keywords
          const compKw = allKeywords.find(
            (ck) => ck.websiteId === compWebsite.id && ck.keyword === kw.keyword
          );
          if (compKw) {
            compPositions.push({ domain: comp.domain, position: compKw.position });
            overlappingKeywordIds.add(kw.id);
          }
        } else {
          // External competitor — use stored keywordsOverlap JSON
          try {
            const overlapArr: string[] = JSON.parse(comp.keywordsOverlap);
            if (overlapArr.includes(kw.id)) {
              compPositions.push({ domain: comp.domain, position: comp.avgPosition });
              overlappingKeywordIds.add(kw.id);
            }
          } catch {
            // Skip if JSON parse fails
          }
        }
      }

      if (compPositions.length > 0) {
        overlapMatrix.push({
          keywordId: kw.id,
          keyword: kw.keyword,
          yourPosition: kw.position,
          competitors: compPositions,
        });
      }
    }

    // KPIs
    const yourAvgPosition = website.avgPosition;
    const top3Comps = compRows.filter((c) => c.domain !== website.domain).slice(0, 3);
    const top3AvgPosition =
      top3Comps.length > 0
        ? Math.round((top3Comps.reduce((s, c) => s + c.avgPosition, 0) / top3Comps.length) * 10) / 10
        : 0;

    const activeThreats = compRows.filter(
      (c) => c.trend === "up" && c.highlightChange === 1
    ).length;

    const kpis: CompetitorKPIs = {
      totalCompetitors: compRows.length,
      yourAvgPosition: Math.round(yourAvgPosition * 10) / 10,
      top3AvgPosition,
      overlappingKeywords: overlappingKeywordIds.size,
      activeThreats,
    };

    // Competitors with full data
    const compsFull: CompetitorFull[] = compRows.map((c) => ({
      id: c.id,
      rank: c.rank,
      domain: c.domain,
      avgPosition: c.avgPosition,
      trend: c.trend as "up" | "down" | "flat",
      highlightChange: c.highlightChange === 1,
      keywordsOverlap: (() => {
        try {
          return JSON.parse(c.keywordsOverlap);
        } catch {
          return [];
        }
      })(),
      trafficEstimate: c.trafficEstimate,
      isManual: c.isManual === 1,
      lastUpdated: c.lastUpdated,
    }));

    // Generate recommendations
    const recommendations: CompetitorRecommendation[] = [];

    for (const row of overlapMatrix) {
      for (const comp of row.competitors) {
        const gap = row.yourPosition - comp.position;
        if (gap >= 3) {
          recommendations.push({
            type: "gap",
            priority: gap >= 5 ? "high" : "medium",
            title: `${comp.domain} te supera en "${row.keyword}"`,
            description: `El competidor ${comp.domain} está en posición ${comp.position} mientras tú estás en ${row.yourPosition}. Una diferencia de ${gap} posiciones.`,
            actionLabel: "Crear contenido optimizado",
            relatedCompetitor: comp.domain,
            relatedKeyword: row.keyword,
          });
        }
      }
    }

    // Threat detection
    for (const c of compsFull) {
      if (c.trend === "up" && c.highlightChange) {
        recommendations.push({
          type: "threat",
          priority: "high",
          title: `${c.domain} está subiendo rápido`,
          description: `${c.domain} ha mejorado sus posiciones significativamente esta semana. Posición actual: ${c.avgPosition}.`,
          actionLabel: "Investigar estrategia",
          relatedCompetitor: c.domain,
        });
      }
    }

    // Opportunity detection: keywords where no top competitor ranks well
    const topCompDomains = new Set(compsFull.filter((c) => c.rank <= 5).map((c) => c.domain));
    for (const kw of myKeywords) {
      if (kw.position > 3 && kw.position <= 10) {
        const hasStrongCompetitor = overlapMatrix
          .find((r) => r.keywordId === kw.id)
          ?.competitors.some((c) => c.position <= 3 && topCompDomains.has(c.domain));

        if (!hasStrongCompetitor) {
          recommendations.push({
            type: "opportunity",
            priority: kw.position <= 5 ? "high" : "medium",
            title: `Oportunidad en "${kw.keyword}"`,
            description: `Estás en posición ${kw.position} y ningún competidor del top 5 rankea en top 3. Puedes capturar esta keyword con contenido enfocado.`,
            actionLabel: "Crear contenido",
            relatedKeyword: kw.keyword,
          });
        }
      }
    }

    // New competitor detection (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    for (const c of compsFull) {
      if (c.lastUpdated >= weekAgo && c.isManual) {
        recommendations.push({
          type: "new_competitor",
          priority: "medium",
          title: `Nuevo competidor: ${c.domain}`,
          description: `${c.domain} ha sido añadido recientemente. Monitoriza sus movimientos de cerca.`,
          actionLabel: "Ver competidor",
          relatedCompetitor: c.domain,
        });
      }
    }

    // Limit recommendations to top 10, sorted by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    const topRecommendations = recommendations.slice(0, 10);

    return Response.json({
      data: {
        kpis,
        competitors: compsFull,
        overlapMatrix,
        recommendations: topRecommendations,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch competitors";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { websiteId, domain, avgPosition } = body;

    if (!websiteId || !domain) {
      return Response.json(
        { error: "websiteId and domain are required" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = db
      .select()
      .from(competitors)
      .where(eq(competitors.websiteId, websiteId))
      .all()
      .find((c) => c.domain === domain);

    if (existing) {
      return Response.json(
        { error: "Este competidor ya existe para este website" },
        { status: 409 }
      );
    }

    const currentCount = db
      .select()
      .from(competitors)
      .where(eq(competitors.websiteId, websiteId))
      .all().length;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.insert(competitors)
      .values({
        id,
        websiteId,
        domain,
        rank: currentCount + 1,
        avgPosition: avgPosition ?? 0,
        trend: "flat",
        highlightChange: 0,
        keywordsOverlap: "[]",
        trafficEstimate: 0,
        isManual: 1,
        lastUpdated: now,
      })
      .run();

    const created = db.select().from(competitors).where(eq(competitors.id, id)).get();

    return Response.json(
      {
        data: {
          ...created,
          keywordsOverlap: JSON.parse(created!.keywordsOverlap),
          highlightChange: created!.highlightChange === 1,
          isManual: created!.isManual === 1,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create competitor";
    return Response.json({ error: msg }, { status: 500 });
  }
}
```

- [ ] **Step 2: Test GET endpoint**

Start the dev server (`npx.cmd next dev -p 4000`) and test:
Run: `curl http://localhost:4000/api/competitors?websiteId=1`
Expected: JSON response with `data.kpis`, `data.competitors`, `data.overlapMatrix`, `data.recommendations`

- [ ] **Step 3: Test POST endpoint**

Run: `curl -X POST http://localhost:4000/api/competitors -H "Content-Type: application/json" -d "{\"websiteId\":\"1\",\"domain\":\"nuevo-competidor.com\",\"avgPosition\":5.5}"`
Expected: 201 with created competitor data

- [ ] **Step 4: Commit**

```bash
git add src/app/api/competitors/route.ts
git commit -m "feat: add GET /api/competitors with KPIs, overlap matrix, recommendations + POST manual competitor"
```

---

### Task 4: Create PATCH/DELETE /api/competitors/[id]

**Files:**
- Create: `src/app/api/competitors/[id]/route.ts`

- [ ] **Step 1: Create the PATCH + DELETE route handler**

Create `src/app/api/competitors/[id]/route.ts`:

```typescript
import { db } from "@/db";
import { competitors } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = db.select().from(competitors).where(eq(competitors.id, id)).get();
    if (!existing) {
      return Response.json({ error: "Competitor not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.domain !== undefined) updateData.domain = body.domain;
    if (body.avgPosition !== undefined) updateData.avgPosition = body.avgPosition;
    if (body.trend !== undefined) updateData.trend = body.trend;
    if (body.trafficEstimate !== undefined) updateData.trafficEstimate = body.trafficEstimate;
    if (body.keywordsOverlap !== undefined) {
      updateData.keywordsOverlap = JSON.stringify(body.keywordsOverlap);
    }

    updateData.lastUpdated = new Date().toISOString();

    if (Object.keys(updateData).length > 0) {
      db.update(competitors).set(updateData).where(eq(competitors.id, id)).run();
    }

    const updated = db.select().from(competitors).where(eq(competitors.id, id)).get();
    return Response.json({
      data: {
        ...updated,
        keywordsOverlap: JSON.parse(updated!.keywordsOverlap),
        highlightChange: updated!.highlightChange === 1,
        isManual: updated!.isManual === 1,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update competitor";
    return Response.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = db.select().from(competitors).where(eq(competitors.id, id)).get();
    if (!existing) {
      return Response.json({ error: "Competitor not found" }, { status: 404 });
    }

    // Only allow delete for manual competitors or those without overlap data
    if (existing.isManual === 0) {
      let hasOverlap = false;
      try {
        const overlap = JSON.parse(existing.keywordsOverlap);
        hasOverlap = overlap.length > 0;
      } catch { /* ignore */ }
      if (hasOverlap) {
        return Response.json(
          { error: "No se puede eliminar un competidor detectado automáticamente con datos de solapamiento. Elimina sus keywords primero." },
          { status: 400 }
        );
      }
    }

    db.delete(competitors).where(eq(competitors.id, id)).run();
    return Response.json({ data: { deleted: true } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete competitor";
    return Response.json({ error: msg }, { status: 500 });
  }
}
```

- [ ] **Step 2: Test PATCH endpoint**

Run: `curl -X PATCH http://localhost:4000/api/competitors/c1 -H "Content-Type: application/json" -d "{\"avgPosition\":7.2,\"trend\":\"up\"}"`
Expected: 200 with updated competitor data

- [ ] **Step 3: Test DELETE endpoint (manual competitor)**

First create a manual competitor, then:
Run: `curl -X DELETE http://localhost:4000/api/competitors/<manual-id>`
Expected: 200 with `{"data":{"deleted":true}}`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/competitors/[id]/route.ts
git commit -m "feat: add PATCH and DELETE /api/competitors/[id]"
```

---

### Task 5: Create GET /api/competitors/overlap

**Files:**
- Create: `src/app/api/competitors/overlap/route.ts`

- [ ] **Step 1: Create the overlap detail route handler**

Create `src/app/api/competitors/overlap/route.ts`:

```typescript
import { db } from "@/db";
import { competitors, keywords, websites } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");
    const competitorId = searchParams.get("competitorId");

    if (!websiteId || !competitorId) {
      return Response.json(
        { error: "websiteId and competitorId are required" },
        { status: 400 }
      );
    }

    const competitor = db
      .select()
      .from(competitors)
      .where(eq(competitors.id, competitorId))
      .get();

    if (!competitor || competitor.websiteId !== websiteId) {
      return Response.json(
        { error: "Competitor not found for this website" },
        { status: 404 }
      );
    }

    const myKeywords = db
      .select()
      .from(keywords)
      .where(eq(keywords.websiteId, websiteId))
      .all();

    // Try to find competitor as a website in DB
    const compWebsite = db
      .select()
      .from(websites)
      .all()
      .find((w) => w.domain === competitor.domain && w.id !== websiteId);

    const results: {
      keyword: string;
      yourPosition: number;
      competitorPosition: number | null;
      gap: number | null;
    }[] = [];

    for (const kw of myKeywords) {
      let competitorPosition: number | null = null;

      if (compWebsite) {
        const compKw = db
          .select()
          .from(keywords)
          .where(eq(keywords.websiteId, compWebsite.id))
          .all()
          .find((ck) => ck.keyword === kw.keyword);

        competitorPosition = compKw ? compKw.position : null;
      } else {
        // Check stored overlap data
        try {
          const overlapArr: string[] = JSON.parse(competitor.keywordsOverlap);
          if (overlapArr.includes(kw.id)) {
            competitorPosition = competitor.avgPosition;
          }
        } catch {
          competitorPosition = null;
        }
      }

      if (competitorPosition !== null) {
        results.push({
          keyword: kw.keyword,
          yourPosition: kw.position,
          competitorPosition,
          gap: competitorPosition - kw.position,
        });
      }
    }

    // Sort by absolute gap descending (biggest differences first)
    results.sort((a, b) => Math.abs(b.gap!) - Math.abs(a.gap!));

    return Response.json({ data: results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch overlap";
    return Response.json({ error: msg }, { status: 500 });
  }
}
```

- [ ] **Step 2: Test overlap endpoint**

Run: `curl "http://localhost:4000/api/competitors/overlap?websiteId=1&competitorId=c2"`
Expected: JSON array of keyword overlap details (may be empty if no overlap, which is valid)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/competitors/overlap/route.ts
git commit -m "feat: add GET /api/competitors/overlap for detailed keyword overlap"
```

---

### Task 6: Update seed data

**Files:**
- Modify: `src/db/seed.ts:150-196`

- [ ] **Step 1: Update seed competitor data with new fields**

In `src/db/seed.ts`, replace the competitor insertion loop (approximately lines 188-196) with the updated version. Find the section starting with `let compCounter = 0;` and replace the loop body:

The current code is approximately:
```typescript
let compCounter = 0;
for (const [wid, comps] of Object.entries(websiteCompetitors)) {
  for (let i = 0; i < comps.length; i++) {
    compCounter++;
    tx.insert(competitors).values({
      id: `c${compCounter}`, websiteId: wid, rank: i + 1, domain: comps[i].domain,
      avgPosition: comps[i].pos, trend: comps[i].trend, highlightChange: comps[i].highlight,
    }).run();
  }
}
```

Replace with:
```typescript
let compCounter = 0;
for (const [wid, comps] of Object.entries(websiteCompetitors)) {
  // Get keywords for this website to build overlap references
  const siteKeywords = websiteKeywords[wid] ?? [];
  for (let i = 0; i < comps.length; i++) {
    compCounter++;
    // Simulate keyword overlap: each competitor "shares" 1-2 keywords with the target site
    const overlapKwIds: string[] = [];
    if (siteKeywords.length > 0) {
      const overlapCount = Math.min(1 + (i % 2), siteKeywords.length);
      for (let j = 0; j < overlapCount; j++) {
        const kwIdx = (i + j) % siteKeywords.length;
        // Find this keyword's ID by matching against what was inserted
        const kwId = `kw-${wid}-${kwIdx + 1}`;
        overlapKwIds.push(kwId);
      }
    }
    // Traffic estimate based on position (lower position = more traffic)
    const trafficEst = Math.round((15 - comps[i].pos) * 250 + Math.random() * 500);

    tx.insert(competitors).values({
      id: `c${compCounter}`,
      websiteId: wid,
      rank: i + 1,
      domain: comps[i].domain,
      avgPosition: comps[i].pos,
      trend: comps[i].trend,
      highlightChange: comps[i].highlight,
      keywordsOverlap: JSON.stringify(overlapKwIds),
      trafficEstimate: trafficEst,
      isManual: 0,
      lastUpdated: new Date().toISOString(),
    }).run();
  }
}
```

- [ ] **Step 2: Reseed and verify**

Run: `npx.cmd tsx src/db/seed.ts`
Expected: "Seed completed" message

Verify the new columns are populated:
Run: `npx.cmd tsx -e "import Database from 'better-sqlite3'; import * as path from 'path'; const db = new Database(path.resolve(process.cwd(), 'multiseo.db')); const rows = db.prepare('SELECT domain, keywords_overlap, traffic_estimate, is_manual, last_updated FROM competitors LIMIT 3').all(); console.log(JSON.stringify(rows, null, 2)); db.close();"`
Expected: Each row has non-empty `keywords_overlap`, `traffic_estimate` > 0, `is_manual` = 0, `last_updated` is a date string

- [ ] **Step 3: Commit**

```bash
git add src/db/seed.ts
git commit -m "feat: populate new competitor columns in seed — keywordsOverlap, trafficEstimate, isManual, lastUpdated"
```

---

### Task 7: Create CompetitorKPIGrid component

**Files:**
- Create: `src/components/competitors/competitor-kpi-grid.tsx`

- [ ] **Step 1: Create the KPI grid component**

Create `src/components/competitors/competitor-kpi-grid.tsx`:

```typescript
"use client";

import type { CompetitorKPIs } from "@/types/seo";

interface CompetitorKPIGridProps {
  kpis: CompetitorKPIs;
}

function TrendBadge({ value, label }: { value: string; label: string }) {
  return (
    <span className="text-[11px] text-gray-400 flex items-center gap-1">
      <span>{value}</span>
      <span>{label}</span>
    </span>
  );
}

export function CompetitorKPIGrid({ kpis }: CompetitorKPIGridProps) {
  const cards = [
    {
      label: "Competidores",
      value: kpis.totalCompetitors,
      sub: "trackeados",
      color: "brand",
    },
    {
      label: "Tu Posición Media",
      value: kpis.yourAvgPosition,
      sub: `Top 3: ${kpis.top3AvgPosition}`,
      color: kpis.yourAvgPosition <= kpis.top3AvgPosition ? "green" : "amber",
    },
    {
      label: "Keywords Solapadas",
      value: kpis.overlappingKeywords,
      sub: "compartidas",
      color: "violet",
    },
    {
      label: "Amenazas Activas",
      value: kpis.activeThreats,
      sub: kpis.activeThreats > 0 ? "requieren atención" : "todo bajo control",
      color: kpis.activeThreats > 0 ? "red" : "green",
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; badge: string }> = {
    brand: { bg: "bg-brand-50", text: "text-brand-700", badge: "bg-brand-100 text-brand-700" },
    green: { bg: "bg-green-50", text: "text-green-700", badge: "bg-green-100 text-green-700" },
    amber: { bg: "bg-amber-50", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
    violet: { bg: "bg-violet-50", text: "text-violet-700", badge: "bg-violet-100 text-violet-700" },
    red: { bg: "bg-red-50", text: "text-red-700", badge: "bg-red-100 text-red-700" },
  };

  return (
    <div className="grid grid-cols-4 gap-4 mb-5">
      {cards.map((card) => {
        const c = colorClasses[card.color] ?? colorClasses.brand;
        return (
          <div key={card.label} className={`${c.bg} rounded-xl p-4`}>
            <div className={`text-xs font-medium mb-1 ${c.text}`}>{card.label}</div>
            <div className={`text-2xl font-bold ${c.text}`}>{card.value}</div>
            <div className={`text-xs mt-1 ${c.text} opacity-70`}>{card.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx.cmd tsc --noEmit`
Expected: No new TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/components/competitors/competitor-kpi-grid.tsx
git commit -m "feat: add CompetitorKPIGrid component — 4 KPI cards"
```

---

### Task 8: Create CompetitorRanking component

**Files:**
- Create: `src/components/competitors/competitor-ranking.tsx`

- [ ] **Step 1: Create the ranking component**

Create `src/components/competitors/competitor-ranking.tsx`:

```typescript
"use client";

import { useState } from "react";
import type { CompetitorFull } from "@/types/seo";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

interface CompetitorRankingProps {
  competitors: CompetitorFull[];
  onSelect?: (id: string) => void;
}

const BAR_COLORS = [
  "bg-gradient-to-r from-brand-500 to-brand-400",
  "bg-gradient-to-r from-red-500 to-red-400",
  "bg-gradient-to-r from-amber-500 to-amber-400",
  "bg-gradient-to-r from-violet-500 to-violet-400",
  "bg-gradient-to-r from-pink-500 to-pink-400",
  "bg-gradient-to-r from-cyan-500 to-cyan-400",
  "bg-gradient-to-r from-indigo-500 to-indigo-400",
  "bg-gradient-to-r from-teal-500 to-teal-400",
];

export function CompetitorRanking({ competitors, onSelect }: CompetitorRankingProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
    if (trend === "down") return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
    return <Minus className="w-3.5 h-3.5 text-gray-400" />;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
      <h3 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
        🏆 Ranking de Competidores
        <span className="text-xs text-gray-400 font-normal ml-auto">Posición media</span>
      </h3>

      <div className="flex flex-col gap-0.5">
        {competitors.map((c, i) => {
          const isExpanded = expandedId === c.id;
          const isYou = c.rank === 1;

          return (
            <div key={c.id}>
              <button
                onClick={() => {
                  setExpandedId(isExpanded ? null : c.id);
                  onSelect?.(c.id);
                }}
                className={`w-full flex items-center gap-2.5 py-2.5 px-2 rounded-lg text-left transition-colors ${
                  isYou ? "bg-brand-50" : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`font-bold text-lg w-9 text-center ${
                    isYou ? "text-brand-600" : "text-gray-700"
                  }`}
                >
                  {c.rank}
                </span>
                <span className={`flex-1 text-[13px] ${isYou ? "font-semibold" : ""}`}>
                  {c.domain}
                  {isYou && (
                    <span className="ml-1.5 text-[10px] bg-brand-200 text-brand-700 rounded-full px-1.5 py-0">
                      tú
                    </span>
                  )}
                  {c.isManual && (
                    <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0">
                      manual
                    </span>
                  )}
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${BAR_COLORS[i] || "bg-gray-400"}`}
                    style={{ width: `${Math.min(Math.max((c.avgPosition / 15) * 100, 8), 100)}%` }}
                  />
                </div>
                <strong
                  className={`text-[15px] w-9 text-right ${
                    isYou ? "text-brand-600" : ""
                  }`}
                >
                  {c.avgPosition}
                </strong>
                <TrendIcon trend={c.trend} />
                {c.highlightChange && (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                )}
                <span className="w-4 text-gray-400">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
              </button>

              {isExpanded && (
                <div className="ml-12 mr-4 mb-2 p-3 bg-gray-50 rounded-lg text-[12px] text-gray-600 flex gap-6">
                  <div>
                    <span className="font-medium text-gray-700">Keywords compartidas:</span>{" "}
                    {c.keywordsOverlap.length}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Tráfico estimado:</span>{" "}
                    {c.trafficEstimate.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Actualizado:</span>{" "}
                    {c.lastUpdated
                      ? new Date(c.lastUpdated).toLocaleDateString("es-ES")
                      : "—"}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx.cmd tsc --noEmit`
Expected: No new TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/components/competitors/competitor-ranking.tsx
git commit -m "feat: add CompetitorRanking component — ranked list with expand, trends, threat badges"
```

---

### Task 9: Create KeywordOverlapMatrix component

**Files:**
- Create: `src/components/competitors/keyword-overlap-matrix.tsx`

- [ ] **Step 1: Create the overlap matrix component**

Create `src/components/competitors/keyword-overlap-matrix.tsx`:

```typescript
"use client";

import type { OverlapMatrixRow } from "@/types/seo";

interface KeywordOverlapMatrixProps {
  matrix: OverlapMatrixRow[];
  competitorDomains: string[];
}

export function KeywordOverlapMatrix({
  matrix,
  competitorDomains,
}: KeywordOverlapMatrixProps) {
  if (matrix.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-4">
          🔗 Keywords Compartidas
        </h3>
        <p className="text-[13px] text-gray-400 text-center py-8">
          No se encontraron keywords compartidas con competidores.
        </p>
      </div>
    );
  }

  const domains = competitorDomains.slice(0, 5);

  function positionColor(position: number): string {
    if (position <= 3) return "bg-green-100 text-green-700";
    if (position <= 10) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-[15px] font-semibold text-gray-900 mb-4">
        🔗 Keywords Compartidas
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 font-medium text-gray-500">Keyword</th>
              <th className="text-center py-2 font-medium text-gray-500">Tú</th>
              {domains.map((d) => (
                <th key={d} className="text-center py-2 font-medium text-gray-500">
                  {d.length > 15 ? d.slice(0, 15) + "…" : d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.slice(0, 15).map((row) => (
              <tr key={row.keywordId} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-2 font-medium text-gray-700">{row.keyword}</td>
                <td className="text-center py-2">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded font-medium ${positionColor(row.yourPosition)}`}
                  >
                    {row.yourPosition}
                  </span>
                </td>
                {domains.map((d) => {
                  const comp = row.competitors.find((c) => c.domain === d);
                  return (
                    <td key={d} className="text-center py-2">
                      {comp ? (
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded font-medium ${positionColor(comp.position)}`}
                        >
                          {comp.position}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-100" /> Top 3
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-100" /> 4-10
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-100" /> 11+
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx.cmd tsc --noEmit`
Expected: No new TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/components/competitors/keyword-overlap-matrix.tsx
git commit -m "feat: add KeywordOverlapMatrix component — heatmap table with position color coding"
```

---

### Task 10: Create CompetitorComparator component

**Files:**
- Create: `src/components/competitors/competitor-comparator.tsx`

- [ ] **Step 1: Create the comparator component**

Create `src/components/competitors/competitor-comparator.tsx`:

```typescript
"use client";

import { useState } from "react";
import type { CompetitorFull, OverlapMatrixRow } from "@/types/seo";

interface CompetitorComparatorProps {
  competitors: CompetitorFull[];
  matrix: OverlapMatrixRow[];
  yourDomain: string;
  yourPosition: number;
}

export function CompetitorComparator({
  competitors,
  matrix,
  yourDomain,
  yourPosition,
}: CompetitorComparatorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < 3) {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selected = competitors.filter((c) => selectedIds.has(c.id));
  const columns = [
    { domain: yourDomain, avgPosition: yourPosition, isYou: true },
    ...selected.map((c) => ({
      domain: c.domain,
      avgPosition: c.avgPosition,
      isYou: false,
      id: c.id,
      trafficEstimate: c.trafficEstimate,
    })),
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
        ⚖️ Comparador
      </h3>
      <p className="text-[12px] text-gray-400 mb-3">
        Selecciona hasta 3 competidores para comparar
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {competitors
          .filter((c) => !c.domain.includes(yourDomain))
          .map((c) => (
            <button
              key={c.id}
              onClick={() => toggleSelect(c.id)}
              className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                selectedIds.has(c.id)
                  ? "bg-brand-100 border-brand-300 text-brand-700"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {c.domain}
            </button>
          ))}
      </div>

      {selected.length > 0 && (
        <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map((col) => (
            <div
              key={col.domain}
              className={`rounded-lg p-3 border ${
                col.isYou
                  ? "border-brand-300 bg-brand-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="text-[13px] font-semibold text-gray-800 mb-1 flex items-center gap-1">
                {col.domain.length > 18 ? col.domain.slice(0, 18) + "…" : col.domain}
                {col.isYou && (
                  <span className="text-[10px] bg-brand-200 text-brand-700 rounded-full px-1">
                    tú
                  </span>
                )}
              </div>
              <div className="text-[11px] text-gray-500 mb-2">
                Pos. media: <strong>{col.avgPosition}</strong>
              </div>
              {!col.isYou && col.trafficEstimate && (
                <div className="text-[11px] text-gray-500 mb-2">
                  Tráfico est.: <strong>{col.trafficEstimate.toLocaleString()}</strong>
                </div>
              )}
              <div className="text-[11px] text-gray-500">
                <span className="font-medium">Top keywords:</span>
                <ul className="mt-1 space-y-0.5">
                  {matrix
                    .filter((row) =>
                      row.competitors.some(
                        (c) => c.domain === col.domain
                      )
                    )
                    .slice(0, 5)
                    .map((row) => (
                      <li key={row.keywordId} className="text-gray-600 flex justify-between">
                        <span>{row.keyword}</span>
                        <span className="font-medium">
                          {row.competitors.find((c) => c.domain === col.domain)?.position ?? "—"}
                        </span>
                      </li>
                    ))}
                  {matrix.filter((row) =>
                    row.competitors.some((c) => c.domain === col.domain)
                  ).length === 0 && (
                    <li className="text-gray-400">Sin datos de solapamiento</li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx.cmd tsc --noEmit`
Expected: No new TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/components/competitors/competitor-comparator.tsx
git commit -m "feat: add CompetitorComparator component — side-by-side multi-select comparison"
```

---

### Task 11: Create CompetitorIntelligence component

**Files:**
- Create: `src/components/competitors/competitor-intelligence.tsx`

- [ ] **Step 1: Create the intelligence/recommendations component**

Create `src/components/competitors/competitor-intelligence.tsx`:

```typescript
"use client";

import type { CompetitorRecommendation } from "@/types/seo";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, PlusCircle } from "lucide-react";

interface CompetitorIntelligenceProps {
  recommendations: CompetitorRecommendation[];
}

const typeConfig: Record<
  string,
  { icon: typeof Sparkles; label: string; color: string }
> = {
  gap: { icon: TrendingUp, label: "Gap detectado", color: "text-red-600 bg-red-50" },
  threat: { icon: AlertTriangle, label: "Amenaza", color: "text-amber-600 bg-amber-50" },
  opportunity: { icon: Lightbulb, label: "Oportunidad", color: "text-green-600 bg-green-50" },
  new_competitor: { icon: PlusCircle, label: "Nuevo", color: "text-blue-600 bg-blue-50" },
};

const priorityBadge: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

export function CompetitorIntelligence({
  recommendations,
}: CompetitorIntelligenceProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
      <h3 className="text-[15px] font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <Sparkles className="w-[18px] h-[18px] text-brand-500" />
        Intelligence
        <span className="text-xs text-gray-400 font-normal">
          ({recommendations.length} recomendaciones)
        </span>
      </h3>
      <p className="text-[12px] text-gray-400 mb-4">
        Recomendaciones generadas automáticamente basadas en análisis competitivo
      </p>

      {recommendations.length === 0 ? (
        <p className="text-[13px] text-gray-400 text-center py-8">
          No hay recomendaciones por ahora. Sincroniza GSC o añade competidores para recibir insights.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {recommendations.map((rec, i) => {
            const config = typeConfig[rec.type] ?? typeConfig.gap;
            const Icon = config.icon;
            return (
              <div
                key={i}
                className="border border-gray-100 rounded-lg p-3 flex items-start gap-3 hover:bg-gray-50/50 transition-colors"
              >
                <div className={`p-1.5 rounded-lg ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-medium text-gray-800">
                      {rec.title}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${priorityBadge[rec.priority] ?? priorityBadge.medium}`}
                    >
                      {rec.priority === "high"
                        ? "alta"
                        : rec.priority === "medium"
                          ? "media"
                          : "baja"}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500 mb-2">{rec.description}</p>
                  <button className="text-[11px] font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-md transition-colors">
                    {rec.actionLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx.cmd tsc --noEmit`
Expected: No new TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/components/competitors/competitor-intelligence.tsx
git commit -m "feat: add CompetitorIntelligence component — gap, threat, opportunity, new_competitor cards"
```

---

### Task 12: Create CompetitorManager component

**Files:**
- Create: `src/components/competitors/competitor-manager.tsx`

- [ ] **Step 1: Create the manager component**

Create `src/components/competitors/competitor-manager.tsx`:

```typescript
"use client";

import { useState } from "react";
import type { CompetitorFull } from "@/types/seo";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";

interface CompetitorManagerProps {
  competitors: CompetitorFull[];
  websiteId: string;
  onRefresh: () => void;
}

export function CompetitorManager({
  competitors,
  websiteId,
  onRefresh,
}: CompetitorManagerProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [newDomain, setNewDomain] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editTrend, setEditTrend] = useState("flat");

  const handleAdd = async () => {
    setError(null);
    if (!newDomain.trim()) {
      setError("El dominio es obligatorio");
      return;
    }
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          domain: newDomain.trim(),
          avgPosition: parseFloat(newPosition) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setNewDomain("");
      setNewPosition("");
      setAdding(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al añadir");
    }
  };

  const handleUpdate = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/competitors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: editDomain.trim(),
          avgPosition: parseFloat(editPosition) || 0,
          trend: editTrend,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setEditingId(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    }
  };

  const handleDelete = async (id: string, domain: string) => {
    setError(null);
    if (!confirm(`¿Eliminar a "${domain}" como competidor?`)) return;
    try {
      const res = await fetch(`/api/competitors/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const startEdit = (c: CompetitorFull) => {
    setEditingId(c.id);
    setEditDomain(c.domain);
    setEditPosition(String(c.avgPosition));
    setEditTrend(c.trend);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 p-5 text-left"
      >
        <h3 className="text-[15px] font-semibold text-gray-900 flex-1">
          ⚙️ Gestionar Competidores
        </h3>
        <span className="text-xs text-gray-400">{competitors.length} competidores</span>
        <span className="text-gray-400 text-xs">{collapsed ? "▼" : "▲"}</span>
      </button>

      {!collapsed && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          {error && (
            <div className="text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
              {error}
            </div>
          )}

          <div className="overflow-x-auto mb-4">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 font-medium text-gray-500">Dominio</th>
                  <th className="text-center py-2 font-medium text-gray-500">Posición</th>
                  <th className="text-center py-2 font-medium text-gray-500">Origen</th>
                  <th className="text-center py-2 font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c) => {
                  const isEditing = editingId === c.id;
                  return (
                    <tr key={c.id} className="border-b border-gray-50">
                      <td className="py-2">
                        {isEditing ? (
                          <input
                            value={editDomain}
                            onChange={(e) => setEditDomain(e.target.value)}
                            className="border border-gray-200 rounded px-2 py-1 w-full text-[12px]"
                          />
                        ) : (
                          c.domain
                        )}
                      </td>
                      <td className="text-center py-2">
                        {isEditing ? (
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              step="0.1"
                              value={editPosition}
                              onChange={(e) => setEditPosition(e.target.value)}
                              className="border border-gray-200 rounded px-2 py-1 w-16 text-[12px]"
                            />
                            <select
                              value={editTrend}
                              onChange={(e) => setEditTrend(e.target.value)}
                              className="border border-gray-200 rounded px-1 py-1 text-[11px]"
                            >
                              <option value="up">↑</option>
                              <option value="flat">→</option>
                              <option value="down">↓</option>
                            </select>
                          </div>
                        ) : (
                          c.avgPosition
                        )}
                      </td>
                      <td className="text-center py-2">
                        <span
                          className={`text-[10px] px-1.5 py-0 rounded-full ${
                            c.isManual
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {c.isManual ? "manual" : "GSC"}
                        </span>
                      </td>
                      <td className="text-center py-2">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleUpdate(c.id)}
                              className="p-1 hover:bg-green-50 rounded text-green-600"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 hover:bg-gray-50 rounded text-gray-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => startEdit(c)}
                              className="p-1 hover:bg-gray-50 rounded text-gray-400 hover:text-gray-600"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id, c.domain)}
                              className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {adding ? (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <input
                placeholder="dominio.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1.5 text-[12px] flex-1"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Posición"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1.5 text-[12px] w-20"
              />
              <button
                onClick={handleAdd}
                className="px-3 py-1.5 bg-brand-600 text-white rounded text-[12px] font-medium hover:bg-brand-700"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setError(null);
                }}
                className="px-2 py-1.5 text-gray-400 hover:text-gray-600 text-[12px]"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 text-[12px] text-brand-600 hover:text-brand-700 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir Competidor Manual
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx.cmd tsc --noEmit`
Expected: No new TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/components/competitors/competitor-manager.tsx
git commit -m "feat: add CompetitorManager component — add/edit/delete with inline forms"
```

---

### Task 13: Create the /competitors page

**Files:**
- Create: `src/app/competitors/page.tsx`

- [ ] **Step 1: Create the main page**

Create `src/app/competitors/page.tsx`:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/hooks/use-api";
import { useTenant } from "@/hooks/use-tenant";
import type {
  CompetitorFull,
  CompetitorKPIs,
  OverlapMatrixRow,
  CompetitorRecommendation,
} from "@/types/seo";
import { CompetitorKPIGrid } from "@/components/competitors/competitor-kpi-grid";
import { CompetitorRanking } from "@/components/competitors/competitor-ranking";
import { KeywordOverlapMatrix } from "@/components/competitors/keyword-overlap-matrix";
import { CompetitorComparator } from "@/components/competitors/competitor-comparator";
import { CompetitorIntelligence } from "@/components/competitors/competitor-intelligence";
import { CompetitorManager } from "@/components/competitors/competitor-manager";

interface WebsiteOption {
  id: string;
  domain: string;
}

interface CompetitorsFullData {
  kpis: CompetitorKPIs;
  competitors: CompetitorFull[];
  overlapMatrix: OverlapMatrixRow[];
  recommendations: CompetitorRecommendation[];
}

export default function CompetitorsPage() {
  const { tenant } = useTenant();
  const [websiteId, setWebsiteId] = useState("1");
  const [websitesList, setWebsitesList] = useState<WebsiteOption[]>([]);

  const {
    data,
    loading,
    refetch,
  } = useApi<CompetitorsFullData>(
    tenant ? `/api/competitors?websiteId=${websiteId}` : ""
  );

  useEffect(() => {
    if (!tenant) return;
    fetch(`/api/websites?tenantId=${tenant.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setWebsitesList(
            json.data.map((w: any) => ({ id: w.id, domain: w.domain }))
          );
          if (json.data.length > 0) setWebsiteId(json.data[0].id);
        }
      })
      .catch(() => {});
  }, [tenant]);

  const kpis = data?.kpis;
  const competitors = data?.competitors ?? [];
  const matrix = data?.overlapMatrix ?? [];
  const recommendations = data?.recommendations ?? [];

  if (loading || !tenant) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando Competidores...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-5">
        <span className="text-brand-600 inline-flex items-center gap-1">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {tenant?.name ?? "Demo Company"}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-gray-700 font-medium">Competidores</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2.5">
            🏆 Competidores Intelligence
          </h1>
          {websitesList.length > 1 && (
            <select
              value={websiteId}
              onChange={(e) => setWebsiteId(e.target.value)}
              className="text-[13px] border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:border-brand-400"
            >
              {websitesList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.domain}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* KPIs */}
      {kpis && <CompetitorKPIGrid kpis={kpis} />}

      {/* Ranking - full width */}
      <CompetitorRanking
        competitors={competitors}
        onSelect={(id) => {
          // Scroll to comparator
          document.getElementById("comparator-section")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* Overlap Matrix + Comparator grid */}
      <div className="grid grid-cols-[1fr_1fr] gap-4 mb-5" id="comparator-section">
        <KeywordOverlapMatrix
          matrix={matrix}
          competitorDomains={competitors.filter((c) => c.rank !== 1).map((c) => c.domain)}
        />
        <CompetitorComparator
          competitors={competitors}
          matrix={matrix}
          yourDomain={competitors.find((c) => c.rank === 1)?.domain ?? "tuweb.com"}
          yourPosition={kpis?.yourAvgPosition ?? 0}
        />
      </div>

      {/* Intelligence */}
      <CompetitorIntelligence recommendations={recommendations} />

      {/* Manager (collapsible) */}
      <CompetitorManager
        competitors={competitors}
        websiteId={websiteId}
        onRefresh={refetch}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx.cmd tsc --noEmit`
Expected: No new TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/app/competitors/page.tsx
git commit -m "feat: add /competitors page — full intelligence dashboard with KPIs, ranking, overlap, comparator, recommendations, manager"
```

---

### Task 14: Update navigation

**Files:**
- Modify: `src/lib/constants.ts:16-22`

- [ ] **Step 1: Update NAV_SECTIONS to use Competidores label**

In `src/lib/constants.ts`, replace the "Analytics" section at lines 16-22:

Current:
```typescript
{
  title: "Analytics",
  items: [
    { label: "Reportes", href: "/reports", icon: "BarChart3" },
    { label: "Competidores", href: "/competitors", icon: "Monitor" },
  ],
},
```

Replace with:
```typescript
{
  title: "Analytics",
  items: [
    { label: "Competidores", href: "/competitors", icon: "Monitor" },
    { label: "Reportes", href: "/reports", icon: "BarChart3" },
  ],
},
```

- [ ] **Step 2: Verify Monitor icon is in nav-item.tsx**

Check that `Monitor` is in the import from lucide-react and the iconMap in `src/components/layout/nav-item.tsx`. It should already be imported (line 6 of the current file shows `Monitor` is imported).

- [ ] **Step 3: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat: move Competidores to first position in Analytics nav section"
```

---

### Task 15: E2E testing with real websites

**Files:** None (verification only)

- [ ] **Step 1: Start dev server**

Run: `npx.cmd next dev -p 4000` (in background)

- [ ] **Step 2: Verify competitors page loads**

Open `http://localhost:4000/competitors` in a browser or:
Run: `curl http://localhost:4000/api/competitors?websiteId=e74b0ab2-7c92-4c9e-9cd1-6e8e7d6b0d6a`
Expected: JSON response with KPIs, competitors for silviaclua.com. Check that `totalCompetitors` > 0 and `overlapMatrix` contains data.

- [ ] **Step 3: Test POST a manual competitor**

Run: `curl -X POST http://localhost:4000/api/competitors -H "Content-Type: application/json" -d "{\"websiteId\":\"e74b0ab2-7c92-4c9e-9cd1-6e8e7d6b0d6a\",\"domain\":\"test-competitor.com\",\"avgPosition\":4.5}"`
Expected: 201 with created competitor

- [ ] **Step 4: Test PATCH the created competitor**

Run: `curl -X PATCH http://localhost:4000/api/competitors/<id-from-step3> -H "Content-Type: application/json" -d "{\"trend\":\"up\",\"avgPosition\":3.8}"`
Expected: 200 with updated data

- [ ] **Step 5: Test DELETE the created competitor**

Run: `curl -X DELETE http://localhost:4000/api/competitors/<id-from-step3>`
Expected: 200 with `{"data":{"deleted":true}}`

- [ ] **Step 6: Test overlap endpoint**

Run: `curl "http://localhost:4000/api/competitors/overlap?websiteId=e74b0ab2-7c92-4c9e-9cd1-6e8e7d6b0d6a&competitorId=c2"`
Expected: JSON array (may be empty if no overlap data exists, which is valid)

- [ ] **Step 7: Navigate to /competitors in browser**

Verify the page renders with:
- 4 KPI cards at top
- Competitor ranking list with expandable rows
- Keyword overlap matrix and comparator side by side
- Intelligence section with recommendations
- Collapsible manager at bottom
- Website selector works
- Breadcrumb shows correctly

- [ ] **Step 8: Commit final verification**

```bash
git add -A
git commit -m "test: E2E verification of competitors intelligence module — all 5 APIs, 6 components, page working"
```

---

## Summary

15 tasks, ~75 steps. Estimated time: 60-90 minutes implementing, 15-20 minutes reviewing.

**Task dependency chain:**
1. Schema + migration → 2. Types → 3-5. APIs (parallel possible) → 6. Seed → 7-12. Components (parallel possible) → 13. Page → 14. Nav → 15. E2E

**Key patterns used:**
- `params` as Promise in PATCH/DELETE route handlers
- `useApi<T>` hook with refetch pattern
- `useTenant()` for tenant context
- `"use client"` for all components and pages
- PRAGMA table_info for safe migrations
- `crypto.randomUUID()` for ID generation
- JSON serialization for array/object columns in SQLite
