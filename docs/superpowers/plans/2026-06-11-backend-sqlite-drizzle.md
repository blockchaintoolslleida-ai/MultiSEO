# Backend SQLite + Drizzle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Websites and Dashboard panels from mock data to real SQLite backend with Drizzle ORM and REST API routes.

**Architecture:** SQLite (better-sqlite3) accessed via Drizzle ORM with typed schemas. Next.js App Router route handlers expose REST endpoints under `/api/websites` and `/api/dashboard`. Frontend pages swap `getMockData()` calls for `fetch()` to API routes via a reusable `useApi<T>` hook.

**Tech Stack:** Next.js 16.2, React 19, TypeScript 5, Tailwind 4, better-sqlite3, drizzle-orm, drizzle-kit

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install better-sqlite3, drizzle-orm, and drizzle-kit**

```bash
npm install better-sqlite3 drizzle-orm
npm install -D drizzle-kit @types/better-sqlite3
```

Expected: packages added to package.json and node_modules.

- [ ] **Step 2: Verify installation**

```bash
node -e "const { drizzle } = require('drizzle-orm/better-sqlite3'); console.log('drizzle-orm OK')"
node -e "const Database = require('better-sqlite3'); console.log('better-sqlite3 OK')"
```

Expected: both print "OK" without errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add better-sqlite3, drizzle-orm, drizzle-kit"
```

---

### Task 2: Create database schema with Drizzle

**Files:**
- Create: `src/db/schema.ts`

- [ ] **Step 1: Write the schema file**

```typescript
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const websites = sqliteTable("websites", {
  id: text("id").primaryKey(),
  domain: text("domain").notNull().unique(),
  status: text("status").notNull().default("connected"),
  accessTypes: text("access_types").notNull().default("[]"),
  keywordsCount: integer("keywords_count").notNull().default(0),
  articlesCount: integer("articles_count").notNull().default(0),
  avgPosition: real("avg_position").notNull().default(0),
  estimatedTraffic: integer("estimated_traffic").notNull().default(0),
  backlinksCount: integer("backlinks_count").notNull().default(0),
  healthScore: integer("health_score").notNull().default(0),
  lastAudit: text("last_audit").notNull().default(""),
  errorMessage: text("error_message"),
  createdAt: text("created_at").notNull().default(""),
});

