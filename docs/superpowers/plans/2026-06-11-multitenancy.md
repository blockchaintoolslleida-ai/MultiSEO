# Multi-tenancy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real multi-tenancy with tenants table, tenant_id FK on websites, TenantContext, functional TenantSwitcher dropdown, and tenant-filtered API routes.

**Architecture:** New `tenants` table with FK from `websites.tenant_id`. React Context (`TenantProvider`) loads tenants from `/api/tenants` and exposes active tenant via `useTenant()` hook. API routes filter by `?tenantId=` query param. TenantSwitcher becomes a dropdown that calls `setTenant()`.

**Tech Stack:** Next.js 16.2, React 19, SQLite + Drizzle ORM, Tailwind 4, shadcn/ui

---

### Task 1: Add tenants table to Drizzle schema + tenant_id to websites

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Add tenants table and tenant_id column**

Replace `src/db/schema.ts` with:

```typescript
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const tenants = sqliteTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: text("created_at").notNull().default(""),
});

export const websites = sqliteTable("websites", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
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
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add tenants table and tenant_id FK to websites schema"
```

---

### Task 2: Update migrate.ts with tenants table

**Files:**
- Modify: `src/db/migrate.ts`

- [ ] **Step 1: Add tenants table creation**

Replace `src/db/migrate.ts` with:

```typescript
import Database from "better-sqlite3";
import * as path from "path";

const DB_PATH = path.resolve(process.cwd(), "multiseo.db");
const sqlite = new Database(DB_PATH);

try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS websites (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
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
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
} finally {
  sqlite.close();
}
```

- [ ] **Step 2: Delete old DB and run migration fresh (schema changed)**

```bash
rm -f multiseo.db && npx tsx src/db/migrate.ts
```

Expected: "Tables created successfully"

- [ ] **Step 3: Commit**

```bash
git add src/db/migrate.ts
git commit -m "feat: add tenants table to migration bootstrap"
```

---

### Task 3: Update seed.ts with tenants and tenant_id

**Files:**
- Modify: `src/db/seed.ts`

- [ ] **Step 1: Add tenant inserts and tenant_id to websites**

Replace `src/db/seed.ts` with:

```typescript
import { db } from "./index";
import { tenants, websites, keywords, competitors, rankingHistory } from "./schema";

function seed() {
  db.transaction((tx) => {
    // Clear existing data
    tx.delete(rankingHistory).run();
    tx.delete(keywords).run();
    tx.delete(competitors).run();
    tx.delete(websites).run();
    tx.delete(tenants).run();

    // Insert tenants
    tx.insert(tenants).values([
      { id: "demo", name: "Demo Company", slug: "demo-company", createdAt: new Date().toISOString() },
      { id: "acme", name: "Acme Corp", slug: "acme-corp", createdAt: new Date().toISOString() },
    ]).run();

    const demoId = "demo";

    // Insert websites — all belong to Demo Company
    tx.insert(websites).values([
      {
        id: "1", tenantId: demoId, domain: "sitioweb.com", status: "connected",
        accessTypes: JSON.stringify(["wordpress", "ftp", "cpanel"]),
        keywordsCount: 24, articlesCount: 18, avgPosition: 8.4,
        estimatedTraffic: 24800, backlinksCount: 1204, healthScore: 72,
        lastAudit: "Hace 2h", createdAt: new Date().toISOString(),
      },
      {
        id: "2", tenantId: demoId, domain: "mitiendaonline.es", status: "connected",
        accessTypes: JSON.stringify(["wordpress", "ssh"]),
        keywordsCount: 16, articlesCount: 9, avgPosition: 12.1,
        estimatedTraffic: 12000, backlinksCount: 580, healthScore: 65,
        lastAudit: "Hace 5h", createdAt: new Date().toISOString(),
      },
      {
        id: "3", tenantId: demoId, domain: "blog-antiguo.com", status: "no-access",
        accessTypes: JSON.stringify(["wordpress"]),
        keywordsCount: 8, articlesCount: 0, avgPosition: 22,
        estimatedTraffic: 2100, backlinksCount: 94, healthScore: 40,
        lastAudit: "Hace 12d", errorMessage: "Credenciales expiradas — actualizar acceso",
        createdAt: new Date().toISOString(),
      },
      {
        id: "4", tenantId: demoId, domain: "old-project.net", status: "error",
        accessTypes: JSON.stringify(["ftp", "cpanel"]),
        keywordsCount: 5, articlesCount: 0, avgPosition: 35,
        estimatedTraffic: 800, backlinksCount: 32, healthScore: 22,
        lastAudit: "Nunca", errorMessage: "Error conexión FTP — timeout tras 30s",
        createdAt: new Date().toISOString(),
      },
      {
        id: "5", tenantId: demoId, domain: "agencia-marketing.io", status: "connected",
        accessTypes: JSON.stringify(["wordpress", "ftp", "ssh"]),
        keywordsCount: 32, articlesCount: 27, avgPosition: 5.6,
        estimatedTraffic: 42000, backlinksCount: 2100, healthScore: 88,
        lastAudit: "Hace 30m", createdAt: new Date().toISOString(),
      },
    ]).run();

    const website1Id = "1";

    tx.insert(keywords).values([
      { id: "k1", websiteId: website1Id, keyword: "seo para empresas", position: 3, change: 2, volume: 3200, difficulty: "medium", history: JSON.stringify([8, 7, 6, 5, 4, 3, 3]), isTop3: 1, isFalling: 0 },
      { id: "k2", websiteId: website1Id, keyword: "agencia seo barcelona", position: 7, change: 0, volume: 1800, difficulty: "hard", history: JSON.stringify([7, 8, 7, 7, 6, 7, 7]), isTop3: 0, isFalling: 0 },
      { id: "k3", websiteId: website1Id, keyword: "posicionamiento web", position: 12, change: 4, volume: 5100, difficulty: "hard", history: JSON.stringify([18, 17, 16, 15, 14, 13, 12]), isTop3: 0, isFalling: 0 },
      { id: "k4", websiteId: website1Id, keyword: "consultor seo freelance", position: 18, change: -5, volume: 2400, difficulty: "easy", history: JSON.stringify([12, 14, 13, 15, 16, 17, 18]), isTop3: 0, isFalling: 1 },
      { id: "k5", websiteId: website1Id, keyword: "herramientas seo automaticas", position: 9, change: 1, volume: 890, difficulty: "easy", history: JSON.stringify([11, 11, 10, 10, 9, 9, 9]), isTop3: 0, isFalling: 0 },
    ]).run();

    tx.insert(competitors).values([
      { id: "c1", websiteId: website1Id, rank: 1, domain: "Tu web", avgPosition: 8.4, trend: "up", highlightChange: 0 },
      { id: "c2", websiteId: website1Id, rank: 2, domain: "competidor1.com", avgPosition: 5.2, trend: "flat", highlightChange: 0 },
      { id: "c3", websiteId: website1Id, rank: 3, domain: "competidor2.es", avgPosition: 6.8, trend: "up", highlightChange: 1 },
      { id: "c4", websiteId: website1Id, rank: 4, domain: "competidor3.com", avgPosition: 9.1, trend: "down", highlightChange: 0 },
      { id: "c5", websiteId: website1Id, rank: 5, domain: "competidor4.net", avgPosition: 11.3, trend: "flat", highlightChange: 0 },
    ]).run();

    const history: [string, number][] = [
      ["10 May", 14.2], ["12 May", 13.8], ["14 May", 14.5], ["16 May", 13.1],
      ["18 May", 12.9], ["20 May", 12.4], ["22 May", 11.8], ["24 May", 11.2],
      ["26 May", 10.7], ["28 May", 10.3], ["30 May", 9.8],  ["1 Jun", 9.5],
      ["3 Jun", 9.2],  ["5 Jun", 8.9],   ["7 Jun", 8.6],   ["8 Jun", 8.4],
    ];
    for (const [date, avgPosition] of history) {
      tx.insert(rankingHistory).values({ websiteId: website1Id, date, avgPosition }).run();
    }
  });

  console.log("Seed completed: 2 tenants, 5 websites (Demo Company), 5 keywords, 5 competitors, 16 ranking points");
}

seed();
```

- [ ] **Step 2: Delete old DB, migrate, and seed**

```bash
rm -f multiseo.db && npx tsx src/db/migrate.ts && npx tsx src/db/seed.ts
```

Expected: "Tables created successfully" then "Seed completed: 2 tenants, 5 websites (Demo Company), 5 keywords, 5 competitors, 16 ranking points"

- [ ] **Step 3: Commit**

```bash
git add src/db/seed.ts
git commit -m "feat: add tenants and tenant_id to seed data"
```

---

### Task 4: Create GET /api/tenants route

**Files:**
- Create: `src/app/api/tenants/route.ts`

- [ ] **Step 1: Write the tenants route handler**