export const keywords = sqliteTable("keywords", {
  id: text("id").primaryKey(),
  websiteId: text("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  position: integer("position").notNull(),
  change: integer("change").notNull().default(0),
  volume: integer("volume").notNull().default(0),
  difficulty: text("difficulty").notNull().default("medium"),
  history: text("history").notNull().default("[]"),
  isTop3: integer("is_top3").notNull().default(0),
  isFalling: integer("is_falling").notNull().default(0),
});

export const competitors = sqliteTable("competitors", {
  id: text("id").primaryKey(),
  websiteId: text("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  rank: integer("rank").notNull(),
  domain: text("domain").notNull(),
  avgPosition: real("avg_position").notNull(),
  trend: text("trend").notNull().default("flat"),
  highlightChange: integer("highlight_change").notNull().default(0),
});

export const rankingHistory = sqliteTable("ranking_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  websiteId: text("website_id").notNull().references(() => websites.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  avgPosition: real("avg_position").notNull(),
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit src/db/schema.ts
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add Drizzle schema for websites, keywords, competitors, ranking_history"
```

---

### Task 3: Create database connection utility

**Files:**
- Create: `src/db/index.ts`

- [ ] **Step 1: Write the connection file**

```typescript
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("multiseo.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
```

- [ ] **Step 2: Verify it imports without errors**

```bash
npx tsc --noEmit src/db/index.ts
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/db/index.ts
git commit -m "feat: add Drizzle DB connection with better-sqlite3"
```

---

### Task 4: Create table initialization helper

**Files:**
- Create: `src/db/migrate.ts`

- [ ] **Step 1: Write the migration bootstrap**

```typescript
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database("multiseo.db");
const db = drizzle(sqlite, { schema });

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS websites (
    id TEXT PRIMARY KEY,
    domain TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'connected',
    access_types TEXT NOT NULL DEFAULT '[]',
    keywords_count INTEGER NOT NULL DEFAULT 0,
    articles_count INTEGER NOT NULL DEFAULT 0,
    avg_position REAL NOT NULL DEFAULT 0,
    estimated_traffic INTEGER NOT NULL DEFAULT 0,
    backlinks_count INTEGER NOT NULL DEFAULT 0,
    health_score INTEGER NOT NULL DEFAULT 0,
    last_audit TEXT NOT NULL DEFAULT '',
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS keywords (
    id TEXT PRIMARY KEY,
    website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    position INTEGER NOT NULL,
    change INTEGER NOT NULL DEFAULT 0,
    volume INTEGER NOT NULL DEFAULT 0,
    difficulty TEXT NOT NULL DEFAULT 'medium',
    history TEXT NOT NULL DEFAULT '[]',
    is_top3 INTEGER NOT NULL DEFAULT 0,
    is_falling INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS competitors (
    id TEXT PRIMARY KEY,
    website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    domain TEXT NOT NULL,
    avg_position REAL NOT NULL,
    trend TEXT NOT NULL DEFAULT 'flat',
    highlight_change INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS ranking_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    website_id TEXT NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    avg_position REAL NOT NULL
  );
`);

console.log("Tables created successfully");
```

- [ ] **Step 2: Run migration to verify tables are created**

```bash
npx tsx src/db/migrate.ts
```

Expected: "Tables created successfully" and `multiseo.db` file appears in project root.

- [ ] **Step 3: Verify tables exist**

```bash
npx tsx -e "const Database = require('better-sqlite3'); const db = new Database('multiseo.db'); console.log(db.prepare(\"SELECT name FROM sqlite_master WHERE type='table'\").all())"
```

Expected: lists websites, keywords, competitors, ranking_history.

- [ ] **Step 4: Commit**

```bash
git add src/db/migrate.ts
git commit -m "feat: add DB migration bootstrap for SQLite tables"
```

---

### Task 5: Create seed script with mock data

**Files:**
- Create: `src/db/seed.ts`

- [ ] **Step 1: Write the seed script**

```typescript
import { db } from "./index";
import { websites, keywords, competitors, rankingHistory } from "./schema";

async function seed() {
  // Clear existing data
  db.delete(keywords).run();
  db.delete(competitors).run();
  db.delete(rankingHistory).run();
  db.delete(websites).run();

  // Insert websites
  db.insert(websites).values([
    {
      id: "1", domain: "sitioweb.com", status: "connected",
      accessTypes: JSON.stringify(["wordpress", "ftp", "cpanel"]),
      keywordsCount: 24, articlesCount: 18, avgPosition: 8.4,
      estimatedTraffic: 24800, backlinksCount: 1204, healthScore: 72,
      lastAudit: "Hace 2h", createdAt: new Date().toISOString(),
    },
    {
      id: "2", domain: "mitiendaonline.es", status: "connected",
      accessTypes: JSON.stringify(["wordpress", "ssh"]),
      keywordsCount: 16, articlesCount: 9, avgPosition: 12.1,
      estimatedTraffic: 12000, backlinksCount: 580, healthScore: 65,
      lastAudit: "Hace 5h", createdAt: new Date().toISOString(),
    },
    {
      id: "3", domain: "blog-antiguo.com", status: "no-access",
      accessTypes: JSON.stringify(["wordpress"]),
      keywordsCount: 8, articlesCount: 0, avgPosition: 22,
      estimatedTraffic: 2100, backlinksCount: 94, healthScore: 40,
      lastAudit: "Hace 12d", errorMessage: "Credenciales expiradas — actualizar acceso",
      createdAt: new Date().toISOString(),
    },
    {
      id: "4", domain: "old-project.net", status: "error",
      accessTypes: JSON.stringify(["ftp", "cpanel"]),
      keywordsCount: 5, articlesCount: 0, avgPosition: 35,
      estimatedTraffic: 800, backlinksCount: 32, healthScore: 22,
      lastAudit: "Nunca", errorMessage: "Error conexión FTP — timeout tras 30s",
      createdAt: new Date().toISOString(),
    },
    {
      id: "5", domain: "agencia-marketing.io", status: "connected",
      accessTypes: JSON.stringify(["wordpress", "ftp", "ssh"]),
      keywordsCount: 32, articlesCount: 27, avgPosition: 5.6,
      estimatedTraffic: 42000, backlinksCount: 2100, healthScore: 88,
      lastAudit: "Hace 30m", createdAt: new Date().toISOString(),
    },
  ]);

  const website1Id = "1";

  // Insert keywords for website 1 (sitioweb.com)
  db.insert(keywords).values([
    { id: "k1", websiteId: website1Id, keyword: "seo para empresas", position: 3, change: 2, volume: 3200, difficulty: "medium", history: JSON.stringify([8, 7, 6, 5, 4, 3, 3]), isTop3: 1, isFalling: 0 },
    { id: "k2", websiteId: website1Id, keyword: "agencia seo barcelona", position: 7, change: 0, volume: 1800, difficulty: "hard", history: JSON.stringify([7, 8, 7, 7, 6, 7, 7]), isTop3: 0, isFalling: 0 },
    { id: "k3", websiteId: website1Id, keyword: "posicionamiento web", position: 12, change: 4, volume: 5100, difficulty: "hard", history: JSON.stringify([18, 17, 16, 15, 14, 13, 12]), isTop3: 0, isFalling: 0 },
    { id: "k4", websiteId: website1Id, keyword: "consultor seo freelance", position: 18, change: -5, volume: 2400, difficulty: "easy", history: JSON.stringify([12, 14, 13, 15, 16, 17, 18]), isTop3: 0, isFalling: 1 },
    { id: "k5", websiteId: website1Id, keyword: "herramientas seo automaticas", position: 9, change: 1, volume: 890, difficulty: "easy", history: JSON.stringify([11, 11, 10, 10, 9, 9, 9]), isTop3: 0, isFalling: 0 },
  ]);

  // Insert competitors for website 1
  db.insert(competitors).values([
    { id: "c1", websiteId: website1Id, rank: 1, domain: "Tu web", avgPosition: 8.4, trend: "up", highlightChange: 0 },
    { id: "c2", websiteId: website1Id, rank: 2, domain: "competidor1.com", avgPosition: 5.2, trend: "flat", highlightChange: 0 },
    { id: "c3", websiteId: website1Id, rank: 3, domain: "competidor2.es", avgPosition: 6.8, trend: "up", highlightChange: 1 },
    { id: "c4", websiteId: website1Id, rank: 4, domain: "competidor3.com", avgPosition: 9.1, trend: "down", highlightChange: 0 },
    { id: "c5", websiteId: website1Id, rank: 5, domain: "competidor4.net", avgPosition: 11.3, trend: "flat", highlightChange: 0 },
  ]);

  // Insert ranking history for website 1
  const history: [string, number][] = [
    ["10 May", 14.2], ["12 May", 13.8], ["14 May", 14.5], ["16 May", 13.1],
    ["18 May", 12.9], ["20 May", 12.4], ["22 May", 11.8], ["24 May", 11.2],
    ["26 May", 10.7], ["28 May", 10.3], ["30 May", 9.8],  ["1 Jun", 9.5],
    ["3 Jun", 9.2],  ["5 Jun", 8.9],   ["7 Jun", 8.6],   ["8 Jun", 8.4],
  ];
  for (const [date, avgPosition] of history) {
    db.insert(rankingHistory).values({ websiteId: website1Id, date, avgPosition });
  }

  console.log("Seed completed: 5 websites, 5 keywords, 5 competitors, 16 ranking points");
}

seed().catch(console.error);
```

- [ ] **Step 2: Ensure tables exist, then run seed**

```bash
npx tsx src/db/migrate.ts && npx tsx src/db/seed.ts
```

Expected: "Tables created successfully" then "Seed completed: 5 websites, 5 keywords, 5 competitors, 16 ranking points"

- [ ] **Step 3: Commit**

```bash
git add src/db/seed.ts
git commit -m "feat: add seed script with mock data migrated to SQLite"
```

---

### Task 6: Create GET/POST /api/websites route

**Files:**
- Create: `src/app/api/websites/route.ts`

- [ ] **Step 1: Write the route handler**

```typescript
import { db } from "@/db";
import { websites } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = db.select().from(websites).all();
    const data = rows.map((w) => ({
      ...w,
      accessTypes: JSON.parse(w.accessTypes) as string[],
    }));
    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: "Failed to fetch websites" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.insert(websites).values({
      id,
      domain: body.domain,
      status: body.status ?? "connected",
      accessTypes: JSON.stringify(body.accessTypes ?? []),
      keywordsCount: body.keywordsCount ?? 0,
      articlesCount: body.articlesCount ?? 0,
      avgPosition: body.avgPosition ?? 0,
      estimatedTraffic: body.estimatedTraffic ?? 0,
      backlinksCount: body.backlinksCount ?? 0,
      healthScore: body.healthScore ?? 0,
      lastAudit: body.lastAudit ?? "",
      errorMessage: body.errorMessage ?? null,
      createdAt: now,
    });

    const newWebsite = db.select().from(websites).where(eq(websites.id, id)).get();
    if (!newWebsite) {
      return Response.json({ error: "Failed to create website" }, { status: 500 });
    }

    return Response.json({
      data: { ...newWebsite, accessTypes: JSON.parse(newWebsite.accessTypes) },
    }, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Failed to create website" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit src/app/api/websites/route.ts
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/websites/route.ts
git commit -m "feat: add GET/POST /api/websites route"
```

---

### Task 7: Create GET /api/websites/stats route

**Files:**
- Create: `src/app/api/websites/stats/route.ts`

- [ ] **Step 1: Write the stats route handler**

```typescript
import { db } from "@/db";
import { websites } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const all = db.select().from(websites).all();
    const stats = {
      total: all.length,
      connected: all.filter((w) => w.status === "connected").length,
      noAccess: all.filter((w) => w.status === "no-access").length,
      error: all.filter((w) => w.status === "error").length,
    };
    return Response.json({ data: stats });
  } catch (error) {
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/websites/stats/route.ts
git commit -m "feat: add GET /api/websites/stats route"
```

---

### Task 8: Create GET/PATCH/DELETE /api/websites/[id] route

**Files:**
- Create: `src/app/api/websites/[id]/route.ts`

- [ ] **Step 1: Write the single-website route handler**

```typescript
import { db } from "@/db";
import { websites } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = db.select().from(websites).where(eq(websites.id, id)).get();
    if (!result) {
      return Response.json({ error: "Website not found" }, { status: 404 });
    }
    return Response.json({
      data: { ...result, accessTypes: JSON.parse(result.accessTypes) },
    });
  } catch (error) {
    return Response.json({ error: "Failed to fetch website" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = db.select().from(websites).where(eq(websites.id, id)).get();
    if (!existing) {
      return Response.json({ error: "Website not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.domain !== undefined) updateData.domain = body.domain;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.accessTypes !== undefined) updateData.accessTypes = JSON.stringify(body.accessTypes);
    if (body.keywordsCount !== undefined) updateData.keywordsCount = body.keywordsCount;
    if (body.articlesCount !== undefined) updateData.articlesCount = body.articlesCount;
    if (body.avgPosition !== undefined) updateData.avgPosition = body.avgPosition;
    if (body.estimatedTraffic !== undefined) updateData.estimatedTraffic = body.estimatedTraffic;
    if (body.backlinksCount !== undefined) updateData.backlinksCount = body.backlinksCount;
    if (body.healthScore !== undefined) updateData.healthScore = body.healthScore;
    if (body.lastAudit !== undefined) updateData.lastAudit = body.lastAudit;
    if (body.errorMessage !== undefined) updateData.errorMessage = body.errorMessage;

    if (Object.keys(updateData).length > 0) {
      db.update(websites).set(updateData).where(eq(websites.id, id)).run();
    }

    const updated = db.select().from(websites).where(eq(websites.id, id)).get();
    return Response.json({
      data: { ...updated, accessTypes: JSON.parse(updated!.accessTypes) },
    });
  } catch (error) {
    return Response.json({ error: "Failed to update website" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = db.select().from(websites).where(eq(websites.id, id)).get();
    if (!existing) {
      return Response.json({ error: "Website not found" }, { status: 404 });
    }
    db.delete(websites).where(eq(websites.id, id)).run();
    return Response.json({ data: { deleted: true } });
  } catch (error) {
    return Response.json({ error: "Failed to delete website" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/websites/[id]/route.ts
git commit -m "feat: add GET/PATCH/DELETE /api/websites/[id] route"
```

---

### Task 9: Create GET /api/dashboard route

**Files:**
- Create: `src/app/api/dashboard/route.ts`

- [ ] **Step 1: Write the dashboard route handler**

```typescript
import { db } from "@/db";
import { websites, keywords, competitors, rankingHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { SEODashboardData } from "@/types/seo";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get("websiteId");

    if (!websiteId) {
      return Response.json({ error: "websiteId query parameter is required" }, { status: 400 });
    }

    const website = db.select().from(websites).where(eq(websites.id, websiteId)).get();
    if (!website) {
      return Response.json({ error: "Website not found" }, { status: 404 });
    }

    const kwRows = db.select().from(keywords).where(eq(keywords.websiteId, websiteId)).all();
    const compRows = db.select().from(competitors).where(eq(competitors.websiteId, websiteId)).all();
    const rankingRows = db.select().from(rankingHistory).where(eq(rankingHistory.websiteId, websiteId)).all();

    const data: SEODashboardData = {
      websiteUrl: website.domain,
      kpis: {
        avgPosition: { value: website.avgPosition, change: 2.1, trend: "up" },
        estimatedTraffic: { value: website.estimatedTraffic, change: 12.3, trend: "up" },
        backlinks: { value: website.backlinksCount, change: 48, trend: "up" },
        healthScore: { value: website.healthScore, change: 5, trend: "up" },
      },
      rankingHistory: rankingRows.map((r) => ({
        date: r.date,
        avgPosition: r.avgPosition,
      })),
      competitors: compRows.map((c) => ({
        rank: c.rank,
        domain: c.domain,
        avgPosition: c.avgPosition,
        trend: c.trend as "up" | "down" | "flat",
        highlightChange: c.highlightChange === 1 ? true : undefined,
      })),
      keywords: kwRows.map((k) => ({
        id: k.id,
        keyword: k.keyword,
        position: k.position,
        change: k.change,
        volume: k.volume,
        difficulty: k.difficulty as "easy" | "medium" | "hard",
        history: JSON.parse(k.history) as number[],
        isTop3: k.isTop3 === 1,
        isFalling: k.isFalling === 1,
      })),
    };

    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/dashboard/route.ts
git commit -m "feat: add GET /api/dashboard route"
```

---

### Task 10: Create useApi custom hook

**Files:**
- Create: `src/hooks/use-api.ts`

- [ ] **Step 1: Write the useApi hook**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(url: string): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrigger, setRetrigger] = useState(0);

  const refetch = useCallback(() => {
    setRetrigger((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json.data ?? json);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url, retrigger]);

  return { data, loading, error, refetch };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-api.ts
git commit -m "feat: add useApi hook for data fetching"
```

---

### Task 11: Update Websites page to use API

**Files:**
- Modify: `src/app/websites/page.tsx`

- [ ] **Step 1: Replace mock data with API fetch**

The existing file imports `getWebsites` and `getWebsiteStats` from mock-data. We remove those and use `useApi` instead. Open `src/app/websites/page.tsx` and replace lines 1-11 (imports + data fetching) with:

```typescript
"use client";

import { useApi } from "@/hooks/use-api";
import type { WebsiteData, WebsiteStats } from "@/types/seo";
import { QuickStats } from "@/components/websites/quick-stats";
import { WebsiteGrid } from "@/components/websites/website-grid";

export default function WebsitesPage() {
  const { data: websites, loading: wLoading } = useApi<WebsiteData[]>("/api/websites");
  const { data: stats, loading: sLoading } = useApi<WebsiteStats>("/api/websites/stats");
  const loading = wLoading || sLoading;
```

Then add a loading state before the main render (after the last hook call, before the return):

```typescript
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando websites...</p>
        </div>
      </div>
    );
  }
```

And change the JSX to handle null data:

```typescript
      <QuickStats stats={stats ?? { total: 0, connected: 0, noAccess: 0, error: 0 }} />
      <WebsiteGrid websites={websites ?? []} />
```

The breadcrumb + header stays the same as before.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit src/app/websites/page.tsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/websites/page.tsx
git commit -m "feat: migrate Websites page from mock to API"
```

---

### Task 12: Update Dashboard page to use API

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Replace mock data with API fetch**

The existing file imports `getDashboardData` from mock-data. Remove that and use `useApi`. Open `src/app/dashboard/page.tsx` and replace the imports + data line:

```typescript
"use client";

import { useApi } from "@/hooks/use-api";
import type { SEODashboardData } from "@/types/seo";
import { KPIGrid } from "@/components/seo/kpi-grid";
import { RankingChart } from "@/components/seo/ranking-chart";
import { CompetitorPanel } from "@/components/seo/competitor-panel";
import { KeywordsTable } from "@/components/seo/keywords-table";

export default function DashboardPage() {
  const { data, loading } = useApi<SEODashboardData>("/api/dashboard?websiteId=1");
```

Add loading state before the return:

```typescript
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }
```

The JSX stays identical — `data` has the same shape as `getDashboardData()` returned.

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: migrate Dashboard page from mock to API"
```

---

### Task 13: End-to-end verification

- [ ] **Step 1: Ensure DB is seeded**

```bash
npx tsx src/db/migrate.ts && npx tsx src/db/seed.ts
```

Expected: success messages.

- [ ] **Step 2: Start dev server**

```bash
npm run dev
```

Wait for "Ready in" message.

- [ ] **Step 3: Test /api/websites**

```bash
curl -s http://localhost:3000/api/websites | head -c 200
```

Expected: JSON array with 5 websites.

- [ ] **Step 4: Test /api/websites/stats**

```bash
curl -s http://localhost:3000/api/websites/stats
```

Expected: `{"data":{"total":5,"connected":3,"noAccess":1,"error":1}}`

- [ ] **Step 5: Test /api/websites/[id]**

```bash
curl -s http://localhost:3000/api/websites/1 | head -c 200
```

Expected: single website JSON for "sitioweb.com".

- [ ] **Step 6: Test /api/dashboard**

```bash
curl -s http://localhost:3000/api/dashboard?websiteId=1 | head -c 300
```

Expected: full dashboard data with KPIs, ranking history, competitors, keywords.

- [ ] **Step 7: Open browser**

Navigate to `http://localhost:3000/websites` — should show the 5 website cards with real data.
Navigate to `http://localhost:3000/dashboard` — should show KPIs, chart, competitors, keywords.

- [ ] **Step 8: Commit any final tweaks if needed**