```typescript
import { db } from "@/db";
import { tenants } from "@/db/schema";

export async function GET() {
  try {
    const rows = db.select().from(tenants).all();
    return Response.json({ data: rows });
  } catch (error) {
    return Response.json({ error: "Failed to fetch tenants" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create directory, write file, verify**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/tenants/route.ts
git commit -m "feat: add GET /api/tenants route"
```

---

### Task 5: Update GET/POST /api/websites to filter by tenantId

**Files:**
- Modify: `src/app/api/websites/route.ts`

- [ ] **Step 1: Add tenantId filtering to GET, require tenantId in POST**

Replace `src/app/api/websites/route.ts` with:

```typescript
import { db } from "@/db";
import { websites } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    let rows;
    if (tenantId) {
      rows = db.select().from(websites).where(eq(websites.tenantId, tenantId)).all();
    } else {
      rows = db.select().from(websites).all();
    }

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

    if (!body.tenantId) {
      return Response.json({ error: "tenantId is required" }, { status: 400 });
    }

    db.insert(websites).values({
      id,
      tenantId: body.tenantId,
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

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/websites/route.ts
git commit -m "feat: filter websites by tenantId, require tenantId on create"
```

---

### Task 6: Update GET /api/websites/stats to filter by tenantId

**Files:**
- Modify: `src/app/api/websites/stats/route.ts`

- [ ] **Step 1: Add tenantId query param filter**

Replace `src/app/api/websites/stats/route.ts` with:

```typescript
import { db } from "@/db";
import { websites } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    let all;
    if (tenantId) {
      all = db.select().from(websites).where(eq(websites.tenantId, tenantId)).all();
    } else {
      all = db.select().from(websites).all();
    }

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
git commit -m "feat: filter website stats by tenantId"
```

---

### Task 7: Create TenantContext (use-tenant.tsx)

**Files:**
- Create: `src/hooks/use-tenant.tsx`

- [ ] **Step 1: Write TenantProvider + useTenant hook**

```typescript
"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

interface TenantContextValue {
  tenant: Tenant | null;
  tenants: Tenant[];
  setTenant: (id: string) => void;
  loading: boolean;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  tenants: [],
  setTenant: () => {},
  loading: true,
});

const STORAGE_KEY = "multiseo-tenant-id";

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load tenants from API
  useEffect(() => {
    fetch("/api/tenants")
      .then((res) => res.json())
      .then((json) => {
        const list: Tenant[] = json.data ?? [];
        setTenants(list);
        // Restore saved tenant or default to first
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && list.find((t) => t.id === saved)) {
          setActiveId(saved);
        } else if (list.length > 0) {
          setActiveId(list[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setTenant = useCallback((id: string) => {
    setActiveId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const tenant = tenants.find((t) => t.id === activeId) ?? null;

  return (
    <TenantContext.Provider value={{ tenant, tenants, setTenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/use-tenant.tsx
git commit -m "feat: add TenantContext with useTenant hook"
```

---

### Task 8: Update TenantSwitcher with functional dropdown

**Files:**
- Modify: `src/components/layout/tenant-switcher.tsx`

- [ ] **Step 1: Replace static display with dropdown**

Read the existing file, then replace with:

```typescript
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Users, Check } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";

export function TenantSwitcher() {
  const { tenant, tenants, setTenant, loading } = useTenant();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (loading || !tenant) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-brand-50 text-brand-400 text-sm font-medium mt-auto">
        <Users className="w-[15px] h-[15px]" />
        <span className="flex-1 truncate">Cargando...</span>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative mt-auto">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-brand-50 text-brand-600 text-sm font-medium hover:bg-brand-100 transition-colors"
      >
        <Users className="w-[15px] h-[15px]" />
        <span className="flex-1 truncate text-left">{tenant.name}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
          {tenants.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTenant(t.id); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                t.id === tenant.id ? "text-brand-600 font-medium" : "text-gray-700"
              }`}
            >
              <span className="flex-1 text-left truncate">{t.name}</span>
              {t.id === tenant.id && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/tenant-switcher.tsx
git commit -m "feat: make TenantSwitcher functional with dropdown and useTenant"
```

---

### Task 9: Wrap layout with TenantProvider

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add TenantProvider wrapper**

Replace the current content with:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TenantProvider } from "@/hooks/use-tenant";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MultiSEO — Dashboard",
  description: "Sistema SEO multiempresa con inteligencia artificial",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        <TenantProvider>
          <TooltipProvider>
            <AppHeader />
            <div className="flex" style={{ minHeight: "calc(100vh - 60px)" }}>
              <AppSidebar />
              <main className="flex-1 bg-content-bg p-6 overflow-y-auto">
                {children}
              </main>
            </div>
          </TooltipProvider>
        </TenantProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: wrap app with TenantProvider"
```

---

### Task 10: Update Websites page with tenantId and dynamic breadcrumb

**Files:**
- Modify: `src/app/websites/page.tsx`

- [ ] **Step 1: Add useTenant, pass tenantId to API, dynamic breadcrumb**

Replace the current content with:

```typescript
"use client";

import { useApi } from "@/hooks/use-api";
import { useTenant } from "@/hooks/use-tenant";
import type { WebsiteData, WebsiteStats } from "@/types/seo";
import { QuickStats } from "@/components/websites/quick-stats";
import { WebsiteGrid } from "@/components/websites/website-grid";

export default function WebsitesPage() {
  const { tenant } = useTenant();
  const { data: websites, loading: wLoading } = useApi<WebsiteData[]>(
    tenant ? `/api/websites?tenantId=${tenant.id}` : ""
  );
  const { data: stats, loading: sLoading } = useApi<WebsiteStats>(
    tenant ? `/api/websites/stats?tenantId=${tenant.id}` : ""
  );
  const loading = wLoading || sLoading || !tenant;

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

  return (
    <div>
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-5">
        <span className="text-brand-600 inline-flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          {tenant?.name}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">Websites</span>
      </div>
      <div className="flex items-start justify-between mb-5">
        <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          Gestión de Websites
        </h1>
        <button className="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-brand-700">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Añadir Website
        </button>
      </div>
      <QuickStats stats={stats ?? { total: 0, connected: 0, noAccess: 0, error: 0 }} />
      <WebsiteGrid websites={websites ?? []} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/websites/page.tsx
git commit -m "feat: add tenantId to Websites page API calls and dynamic breadcrumb"
```

---

### Task 11: Update Dashboard page with dynamic breadcrumb

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Replace hardcoded "Demo Company" with tenant.name**

The only change is in the breadcrumb. Replace lines 1-10 (imports + component start):

```typescript
"use client";

import { useApi } from "@/hooks/use-api";
import { useTenant } from "@/hooks/use-tenant";
import type { SEODashboardData } from "@/types/seo";
import { KPIGrid } from "@/components/seo/kpi-grid";
import { RankingChart } from "@/components/seo/ranking-chart";
import { CompetitorPanel } from "@/components/seo/competitor-panel";
import { KeywordsTable } from "@/components/seo/keywords-table";

export default function DashboardPage() {
  const { tenant } = useTenant();
  const { data, loading } = useApi<SEODashboardData>("/api/dashboard?websiteId=1");

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

  return (
    <div>
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-5">
        <span className="text-brand-600 inline-flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          {tenant?.name ?? "Demo Company"}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span>{data.websiteUrl}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">Dashboard SEO</span>
      </div>
      <KPIGrid kpis={data.kpis} />
      <div className="grid grid-cols-[2fr_1fr] gap-4 mb-6">
        <RankingChart data={data.rankingHistory} />
        <CompetitorPanel competitors={data.competitors} />
      </div>
      <KeywordsTable keywords={data.keywords} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: dynamic tenant name in Dashboard breadcrumb"
```

---

### Task 12: End-to-end verification

- [ ] **Step 1: Rebuild DB with new schema**

```bash
rm -f multiseo.db && npx tsx src/db/migrate.ts && npx tsx src/db/seed.ts
```

Expected: success messages.

- [ ] **Step 2: Start dev server and test tenants API**

```bash
curl -s http://localhost:4000/api/tenants
```

Expected: `{"data":[{"id":"demo","name":"Demo Company","slug":"demo-company",...},{"id":"acme","name":"Acme Corp",...}]}`

- [ ] **Step 3: Test website filtering by tenant**

```bash
curl -s "http://localhost:4000/api/websites?tenantId=demo" | python -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d[\"data\"])} websites for demo')"
curl -s "http://localhost:4000/api/websites?tenantId=acme" | python -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d[\"data\"])} websites for acme')"
curl -s "http://localhost:4000/api/websites/stats?tenantId=demo"
curl -s "http://localhost:4000/api/websites/stats?tenantId=acme"
```

Expected: 5 websites for demo, 0 for acme. Stats: `{"total":5,...}` for demo, `{"total":0,...}` for acme.

- [ ] **Step 4: Verify browser**

Navigate to `http://localhost:4000/websites` — TenantSwitcher must show "Demo Company" with 5 websites. Switch to "Acme Corp" — 0 websites. Breadcrumbs must reflect active tenant.

- [ ] **Step 5: Commit any final tweaks**
