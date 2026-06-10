# MultiSEO Frontend Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete MultiSEO dashboard frontend with 4 panels (SEO Dashboard, Websites, Articles, Reports) using mock data, Next.js 14+ App Router, TailwindCSS, shadcn/ui, Recharts, and lucide-react.

**Architecture:** Next.js App Router with a shared AppShell layout (header + sidebar + content slot). Each panel is a page under its own route. All data is mock data served from `lib/mock-data.ts`. Components follow atomic design — reusable building blocks composed into page-level layouts.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, TailwindCSS 3.4+, shadcn/ui, Recharts, lucide-react, Framer Motion

---

## File Structure Map

```
src/
├── app/
│   ├── layout.tsx              # AppShell — sidebar + header + main slot
│   ├── page.tsx                # redirect / → /dashboard
│   ├── globals.css             # Tailwind + custom properties
│   ├── dashboard/page.tsx      # SEODashboard page
│   ├── websites/page.tsx       # WebsitesPanel page
│   ├── articles/page.tsx       # ArticlesPanel page
│   └── reports/page.tsx        # ReportsPanel page
├── components/
│   ├── layout/
│   │   ├── app-header.tsx      # Logo, breadcrumb, notifications, user menu
│   │   ├── app-sidebar.tsx     # Nav sections, items, tenant switcher
│   │   ├── nav-item.tsx        # Single nav item (icon + label + badge)
│   │   └── tenant-switcher.tsx # Tenant/website selector
│   ├── seo/
│   │   ├── kpi-card.tsx        # Single KPI card
│   │   ├── kpi-grid.tsx        # 4-card grid
│   │   ├── ranking-chart.tsx   # Recharts bar chart
│   │   ├── competitor-panel.tsx # Competitor ranking list
│   │   ├── keywords-table.tsx  # Keywords table with search/pagination
│   │   └── alert-banner.tsx    # Alert/warning banner
│   ├── websites/
│   │   ├── quick-stats.tsx     # 4-stat summary bar
│   │   ├── website-card.tsx    # Single website card
│   │   ├── website-grid.tsx    # Grid of website cards
│   │   └── add-website-modal.tsx # Modal for adding a website
│   ├── articles/
│   │   ├── article-row.tsx     # Single article list row
│   │   ├── article-list.tsx    # Article list with tabs
│   │   ├── article-calendar.tsx # Monthly calendar widget
│   │   ├── article-preview.tsx # Article content preview
│   │   └── seo-scores.tsx      # SEO score bars
│   └── reports/
│       ├── report-card.tsx     # Single report card
│       ├── pdf-preview.tsx     # Mini PDF mockup
│       ├── share-links.tsx     # Share link list
│       └── branding-settings.tsx # Brand customization panel
├── lib/
│   ├── mock-data.ts            # All mock data
│   └── constants.ts            # App constants
└── types/
    └── seo.ts                  # All TypeScript interfaces
```

---

### Task 1: Initialize Next.js Project with Dependencies

**Files:**
- Create: Project scaffold via `create-next-app`
- Modify: `package.json`
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Scaffold Next.js project**

Run from `C:\Users\USUARIO\MultiSEO`:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-npm
```
When prompted:
- Would you like to use the `src/` directory? → Yes (already set)
- Would you like to customize the default import alias? → No

- [ ] **Step 2: Install dependencies**

```bash
npm install lucide-react recharts framer-motion
npm install --save-dev @types/node
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```
Answer prompts:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

- [ ] **Step 4: Add shadcn/ui components**

```bash
npx shadcn@latest add button card table badge input dialog tabs dropdown-menu avatar calendar select separator tooltip pagination
```

- [ ] **Step 5: Configure Tailwind with custom theme**

Replace the content of `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        success: { DEFAULT: "#059669", light: "#ecfdf5" },
        danger: { DEFAULT: "#dc2626", light: "#fef2f2" },
        warning: { DEFAULT: "#d97706", light: "#fffbeb" },
        sidebar: { bg: "#fafbfc", border: "#e5e7eb" },
        content: { bg: "#f5f6f8" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

- [ ] **Step 6: Set up globals.css**

Replace `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 255 255 255;
    --foreground: 17 24 39;
    --card: 255 255 255;
    --card-foreground: 17 24 39;
    --border: 229 231 235;
    --muted-foreground: 107 114 128;
    --accent: 99 102 241;
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js project with shadcn/ui and dependencies

- Next.js 14+ with App Router and TypeScript
- TailwindCSS with custom brand colors
- shadcn/ui components: button, card, table, badge, input, dialog, tabs, etc.
- lucide-react, recharts, framer-motion"
```

---

### Task 2: Create TypeScript Types and Mock Data

**Files:**
- Create: `src/types/seo.ts`
- Create: `src/lib/constants.ts`
- Create: `src/lib/mock-data.ts`

- [ ] **Step 1: Write type definitions**

Create `src/types/seo.ts`:

```typescript
// === Dashboard SEO ===
export interface KPIMetric {
  value: number;
  change: number;
  trend: "up" | "down" | "flat";
}

export interface KPIData {
  avgPosition: KPIMetric;
  estimatedTraffic: KPIMetric;
  backlinks: KPIMetric;
  healthScore: KPIMetric;
}

export interface RankingPoint {
  date: string;
  avgPosition: number;
}

export interface CompetitorData {
  rank: number;
  domain: string;
  avgPosition: number;
  trend: "up" | "down" | "flat";
  highlightChange?: boolean;
}

export interface KeywordData {
  id: string;
  keyword: string;
  position: number;
  change: number;
  volume: number;
  difficulty: "easy" | "medium" | "hard";
  history: number[];
  isTop3?: boolean;
  isFalling?: boolean;
}

export interface SEODashboardData {
  websiteUrl: string;
  kpis: KPIData;
  rankingHistory: RankingPoint[];
  competitors: CompetitorData[];
  keywords: KeywordData[];
}

// === Websites ===
export type ConnectionStatus = "connected" | "no-access" | "error";
export type AccessType = "wordpress" | "ftp" | "ssh" | "cpanel";

export interface WebsiteData {
  id: string;
  domain: string;
  status: ConnectionStatus;
  accessTypes: AccessType[];
  keywords: number;
  articles: number;
  avgPosition: number;
  lastAudit: string;
  errorMessage?: string;
}

export interface WebsiteStats {
  total: number;
  connected: number;
  noAccess: number;
  error: number;
}

// === Articles ===
export type ArticleStatus = "published" | "draft" | "scheduled" | "generating";

export interface ArticleData {
  id: string;
  title: string;
  status: ArticleStatus;
  aiModel?: "claude" | "deepseek";
  websiteUrl: string;
  editedAt?: string;
  publishedAt?: string;
  scheduledAt?: string;
  keywords: string[];
  position?: number;
  views?: number;
  progress?: number;
  seoScores?: SEOScores;
  metaDescription?: string;
  slug?: string;
  content?: ArticleContent;
}

export interface ArticleContent {
  h2Sections: { title: string; paragraphs: string[] }[];
}

export interface SEOScores {
  keywords: number;
  readability: number;
  structure: number;
  originality: number;
}

// === Reports ===
export type ReportStatus = "sent" | "scheduled" | "draft";
export type ReportFrequency = "weekly" | "monthly" | "custom";

export interface ReportData {
  id: string;
  name: string;
  status: ReportStatus;
  frequency: ReportFrequency;
  websiteUrl: string;
  period: string;
  scheduleDescription?: string;
  scheduleEnabled: boolean;
  metrics: Record<string, string>;
  colorScheme: "indigo" | "green";
  shareUrl?: string;
  shareExpiresIn?: number;
}

export interface BrandingSettings {
  logoUrl: string | null;
  brandColor: string;
  footerText: string;
}

// === Layout ===
export interface NavItemData {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export interface NavSectionData {
  title: string;
  items: NavItemData[];
}

export interface NotificationData {
  id: string;
  message: string;
  type: "success" | "warning" | "error" | "info";
  time: string;
  read: boolean;
}
```

- [ ] **Step 2: Write constants**

Create `src/lib/constants.ts`:

```typescript
import type { NavSectionData, NavItemData } from "@/types/seo";

export const APP_NAME = "MultiSEO";

export const NAV_SECTIONS: NavSectionData[] = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutGrid" },
      { label: "Websites", href: "/websites", icon: "Globe" },
      { label: "Artículos", href: "/articles", icon: "FileText" },
      { label: "Rankings", href: "/rankings", icon: "TrendingUp" },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Reportes", href: "/reports", icon: "BarChart3" },
      { label: "Competidores", href: "/competitors", icon: "Monitor" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { label: "Configuración", href: "/settings", icon: "Settings" },
    ],
  },
];

export const TENANTS = [
  { id: "demo", name: "Demo Company" },
  { id: "client2", name: "Acme Corp" },
];

export const WEBSITES = [
  "sitioweb.com",
  "mitiendaonline.es",
  "blog-antiguo.com",
  "old-project.net",
  "agencia-marketing.io",
];
```

- [ ] **Step 3: Write mock data**

Create `src/lib/mock-data.ts`:

```typescript
import type {
  SEODashboardData,
  WebsiteData,
  WebsiteStats,
  ArticleData,
  ReportData,
  NotificationData,
} from "@/types/seo";

export function getDashboardData(): SEODashboardData {
  return {
    websiteUrl: "sitioweb.com",
    kpis: {
      avgPosition: { value: 8.4, change: 2.1, trend: "up" },
      estimatedTraffic: { value: 24800, change: 12.3, trend: "up" },
      backlinks: { value: 1204, change: 48, trend: "up" },
      healthScore: { value: 72, change: 5, trend: "up" },
    },
    rankingHistory: [
      { date: "10 May", avgPosition: 14.2 }, { date: "12 May", avgPosition: 13.8 },
      { date: "14 May", avgPosition: 14.5 }, { date: "16 May", avgPosition: 13.1 },
      { date: "18 May", avgPosition: 12.9 }, { date: "20 May", avgPosition: 12.4 },
      { date: "22 May", avgPosition: 11.8 }, { date: "24 May", avgPosition: 11.2 },
      { date: "26 May", avgPosition: 10.7 }, { date: "28 May", avgPosition: 10.3 },
      { date: "30 May", avgPosition: 9.8 },  { date: "1 Jun", avgPosition: 9.5 },
      { date: "3 Jun", avgPosition: 9.2 },  { date: "5 Jun", avgPosition: 8.9 },
      { date: "7 Jun", avgPosition: 8.6 },  { date: "8 Jun", avgPosition: 8.4 },
    ],
    competitors: [
      { rank: 1, domain: "Tu web", avgPosition: 8.4, trend: "up" },
      { rank: 2, domain: "competidor1.com", avgPosition: 5.2, trend: "flat" },
      { rank: 3, domain: "competidor2.es", avgPosition: 6.8, trend: "up", highlightChange: true },
      { rank: 4, domain: "competidor3.com", avgPosition: 9.1, trend: "down" },
      { rank: 5, domain: "competidor4.net", avgPosition: 11.3, trend: "flat" },
    ],
    keywords: [
      { id: "1", keyword: "seo para empresas", position: 3, change: 2, volume: 3200, difficulty: "medium", history: [8, 7, 6, 5, 4, 3, 3], isTop3: true },
      { id: "2", keyword: "agencia seo barcelona", position: 7, change: 0, volume: 1800, difficulty: "hard", history: [7, 8, 7, 7, 6, 7, 7] },
      { id: "3", keyword: "posicionamiento web", position: 12, change: 4, volume: 5100, difficulty: "hard", history: [18, 17, 16, 15, 14, 13, 12] },
      { id: "4", keyword: "consultor seo freelance", position: 18, change: -5, volume: 2400, difficulty: "easy", history: [12, 14, 13, 15, 16, 17, 18], isFalling: true },
      { id: "5", keyword: "herramientas seo automaticas", position: 9, change: 1, volume: 890, difficulty: "easy", history: [11, 11, 10, 10, 9, 9, 9] },
    ],
  };
}

export function getWebsiteStats(): WebsiteStats {
  return { total: 6, connected: 4, noAccess: 1, error: 1 };
}

export function getWebsites(): WebsiteData[] {
  return [
    {
      id: "1", domain: "sitioweb.com", status: "connected",
      accessTypes: ["wordpress", "ftp", "cpanel"],
      keywords: 24, articles: 18, avgPosition: 8.4, lastAudit: "Hace 2h",
    },
    {
      id: "2", domain: "mitiendaonline.es", status: "connected",
      accessTypes: ["wordpress", "ssh"],
      keywords: 16, articles: 9, avgPosition: 12.1, lastAudit: "Hace 5h",
    },
    {
      id: "3", domain: "blog-antiguo.com", status: "no-access",
      accessTypes: ["wordpress"],
      keywords: 8, articles: 0, avgPosition: 22, lastAudit: "Hace 12d",
      errorMessage: "Credenciales expiradas — actualizar acceso",
    },
    {
      id: "4", domain: "old-project.net", status: "error",
      accessTypes: ["ftp", "cpanel"],
      keywords: 5, articles: 0, avgPosition: 35, lastAudit: "Nunca",
      errorMessage: "Error conexión FTP — timeout tras 30s",
    },
    {
      id: "5", domain: "agencia-marketing.io", status: "connected",
      accessTypes: ["wordpress", "ftp", "ssh"],
      keywords: 32, articles: 27, avgPosition: 5.6, lastAudit: "Hace 30m",
    },
  ];
}

export function getArticles(): ArticleData[] {
  return [
    {
      id: "1", title: "Guía Completa de SEO para Empresas B2B", status: "generating",
      aiModel: "deepseek", websiteUrl: "sitioweb.com", progress: 45, keywords: ["seo b2b", "guia seo"],
    },
    {
      id: "2", title: "Estrategias de Link Building en 2026", status: "draft",
      aiModel: "claude", websiteUrl: "mitiendaonline.es", editedAt: "Hace 2h",
      keywords: ["link building", "backlinks", "autoridad dominio"],
      seoScores: { keywords: 92, readability: 85, structure: 68, originality: 94 },
      metaDescription: "Descubre las estrategias de link building más efectivas para 2026: guest posting, HARO digital, link baiting con datos originales.",
      slug: "/blog/estrategias-link-building-2026/",
      content: {
        h2Sections: [
          { title: "¿Por qué el Link Building sigue siendo clave?", paragraphs: ["A pesar de los cambios en los algoritmos de Google, los backlinks continúan siendo uno de los tres factores de posicionamiento más importantes."] },
          { title: "Guest posting estratégico", paragraphs: ["No se trata de publicar en cualquier sitio. La clave está en identificar medios con autoridad real en tu nicho."] },
        ],
      },
    },
    {
      id: "3", title: "Tendencias SEO para Ecommerce 2026", status: "scheduled",
      aiModel: "deepseek", websiteUrl: "agencia-marketing.io", scheduledAt: "12 Jun, 09:00",
      keywords: ["seo ecommerce", "tendencias", "woocommerce"],
    },
    {
      id: "4", title: "Cómo Posicionar tu Web en Google en 30 Días", status: "published",
      aiModel: "claude", websiteUrl: "sitioweb.com", publishedAt: "8 Jun",
      keywords: ["posicionar web", "google"],
      position: 3, views: 1200,
    },
    {
      id: "5", title: "Checklist Técnico SEO para Desarrolladores Web", status: "published",
      aiModel: "claude", websiteUrl: "sitioweb.com", publishedAt: "6 Jun",
      keywords: ["seo tecnico", "desarrolladores"],
      position: 12, views: 890,
    },
    {
      id: "6", title: "Herramientas de IA para Automatizar tu SEO", status: "published",
      aiModel: "deepseek", websiteUrl: "mitiendaonline.es", publishedAt: "4 Jun",
      keywords: ["ia seo", "herramientas"],
      position: 5, views: 2100,
    },
  ];
}

export function getReports(): ReportData[] {
  return [
    {
      id: "1", name: "Informe Mensual — Junio 2026", status: "scheduled", frequency: "monthly",
      websiteUrl: "sitioweb.com", period: "Junio 2026",
      scheduleDescription: "día 1 de cada mes", scheduleEnabled: true,
      metrics: { "Posición Media": "8.4 ↑", "Tráfico Estimado": "24.8K", "Backlinks": "1,204" },
      colorScheme: "indigo",
      shareUrl: "https://multiseo.app/report/demo/june-2026?token=eyJhbG...",
      shareExpiresIn: 13,
    },
    {
      id: "2", name: "Informe Semanal — Semana 23", status: "sent", frequency: "weekly",
      websiteUrl: "mitiendaonline.es", period: "2-8 Jun 2026",
      scheduleDescription: "cada lunes 08:00", scheduleEnabled: true,
      metrics: { "Keywords Top 10": "8/16", "Artículos Publicados": "2", "Mejora Semanal": "+2.3%" },
      colorScheme: "green",
      shareUrl: "https://multiseo.app/report/demo/week-23?token=abc...",
      shareExpiresIn: 4,
    },
    {
      id: "3", name: "Nuevo Reporte Personalizado", status: "draft", frequency: "custom",
      websiteUrl: "", period: "",
      scheduleEnabled: false,
      metrics: {},
      colorScheme: "indigo",
    },
  ];
}

export function getNotifications(): NotificationData[] {
  return [
    { id: "1", message: "competidor2.es subió 3 posiciones", type: "warning", time: "Hace 10m", read: false },
    { id: "2", message: "Artículo 'SEO B2B' generado con éxito", type: "success", time: "Hace 1h", read: false },
    { id: "3", message: "Conexión FTP fallida en old-project.net", type: "error", time: "Hace 3h", read: false },
    { id: "4", message: "Informe semanal listo para enviar", type: "info", time: "Hace 5h", read: true },
  ];
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/seo.ts src/lib/constants.ts src/lib/mock-data.ts
git commit -m "feat: add TypeScript types, constants, and mock data

- Complete type definitions for all 4 panels
- Navigation constants and tenant list
- Mock data: dashboard, websites, articles, reports, notifications"
```

---

### Task 3: Build AppShell Layout (Header + Sidebar + Main Slot)

**Files:**
- Create: `src/components/layout/nav-item.tsx`
- Create: `src/components/layout/tenant-switcher.tsx`
- Create: `src/components/layout/app-sidebar.tsx`
- Create: `src/components/layout/app-header.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create NavItem component**

Create `src/components/layout/nav-item.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LayoutGrid, Globe, FileText, TrendingUp, BarChart3, Monitor, Settings } from "lucide-react";
import type { NavItemData } from "@/types/seo";

const iconMap: Record<string, LucideIcon> = {
  LayoutGrid, Globe, FileText, TrendingUp, BarChart3, Monitor, Settings,
};

interface NavItemProps {
  item: NavItemData;
}

export function NavItem({ item }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = iconMap[item.icon] || LayoutGrid;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-brand-50 text-brand-600"
          : "text-gray-600 hover:bg-brand-50/50 hover:text-brand-600"
      }`}
    >
      <Icon className="w-[17px] h-[17px]" />
      <span>{item.label}</span>
      {item.badge != null && (
        <span className="ml-auto bg-brand-500 text-white rounded-full px-1.5 py-0 text-[10px] font-semibold leading-relaxed">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: Create TenantSwitcher component**

Create `src/components/layout/tenant-switcher.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import { TENANTS } from "@/lib/constants";

export function TenantSwitcher() {
  const [active, setActive] = useState(TENANTS[0]);

  // Simplified: single tenant for mock phase
  return (
    <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-brand-50 text-brand-600 text-sm font-medium mt-auto cursor-pointer">
      <Users className="w-[15px] h-[15px]" />
      <span className="flex-1 truncate">{active.name}</span>
      <ChevronDown className="w-3 h-3 ml-auto opacity-60" />
    </div>
  );
}
```

- [ ] **Step 3: Create AppSidebar component**

Create `src/components/layout/app-sidebar.tsx`:

```tsx
import { NAV_SECTIONS } from "@/lib/constants";
import { NavItem } from "./nav-item";
import { TenantSwitcher } from "./tenant-switcher";

export function AppSidebar() {
  return (
    <aside className="w-60 min-w-[240px] bg-sidebar-bg border-r border-sidebar-border flex flex-col p-2">
      {NAV_SECTIONS.map((section, i) => (
        <div key={section.title}>
          {i > 0 && <hr className="mx-3 my-2 border-sidebar-border" />}
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 px-3 pt-2 pb-1">
            {section.title}
          </p>
          {section.items.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>
      ))}
      <TenantSwitcher />
    </aside>
  );
}
```

- [ ] **Step 4: Create AppHeader component**

Create `src/components/layout/app-header.tsx`:

```tsx
"use client";

import { Bell, ChevronDown } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { getNotifications } from "@/lib/mock-data";

export function AppHeader() {
  const notifications = getNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="flex items-center justify-between h-[60px] px-6 bg-white border-b border-gray-200">
      {/* Logo */}
      <div className="flex items-center gap-2.5 font-bold text-[17px] text-gray-900">
        <div className="w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        {APP_NAME}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative w-[38px] h-[38px] rounded-[10px] border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors">
          <Bell className="w-[18px] h-[18px] text-gray-600" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-500 text-white rounded-full text-[10px] px-1.5 font-semibold">
              {unread}
            </span>
          )}
        </button>

        {/* User */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-400 flex items-center justify-center text-white font-bold text-sm">
            JD
          </div>
          <span className="text-[13.5px] font-medium text-gray-700">Juan Díaz</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Update root layout (AppShell)**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
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
        <AppHeader />
        <div className="flex" style={{ minHeight: "calc(100vh - 60px)" }}>
          <AppSidebar />
          <main className="flex-1 bg-content-bg p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Set up root page redirect**

Replace `src/app/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/layout/ src/app/layout.tsx src/app/page.tsx
git commit -m "feat: build AppShell layout with header, sidebar, and navigation

- AppHeader with logo, notification bell, and user menu
- AppSidebar with nav sections, items, and tenant switcher
- NavItem component with active state and lucide icons
- Root layout wraps all pages in AppShell
- Root page redirects to /dashboard"
```

---

### Task 4: Build SEO Dashboard Page

**Files:**
- Create: `src/components/seo/kpi-card.tsx`
- Create: `src/components/seo/kpi-grid.tsx`
- Create: `src/components/seo/ranking-chart.tsx`
- Create: `src/components/seo/competitor-panel.tsx`
- Create: `src/components/seo/alert-banner.tsx`
- Create: `src/components/seo/keywords-table.tsx`
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Create KPICard component**

Create `src/components/seo/kpi-card.tsx`:

```tsx
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KPIMetric } from "@/types/seo";

interface KPICardProps {
  label: string;
  icon: React.ReactNode;
  metric: KPIMetric;
  format?: "number" | "percentage" | "compact";
  className?: string;
}

export function KPICard({ label, icon, metric, format = "number", className }: KPICardProps) {
  const TrendIcon = metric.trend === "up" ? TrendingUp : metric.trend === "down" ? TrendingDown : Minus;
  const trendColor = metric.trend === "up" ? "text-success" : metric.trend === "down" ? "text-danger" : "text-gray-400";
  const valueColor = metric.trend === "up" ? "text-success" : metric.trend === "down" ? "text-danger" : "text-gray-900";

  const formattedValue = format === "percentage"
    ? `${metric.value}%`
    : format === "compact"
    ? metric.value >= 1000 ? `${(metric.value / 1000).toFixed(1)}K` : String(metric.value)
    : metric.value.toLocaleString();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-[18px_20px] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow">
      <p className="text-xs font-medium text-gray-500 tracking-wide flex items-center gap-1">
        {icon} {label}
      </p>
      <p className={`text-[30px] font-bold mt-0.5 -tracking-[0.5px] ${valueColor}`}>
        {formattedValue}
      </p>
      <p className={`text-[12.5px] font-semibold flex items-center gap-1 mt-1 ${trendColor}`}>
        <TrendIcon className="w-3 h-3" />
        {metric.trend === "up" && "+"}{metric.trend === "down" && ""}
        {metric.change}{format === "percentage" ? "%" : format === "compact" ? "" : ""}
        <span className="text-gray-400 font-normal ml-1">
          {metric.trend === "up" ? "vs mes anterior" : metric.trend === "down" ? "bajando" : "sin cambios"}
        </span>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create KPIGrid component**

Create `src/components/seo/kpi-grid.tsx`:

```tsx
import { Clock, TrendingUp, Link, Shield } from "lucide-react";
import { KPICard } from "./kpi-card";
import type { KPIData } from "@/types/seo";

interface KPIGridProps {
  kpis: KPIData;
}

export function KPIGrid({ kpis }: KPIGridProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <KPICard
        label="Posición Media"
        icon={<Clock className="w-3.5 h-3.5" />}
        metric={kpis.avgPosition}
        format="number"
      />
      <KPICard
        label="Tráfico Estimado"
        icon={<TrendingUp className="w-3.5 h-3.5" />}
        metric={kpis.estimatedTraffic}
        format="compact"
      />
      <KPICard
        label="Backlinks"
        icon={<Link className="w-3.5 h-3.5" />}
        metric={kpis.backlinks}
        format="number"
      />
      <KPICard
        label="Salud SEO"
        icon={<Shield className="w-3.5 h-3.5" />}
        metric={kpis.healthScore}
        format="percentage"
      />
    </div>
  );
}
```

- [ ] **Step 3: Create RankingChart component**

Create `src/components/seo/ranking-chart.tsx`:

```tsx
"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";
import type { RankingPoint } from "@/types/seo";

interface RankingChartProps {
  data: RankingPoint[];
}

export function RankingChart({ data }: RankingChartProps) {
  const chartData = data.map((d) => ({ ...d, avgPosition: Math.round(d.avgPosition * 10) / 10 }));

  const firstVal = chartData[0]?.avgPosition ?? 0;
  const lastVal = chartData[chartData.length - 1]?.avgPosition ?? 0;
  const improvement = firstVal > 0 ? ((firstVal - lastVal) / firstVal) * 100 : 0;
  const isUp = improvement > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-[18px] h-[18px] text-brand-500" />
          Evolución de Posicionamiento
        </h3>
        <span className="text-xs text-gray-400">Últimos 30 días</span>
      </div>

      <div className="h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval={3} />
            <YAxis domain={[0, "dataMax + 2"]} hide />
            <Tooltip
              formatter={(value: number) => [`Posición ${value}`, ""]}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            />
            <Bar dataKey="avgPosition" radius={[4, 4, 0, 0]} fill="url(#barGradient)" maxBarSize={14} />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#c7d2fe" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Improvement summary */}
      <div className="flex items-center gap-3 mt-4 p-3 bg-success-light rounded-lg text-[13px]">
        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
          <TrendingUp className="w-[15px] h-[15px] text-success" />
        </div>
        <span className="font-semibold text-green-800">
          {isUp ? "Mejora" : "Bajada"} {Math.abs(improvement).toFixed(1)}%
        </span>
        <span className="text-gray-500 text-xs">en los últimos 30 días</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create AlertBanner component**

Create `src/components/seo/alert-banner.tsx`:

```tsx
import { AlertTriangle } from "lucide-react";

interface AlertBannerProps {
  message: string;
  className?: string;
}

export function AlertBanner({ message, className }: AlertBannerProps) {
  return (
    <div className={`flex items-center gap-2 p-3 bg-danger-light border border-red-200 rounded-lg text-[12.5px] font-medium text-red-800 ${className || ""}`}>
      <AlertTriangle className="w-4 h-4 text-red-700 flex-shrink-0" />
      {message}
    </div>
  );
}
```

- [ ] **Step 5: Create CompetitorPanel component**

Create `src/components/seo/competitor-panel.tsx`:

```tsx
import { Clock } from "lucide-react";
import { AlertBanner } from "./alert-banner";
import type { CompetitorData } from "@/types/seo";

interface CompetitorPanelProps {
  competitors: CompetitorData[];
}

const COMPETITOR_COLORS = [
  "bg-gradient-to-r from-brand-500 to-brand-400",
  "bg-gradient-to-r from-red-500 to-red-400",
  "bg-gradient-to-r from-amber-500 to-amber-400",
  "bg-gradient-to-r from-violet-500 to-violet-400",
  "bg-gradient-to-r from-pink-500 to-pink-400",
];

export function CompetitorPanel({ competitors }: CompetitorPanelProps) {
  const alertComp = competitors.find((c) => c.highlightChange);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <Clock className="w-[18px] h-[18px] text-brand-500" />
        Competidores
        <span className="text-xs text-gray-400 font-normal ml-auto">Posición media</span>
      </h3>

      <div className="flex flex-col gap-0.5">
        {competitors.map((c, i) => (
          <div
            key={c.domain}
            className={`flex items-center gap-2.5 py-2.5 px-2 rounded-lg ${
              c.rank === 1 ? "bg-brand-50" : ""
            }`}
          >
            <span className={`font-bold text-lg w-9 text-center ${c.rank === 1 ? "text-brand-600" : "text-gray-700"}`}>
              {c.rank}
            </span>
            <span className={`flex-1 text-[13px] ${c.rank === 1 ? "font-semibold" : ""}`}>
              {c.domain}
            </span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${COMPETITOR_COLORS[i] || "bg-gray-400"}`}
                style={{ width: `${Math.max((c.avgPosition / 15) * 100, 10)}%` }}
              />
            </div>
            <strong className={`text-[15px] w-9 text-right ${c.rank === 1 ? "text-brand-600" : ""}`}>
              {c.avgPosition}
            </strong>
          </div>
        ))}
      </div>

      {alertComp && (
        <AlertBanner
          message={`${alertComp.domain} subió 3 posiciones esta semana`}
          className="mt-4"
        />
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create KeywordsTable component**

Create `src/components/seo/keywords-table.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { KeywordData } from "@/types/seo";

interface KeywordsTableProps {
  keywords: KeywordData[];
}

const DIFFICULTY_CLASSES: Record<string, string> = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  hard: "bg-red-100 text-red-800",
};

export function KeywordsTable({ keywords }: KeywordsTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const perPage = 5;

  const filtered = keywords.filter((k) =>
    k.keyword.toLowerCase().includes(search.toLowerCase())
  );
  const total = filtered.length;
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
          <Search className="w-[18px] h-[18px] text-brand-500" />
          Keywords Monitorizadas
          <span className="text-xs text-gray-400 font-normal">{total} activas</span>
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
            <input
              placeholder="Buscar keyword..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg w-[180px] outline-none focus:border-brand-500"
            />
          </div>
          <button className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg bg-white font-medium hover:bg-gray-50">
            <SlidersHorizontal className="w-3 h-3" /> Filtros
          </button>
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="border-b-2 border-gray-200 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            <th className="text-left p-2.5">Keyword</th>
            <th className="text-right p-2.5">Posición</th>
            <th className="text-right p-2.5">Cambio</th>
            <th className="text-right p-2.5">Volumen</th>
            <th className="text-right p-2.5">Dificultad</th>
            <th className="text-right p-2.5 w-[100px]">Tendencia</th>
          </tr>
        </thead>
        <tbody>
          {paged.map((kw) => (
            <tr key={kw.id} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="p-2.5 font-medium text-gray-900">
                {kw.keyword}
                {kw.isTop3 && <span className="text-[11px] text-green-600 ml-1.5">🟢 top 3</span>}
                {kw.isFalling && <span className="text-[11px] text-red-600 ml-1.5">⚠️ bajando</span>}
              </td>
              <td className={`p-2.5 text-right font-bold ${kw.position <= 10 ? "text-green-600" : kw.position > 15 ? "text-red-600" : ""}`}>
                #{kw.position}
              </td>
              <td className={`p-2.5 text-right font-medium ${kw.change > 0 ? "text-green-600" : kw.change < 0 ? "text-red-600" : "text-gray-400"}`}>
                <span className="inline-flex items-center gap-0.5">
                  {kw.change > 0 ? <ArrowUp className="w-3 h-3" /> : kw.change < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {kw.change > 0 ? "+" : ""}{kw.change}
                </span>
              </td>
              <td className="p-2.5 text-right">{kw.volume >= 1000 ? `${(kw.volume / 1000).toFixed(1)}K` : kw.volume}</td>
              <td className="p-2.5 text-right">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[11.5px] font-medium ${DIFFICULTY_CLASSES[kw.difficulty]}`}>
                  {kw.difficulty === "easy" ? "Bajo" : kw.difficulty === "medium" ? "Medio" : "Alto"}
                </span>
              </td>
              <td className="p-2.5">
                <Sparkline values={kw.history} trend={kw.change >= 0 ? "up" : "down"} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
        <span>Mostrando {paged.length} de {total} keywords</span>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`px-2 py-1 rounded-md border text-[11px] font-medium ${
                i === page
                  ? "border-brand-500 bg-brand-50 text-brand-600"
                  : "border-gray-200 bg-white hover:bg-gray-50"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Inline mini sparkline SVG */
function Sparkline({ values, trend }: { values: number[]; trend: "up" | "down" }) {
  const w = 56, h = 20, pad = 2;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * (w - pad * 2) + pad},${h - pad - ((v - min) / range) * (h - pad * 2)}`)
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block">
      <polyline points={points} fill="none" stroke={trend === "up" ? "#059669" : "#dc2626"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
```

- [ ] **Step 7: Create Dashboard page**

Create `src/app/dashboard/page.tsx`:

```tsx
import { getDashboardData } from "@/lib/mock-data";
import { KPIGrid } from "@/components/seo/kpi-grid";
import { RankingChart } from "@/components/seo/ranking-chart";
import { CompetitorPanel } from "@/components/seo/competitor-panel";
import { KeywordsTable } from "@/components/seo/keywords-table";

export default function DashboardPage() {
  const data = getDashboardData();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-5">
        <span className="text-brand-600 inline-flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Demo Company
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span>{data.websiteUrl}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">Dashboard SEO</span>
      </div>

      {/* KPI Cards */}
      <KPIGrid kpis={data.kpis} />

      {/* Charts + Competitors */}
      <div className="grid grid-cols-[2fr_1fr] gap-4 mb-6">
        <RankingChart data={data.rankingHistory} />
        <CompetitorPanel competitors={data.competitors} />
      </div>

      {/* Keywords Table */}
      <KeywordsTable keywords={data.keywords} />
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/seo/ src/app/dashboard/
git commit -m "feat: build SEO Dashboard page with KPIs, chart, competitors, and keywords table

- KPICard and KPIGrid with trend indicators and formatting
- RankingChart with Recharts bar chart and improvement summary
- CompetitorPanel with ranked list and alert banner
- KeywordsTable with search, difficulty badges, sparklines, and pagination
- Dashboard page composing all widgets with breadcrumb"
```

---

### Task 5: Build Websites Panel Page

**Files:**
- Create: `src/components/websites/quick-stats.tsx`
- Create: `src/components/websites/website-card.tsx`
- Create: `src/components/websites/website-grid.tsx`
- Create: `src/components/websites/add-website-modal.tsx`
- Create: `src/app/websites/page.tsx`

- [ ] **Step 1: Create QuickStats component**

Create `src/components/websites/quick-stats.tsx`:

```tsx
import { Globe, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import type { WebsiteStats } from "@/types/seo";

interface QuickStatsProps {
  stats: WebsiteStats;
}

const STAT_ITEMS = [
  { key: "total" as const, label: "Websites activos", icon: Globe, bg: "bg-brand-50", color: "text-brand-600" },
  { key: "connected" as const, label: "Conectados", icon: CheckCircle, bg: "bg-green-50", color: "text-green-600" },
  { key: "noAccess" as const, label: "Sin acceso", icon: AlertTriangle, bg: "bg-amber-50", color: "text-amber-600" },
  { key: "error" as const, label: "Error", icon: XCircle, bg: "bg-red-50", color: "text-red-600" },
];

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      {STAT_ITEMS.map(({ key, label, icon: Icon, bg, color }) => (
        <div key={key} className="bg-white border border-gray-200 rounded-[10px] p-3.5 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${bg}`}>
            <Icon className={`w-[18px] h-[18px] ${color}`} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{stats[key]}</p>
            <p className="text-xs text-gray-400 font-medium">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create WebsiteCard component**

Create `src/components/websites/website-card.tsx`:

```tsx
import { MoreVertical, Globe, Server, Terminal, Layout, ExternalLink } from "lucide-react";
import type { WebsiteData, ConnectionStatus, AccessType } from "@/types/seo";

interface WebsiteCardProps {
  website: WebsiteData;
}

const STATUS_CONFIG: Record<ConnectionStatus, { dot: string; label: string }> = {
  connected: { dot: "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]", label: "Conectado" },
  "no-access": { dot: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]", label: "Sin acceso" },
  error: { dot: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]", label: "Error" },
};

const ACCESS_ICONS: Record<AccessType, { icon: React.ReactNode; label: string; className: string }> = {
  wordpress: { icon: <Globe className="w-2.5 h-2.5" />, label: "WordPress", className: "bg-brand-50 text-brand-600" },
  ftp: { icon: <Server className="w-2.5 h-2.5" />, label: "FTP", className: "bg-gray-100 text-gray-600" },
  ssh: { icon: <Terminal className="w-2.5 h-2.5" />, label: "SSH", className: "bg-gray-100 text-gray-600" },
  cpanel: { icon: <Layout className="w-2.5 h-2.5" />, label: "cPanel", className: "bg-amber-50 text-amber-700" },
};

export function WebsiteCard({ website }: WebsiteCardProps) {
  const status = STATUS_CONFIG[website.status];
  const isError = website.status === "error";
  const isNoAccess = website.status === "no-access";

  return (
    <div className={`bg-white border rounded-xl p-5 transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] ${isError ? "border-red-200" : "border-gray-200"}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5 font-bold text-[15px] text-gray-900">
          <span className={`w-2 h-2 rounded-full ${status.dot}`} />
          {website.domain}
        </div>
        <button className="p-0.5 text-gray-400 hover:text-gray-600">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Access badges */}
      <div className="flex flex-wrap gap-2 mb-3.5">
        {website.accessTypes.map((type) => {
          const acc = ACCESS_ICONS[type];
          return (
            <span key={type} className={`inline-flex items-center gap-1 text-[11.5px] px-2 py-0.5 rounded-md font-medium ${acc.className}`}>
              {acc.icon} {acc.label}
            </span>
          );
        })}
      </div>

      {/* Error/No-access banner */}
      {(isError || isNoAccess) && website.errorMessage && (
        <div className={`p-2.5 rounded-lg mb-3.5 text-xs flex items-center gap-2 ${
          isError ? "bg-red-50 border border-red-200 text-red-800" : "bg-amber-50 border border-amber-200 text-amber-800"
        }`}>
          <AlertIcon type={website.status} />
          {website.errorMessage}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <StatBox label="Keywords" value={website.keywords} />
        {website.status === "connected" ? (
          <>
            <StatBox label="Artículos" value={website.articles} />
            <StatBox label="Posición Media" value={website.avgPosition} valueClass="text-green-600" />
            <StatBox label="Último Audit" value={website.lastAudit} isText />
          </>
        ) : isNoAccess ? (
          <StatBox label="Último OK" value={website.lastAudit} valueClass="text-amber-600" isText />
        ) : (
          <StatBox label="Reintentos" value="3/5" valueClass="text-red-600" isText />
        )}
      </div>

      {/* Actions */}
      {website.status === "connected" ? (
        <div className="flex gap-2">
          <ActionBtn icon={<ExternalLink className="w-3 h-3" />}>Dashboard</ActionBtn>
          <ActionBtn>Editar</ActionBtn>
          <ActionBtn>Test</ActionBtn>
          <ActionBtn danger>Eliminar</ActionBtn>
        </div>
      ) : isNoAccess ? (
        <div className="flex gap-2">
          <ActionBtn className="bg-amber-50 border-amber-200 text-amber-700 font-semibold w-full">Actualizar acceso</ActionBtn>
          <ActionBtn danger>Eliminar</ActionBtn>
        </div>
      ) : (
        <div className="flex gap-2">
          <ActionBtn className="bg-red-50 border-red-200 text-red-700 w-full">Reintentar</ActionBtn>
          <ActionBtn>Editar</ActionBtn>
          <ActionBtn danger>Eliminar</ActionBtn>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, valueClass, isText }: { label: string; value: string | number; valueClass?: string; isText?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5">
      <p className="text-[11px] text-gray-400 font-medium">{label}</p>
      <p className={`font-bold mt-0.5 ${isText ? "text-[13px]" : "text-lg"} ${valueClass || "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function ActionBtn({ children, icon, danger, className }: { children: React.ReactNode; icon?: React.ReactNode; danger?: boolean; className?: string }) {
  return (
    <button className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium border transition-colors ${
      danger
        ? "border-gray-200 bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
    } ${className || ""}`}>
      {icon}{children}
    </button>
  );
}

function AlertIcon({ type }: { type: ConnectionStatus }) {
  if (type === "error") return <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />;
  if (type === "no-access") return <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />;
  return null;
}

// Need to import AlertTriangle
import { AlertTriangle, XCircle } from "lucide-react";
```

Wait — the import for `AlertTriangle` and `XCircle` is duplicated. Let me fix that. The `lucide-react` imports at the top already cover them. The final file is correct without the duplicate import line. The `AlertIcon` function references `XCircle` and `AlertTriangle` from the top-level imports. Let me remove the duplicate import statement at the bottom.

- [ ] **Step 3: The file above has a duplication issue. Fix by removing the last line.** The imports at the top cover `AlertTriangle` and `XCircle`. The `AlertIcon` function references them correctly.

The final `src/components/websites/website-card.tsx` is as above **without** the duplicate `import { AlertTriangle, XCircle } from "lucide-react";` at the bottom.

- [ ] **Step 4: Create WebsiteGrid component**

Create `src/components/websites/website-grid.tsx`:

```tsx
import { Plus } from "lucide-react";
import { WebsiteCard } from "./website-card";
import type { WebsiteData } from "@/types/seo";

interface WebsiteGridProps {
  websites: WebsiteData[];
}

export function WebsiteGrid({ websites }: WebsiteGridProps) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
      {websites.map((w) => (
        <WebsiteCard key={w.id} website={w} />
      ))}
      {/* Empty add card */}
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center min-h-[260px]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Plus className="w-[22px] h-[22px] text-gray-400" />
          </div>
          <p className="font-semibold text-gray-500">Añadir nuevo website</p>
          <p className="text-xs text-gray-400 mt-1">WordPress, FTP, SSH, cPanel...</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create AddWebsiteModal component**

Create `src/components/websites/add-website-modal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { X, Globe, Server, Terminal, Layout, CheckCircle } from "lucide-react";

interface AddWebsiteModalProps {
  open: boolean;
  onClose: () => void;
}

type AccessTab = "wordpress" | "ftp" | "ssh" | "cpanel";

const ACCESS_TABS: { key: AccessTab; label: string; icon: React.ReactNode }[] = [
  { key: "wordpress", label: "WordPress", icon: <Globe className="w-3.5 h-3.5" /> },
  { key: "ftp", label: "FTP", icon: <Server className="w-3.5 h-3.5" /> },
  { key: "ssh", label: "SSH", icon: <Terminal className="w-3.5 h-3.5" /> },
  { key: "cpanel", label: "cPanel", icon: <Layout className="w-3.5 h-3.5" /> },
];

export function AddWebsiteModal({ open, onClose }: AddWebsiteModalProps) {
  const [activeTab, setActiveTab] = useState<AccessTab>("wordpress");
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[540px] max-h-[80vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-[17px] font-bold text-gray-900">Añadir Website</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Domain */}
          <div className="mb-4">
            <label className="block text-[12.5px] font-semibold text-gray-700 mb-1.5">Dominio</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-brand-500 focus:ring-[3px] focus:ring-brand-100" placeholder="https://ejemplo.com" />
          </div>

          {/* Access type tabs */}
          <label className="block text-[12.5px] font-semibold text-gray-700 mb-2">Tipo de acceso</label>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-[10px] mb-4">
            {ACCESS_TABS.map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setTestResult(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[7px] text-[12.5px] font-medium transition-colors ${
                  activeTab === key ? "bg-white text-brand-600 font-semibold shadow-sm" : "text-gray-500"
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Dynamic fields */}
          {activeTab === "wordpress" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1">Usuario</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-brand-500" placeholder="admin" />
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1">Contraseña</label>
                  <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-brand-500" placeholder="••••••••" />
                </div>
              </div>
              <div>
                <label className="block text-[12.5px] font-semibold text-gray-700 mb-1">URL del panel</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none focus:border-brand-500" placeholder="https://ejemplo.com/wp-admin" />
              </div>
            </div>
          )}

          {activeTab === "ftp" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1">Host</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none" placeholder="ftp.ejemplo.com" />
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1">Puerto</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none" placeholder="21" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1">Usuario</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none" />
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1">Contraseña</label>
                  <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none" />
                </div>
              </div>
            </div>
          )}

          {(activeTab === "ssh" || activeTab === "cpanel") && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1">Host / IP</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none" placeholder="192.168.1.1" />
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1">Puerto</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none" placeholder={activeTab === "ssh" ? "22" : "2083"} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1">Usuario</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none" />
                </div>
                <div>
                  <label className="block text-[12.5px] font-semibold text-gray-700 mb-1">Contraseña</label>
                  <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px] outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* Test connection result */}
          {testResult && (
            <div className={`mt-4 p-2.5 rounded-lg text-[12.5px] font-medium flex items-center gap-2 ${
              testResult === "ok" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {testResult === "ok" ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              {testResult === "ok" ? "Conexión exitosa — WordPress 6.5 detectado" : "Error de conexión — verifica las credenciales"}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-200">
          <button onClick={() => setTestResult(testResult === "ok" ? "fail" : "ok")} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
            Test de Conexión
          </button>
          <button className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700">
            Guardar Website
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create Websites page**

Create `src/app/websites/page.tsx`:

```tsx
import { getWebsites, getWebsiteStats } from "@/lib/mock-data";
import { QuickStats } from "@/components/websites/quick-stats";
import { WebsiteGrid } from "@/components/websites/website-grid";

export default function WebsitesPage() {
  const stats = getWebsiteStats();
  const websites = getWebsites();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-5">
        <span className="text-brand-600 inline-flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Demo Company
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">Websites</span>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between mb-5">
        <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          Gestión de Websites
        </h1>
        <button className="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-brand-700">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Añadir Website
        </button>
      </div>

      {/* Stats + Grid */}
      <QuickStats stats={stats} />
      <WebsiteGrid websites={websites} />
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/websites/ src/app/websites/
git commit -m "feat: build Websites panel with cards, quick stats, and add modal

- QuickStats bar: total, connected, no-access, error
- WebsiteCard with 3 connection states (connected, no-access, error)
- Access type badges (WordPress, FTP, SSH, cPanel)
- AddWebsiteModal with dynamic fields per access type and test connection
- WebsiteGrid with responsive card layout and 'add new' placeholder"
```

---

### Task 6: Build Articles Panel Page

**Files:**
- Create: `src/components/articles/seo-scores.tsx`
- Create: `src/components/articles/article-row.tsx`
- Create: `src/components/articles/article-list.tsx`
- Create: `src/components/articles/article-calendar.tsx`
- Create: `src/components/articles/article-preview.tsx`
- Create: `src/app/articles/page.tsx`

- [ ] **Step 1: Create SEOScores component**

Create `src/components/articles/seo-scores.tsx`:

```tsx
import type { SEOScores } from "@/types/seo";

interface SEOScoresProps {
  scores: SEOScores;
}

const SCORE_ITEMS: { key: keyof SEOScores; label: string }[] = [
  { key: "keywords", label: "Keywords" },
  { key: "readability", label: "Legibilidad" },
  { key: "structure", label: "Estructura" },
  { key: "originality", label: "Originalidad" },
];

function scoreColor(v: number): string {
  if (v >= 80) return "bg-green-500";
  if (v >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function scoreTextColor(v: number): string {
  if (v >= 80) return "text-green-600";
  if (v >= 60) return "text-amber-600";
  return "text-red-600";
}

export function SEOScores({ scores }: SEOScoresProps) {
  return (
    <div className="mt-3.5">
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Puntuación SEO del borrador</p>
      <div className="space-y-2.5">
        {SCORE_ITEMS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2.5">
            <span className="text-[10.5px] text-gray-400 font-medium w-20 flex justify-between">
              {label} <span className={scoreTextColor(scores[key])}>{scores[key]}%</span>
            </span>
            <div className="flex-1 h-[5px] bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${scoreColor(scores[key])}`} style={{ width: `${scores[key]}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ArticleRow component**

Create `src/components/articles/article-row.tsx`:

```tsx
import { Edit, Check, Trash2, Play, Eye } from "lucide-react";
import type { ArticleData } from "@/types/seo";

interface ArticleRowProps {
  article: ArticleData;
}

const STATUS_STYLES = {
  published: { dot: "bg-green-500", label: "Publicado" },
  draft: { dot: "bg-amber-500", label: "Borrador" },
  scheduled: { dot: "bg-brand-500", label: "Programado" },
  generating: { dot: "bg-cyan-500 animate-pulse", label: "Generando" },
};

export function ArticleRow({ article }: ArticleRowProps) {
  const s = STATUS_STYLES[article.status];

  return (
    <div className={`flex items-center gap-3.5 py-3.5 border-b border-gray-100 ${article.status === "generating" ? "bg-cyan-50/50 -mx-5 px-5 rounded-lg" : ""}`}>
      {/* Status dot */}
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[13.5px] text-gray-900 truncate flex items-center gap-2">
          {article.title}
          {article.aiModel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-gradient-to-r from-brand-50 to-purple-50 text-brand-600 border border-brand-200">
              {article.status === "generating" ? "Generando..." : "IA"}
            </span>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
          {article.aiModel === "claude" ? "Claude" : article.aiModel === "deepseek" ? "DeepSeek" : ""}
          {article.aiModel && "·"} {article.websiteUrl}
          {article.status === "generating" && (
            <span className="text-cyan-500 font-medium">{article.progress}% completado</span>
          )}
          {article.status === "draft" && article.editedAt && <span>Editado {article.editedAt}</span>}
          {article.status === "scheduled" && article.scheduledAt && (
            <span className="text-brand-500 font-medium">Publicación: {article.scheduledAt}</span>
          )}
          {article.status === "published" && article.publishedAt && <span>Publicado el {article.publishedAt}</span>}
        </p>
        {/* Keywords */}
        {article.keywords.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {article.keywords.map((kw) => (
              <span key={kw} className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{kw}</span>
            ))}
          </div>
        )}
      </div>

      {/* Progress bar for generating */}
      {article.status === "generating" && article.progress != null && (
        <div className="w-[100px] h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-400 to-green-500 rounded-full" style={{ width: `${article.progress}%` }} />
        </div>
      )}

      {/* Performance for published */}
      {article.status === "published" && (
        <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-shrink-0">
          {article.position != null && (
            <span className="inline-flex items-center gap-0.5">
              {article.position <= 10 ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              )}
              #{article.position}
            </span>
          )}
          {article.views != null && (
            <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" />{article.views >= 1000 ? `${(article.views / 1000).toFixed(1)}K` : article.views}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-1.5 flex-shrink-0">
        {article.status === "draft" && (
          <>
            <IconBtn title="Editar"><Edit className="w-3.5 h-3.5" /></IconBtn>
            <IconBtn title="Publicar"><Check className="w-3.5 h-3.5 text-green-600" /></IconBtn>
            <IconBtn title="Eliminar"><Trash2 className="w-3.5 h-3.5 text-red-600" /></IconBtn>
          </>
        )}
        {article.status === "scheduled" && (
          <IconBtn title="Adelantar"><Play className="w-3.5 h-3.5 text-brand-600" /></IconBtn>
        )}
        {article.status === "published" && (
          <IconBtn title="Ver"><Eye className="w-3.5 h-3.5" /></IconBtn>
        )}
      </div>
    </div>
  );
}

function IconBtn({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <button title={title} className="w-8 h-8 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors">
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Create ArticleList component**

Create `src/components/articles/article-list.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ArticleRow } from "./article-row";
import type { ArticleData, ArticleStatus } from "@/types/seo";

interface ArticleListProps {
  articles: ArticleData[];
}

const TABS: { key: ArticleStatus | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "published", label: "Publicados" },
  { key: "draft", label: "Borradores" },
  { key: "scheduled", label: "Programados" },
];

export function ArticleList({ articles }: ArticleListProps) {
  const [tab, setTab] = useState<ArticleStatus | "all">("all");

  const filtered = tab === "all" ? articles : articles.filter((a) => a.status === tab);
  const counts = TABS.reduce((acc, t) => {
    acc[t.key] = t.key === "all" ? articles.length : articles.filter((a) => a.status === t.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      {/* Tabs */}
      <div className="flex border-b-2 border-gray-200 -mx-5 px-5 mb-0">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-[13.5px] font-medium border-b-2 -mb-[2px] transition-colors flex items-center gap-1.5 ${
              tab === key ? "text-brand-600 border-brand-600" : "text-gray-500 border-transparent"
            }`}
          >
            {label}
            <span className={`rounded-full px-1.5 py-0 text-[11px] font-semibold ${
              tab === key ? "bg-brand-50 text-brand-600" : "bg-gray-100 text-gray-500"
            }`}>{counts[key]}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="divide-y divide-gray-100 -mx-5 px-5">
        {filtered.map((article) => (
          <ArticleRow key={article.id} article={article} />
        ))}
      </div>

      {filtered.length > 5 && (
        <div className="mt-3 text-center">
          <button className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            Ver todos los artículos →
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create ArticleCalendar component**

Create `src/components/articles/article-calendar.tsx`:

```tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface ArticleCalendarProps {
  articleDates: string[]; // ISO date strings with articles
}

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function ArticleCalendar({ articleDates }: ArticleCalendarProps) {
  // Static mock: June 2026 calendar
  const today = 10;
  const days = [
    26, 27, 28, 29, 30, 1, 2,    // week 1 (26-30 May, 1-2 Jun)
    3, 4, 5, 6, 7, 8, 9,         // week 2
    10, 11, 12, 13, 14, 15, 16,  // week 3
    17, 18, 19, 20, 21, 22, 23,  // week 4
  ];

  const hasArticle = [2, 4, 6, 8, 11, 12, 16, 18, 21]; // days with dots

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Calendario de Publicaciones
        <span className="text-xs text-gray-400 font-normal ml-auto">Junio 2026</span>
      </h3>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center"><ChevronLeft className="w-3 h-3" /></button>
        <span className="font-semibold text-[13px]">Junio 2026</span>
        <button className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center"><ChevronRight className="w-3 h-3" /></button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
        {DAYS.map((d) => (
          <div key={d} className="text-[10.5px] font-semibold text-gray-400 uppercase py-1">{d}</div>
        ))}
        {days.map((d, i) => {
          const isOtherMonth = i < 5;
          const isToday = d === today && !isOtherMonth;
          const hasArt = hasArticle.includes(d) && !isOtherMonth;
          return (
            <div
              key={i}
              className={`py-2 rounded-md cursor-pointer font-medium text-gray-700 min-h-[40px] relative ${
                isOtherMonth ? "text-gray-300" : ""
              } ${isToday ? "bg-brand-50 text-brand-600 font-bold" : ""} ${
                !isOtherMonth && !isToday ? "hover:bg-gray-100" : ""
              } ${hasArt && !isToday ? "bg-brand-50/50 text-brand-600 font-bold" : ""}`}
            >
              {d}
              {hasArt && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-500" />}
            </div>
          );
        })}
      </div>

      {/* Next publication */}
      <div className="mt-3 p-2.5 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Próxima publicación</p>
            <p className="font-semibold text-[13px] text-gray-900">12 Jun — Tendencias SEO Ecommerce</p>
          </div>
          <span className="text-[11px] text-brand-500 font-medium">3 artículos esta semana</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create ArticlePreview component**

Create `src/components/articles/article-preview.tsx`:

```tsx
import { SEOScores } from "./seo-scores";
import type { ArticleData } from "@/types/seo";

interface ArticlePreviewProps {
  article: ArticleData;
}

export function ArticlePreview({ article }: ArticlePreviewProps) {
  if (!article.metaDescription) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Selecciona un artículo para previsualizar</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex-1">
      <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Vista Previa
        <span className="text-[11px] text-gray-400 font-normal ml-auto">Borrador</span>
      </h3>

      {/* Mock content */}
      <div className="border border-dashed border-gray-300 rounded-[10px] p-5 bg-gray-50/50">
        <h2 className="text-xl font-bold text-gray-900 mb-1">{article.title}</h2>
        <p className="text-xs text-gray-400 mb-4">{article.slug}</p>
        <div className="p-2.5 bg-gray-50 rounded-lg border-l-[3px] border-brand-500 mb-4 text-[13px] text-gray-600">
          <strong>Meta:</strong> {article.metaDescription}
        </div>
        {article.content?.h2Sections.map((section, i) => (
          <div key={i}>
            <h3 className="text-[17px] font-bold text-gray-900 mt-4 mb-2">{section.title}</h3>
            {section.paragraphs.map((p, j) => (
              <p key={j} className="text-[13px] text-gray-600 leading-relaxed mb-2.5">{p}</p>
            ))}
          </div>
        ))}
      </div>

      {/* Scores */}
      {article.seoScores && <SEOScores scores={article.seoScores} />}

      {/* Actions */}
      {article.seoScores && (
        <div className="flex gap-2 mt-3.5">
          <button className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="5 12 10 17 19 8"/></svg>
            Publicar Ahora
          </button>
          <button className="flex-1 py-2.5 border border-gray-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-gray-50">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
            Programar
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create Articles page**

Create `src/app/articles/page.tsx`:

```tsx
import { getArticles } from "@/lib/mock-data";
import { ArticleList } from "@/components/articles/article-list";
import { ArticleCalendar } from "@/components/articles/article-calendar";
import { ArticlePreview } from "@/components/articles/article-preview";

export default function ArticlesPage() {
  const articles = getArticles();
  const draftArticle = articles.find((a) => a.status === "draft");

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-5">
        <span className="text-brand-600 inline-flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Demo Company
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span>sitioweb.com</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">Artículos</span>
      </div>

      {/* Page header + stats */}
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
          Artículos Automáticos
        </h1>
        <div className="flex gap-2">
          <button className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-gray-50">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Ayuda IA
          </button>
          <button className="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-brand-700">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Generar Artículo
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { value: 27, label: "Artículos generados", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2 14 8 20 8", bg: "bg-brand-50", color: "text-brand-600" },
          { value: 24, label: "Publicados", icon: "M20 6 9 17 4 12", bg: "bg-green-50", color: "text-green-600" },
        ].map(({ value, label, icon, bg, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-[10px] p-3.5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${bg}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={color}><path d={icon}/></svg>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 font-medium">{label}</p>
            </div>
          </div>
        ))}
        {[
          { value: 2, label: "Borradores", bg: "bg-amber-50", color: "text-amber-600", icon: "M12 6v6l4 2" },
          { value: 3, label: "Programados", bg: "bg-purple-50", color: "text-purple-600", icon: "M16 2v4 M8 2v4 M3 10h18" },
        ].map(({ value, label, bg, color, icon }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-[10px] p-3.5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${bg}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={color}><path d={icon}/></svg>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-2 gap-4">
        <ArticleList articles={articles} />
        <div className="flex flex-col gap-4">
          <ArticleCalendar articleDates={[]} />
          {draftArticle && <ArticlePreview article={draftArticle} />}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add src/components/articles/ src/app/articles/
git commit -m "feat: build Articles panel with list, calendar, and preview

- ArticleRow with 4 status variants (generating, draft, scheduled, published)
- ArticleList with tab filtering and counts
- ArticleCalendar with monthly grid and publication dots
- ArticlePreview with mock content, meta description, and SEO scores
- SEOScores component with color-coded progress bars"
```

---

### Task 7: Build Reports Panel Page

**Files:**
- Create: `src/components/reports/pdf-preview.tsx`
- Create: `src/components/reports/report-card.tsx`
- Create: `src/components/reports/share-links.tsx`
- Create: `src/components/reports/branding-settings.tsx`
- Create: `src/app/reports/page.tsx`

- [ ] **Step 1: Create PdfPreview component**

Create `src/components/reports/pdf-preview.tsx`:

```tsx
import type { ReportData } from "@/types/seo";

interface PdfPreviewProps {
  report: ReportData;
}

export function PdfPreview({ report }: PdfPreviewProps) {
  const isDraft = report.status === "draft";
  const headerGradient = report.colorScheme === "green"
    ? "from-emerald-900 to-emerald-700"
    : "from-indigo-950 to-indigo-800";

  if (isDraft) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <p className="font-semibold text-gray-500 text-[13px]">Reporte rápido</p>
          <p className="text-[11px] text-gray-400 mt-1">Personaliza fechas y métricas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[280px] mx-auto bg-white rounded shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-br ${headerGradient} px-5 py-4 text-white`}>
        <p className="text-[11px] opacity-70 uppercase tracking-wide">Demo Company</p>
        <p className="text-[16px] font-bold mt-1">{report.name}</p>
        <p className="text-[10px] opacity-60 mt-0.5">{report.period} · {report.websiteUrl}</p>
      </div>
      {/* Body */}
      <div className="px-5 py-3">
        {Object.entries(report.metrics).map(([label, value]) => (
          <div key={label} className="flex justify-between py-1.5 border-b border-gray-100 text-[10px]">
            <span className="text-gray-500">{label}</span>
            <span className="font-bold text-gray-900">{value}</span>
          </div>
        ))}
        {/* Mini chart */}
        <div className="flex items-end gap-0.5 h-10 my-2.5 px-1">
          {[40, 55, 48, 65, 60, 72, 68, 80, 75, 85, 82, 90].map((h, i) => (
            <div key={i} className="flex-1 bg-gradient-to-t from-brand-500 to-brand-200 rounded-[2px_2px_0_0]" style={{ height: `${h}%` }} />
          ))}
        </div>
        {report.status === "scheduled" && (
          <p className="text-[9px] text-gray-400 mt-1">✅ 3 keywords subieron · ⚠️ 1 keyword bajó</p>
        )}
      </div>
      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-gray-100 text-[8px] text-gray-400 text-center">
        Generado por MultiSEO · 10/06/2026
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create ReportCard component**

Create `src/components/reports/report-card.tsx`:

```tsx
import { Download, Share2, Calendar, CheckCircle } from "lucide-react";
import { PdfPreview } from "./pdf-preview";
import type { ReportData } from "@/types/seo";

interface ReportCardProps {
  report: ReportData;
}

const STATUS_BADGES = {
  scheduled: { className: "bg-brand-50 text-brand-600", label: "Programado", icon: <Calendar className="w-2.5 h-2.5" /> },
  sent: { className: "bg-green-50 text-green-700", label: "Enviado", icon: <CheckCircle className="w-2.5 h-2.5" /> },
  draft: { className: "bg-amber-50 text-amber-700", label: "Borrador", icon: null },
};

const FREQ_BADGES = {
  monthly: "bg-purple-50 text-purple-700",
  weekly: "bg-brand-50 text-brand-600",
  custom: "bg-gray-100 text-gray-500",
};

export function ReportCard({ report }: ReportCardProps) {
  const statusBadge = STATUS_BADGES[report.status];
  const freqClass = FREQ_BADGES[report.frequency];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      {/* PDF Preview */}
      <div className="bg-gray-50 p-6 border-b border-gray-200 min-h-[200px] flex items-center">
        <PdfPreview report={report} />
      </div>

      {/* Info */}
      <div className="p-5">
        <h3 className="font-bold text-[15px] text-gray-900 flex items-center gap-2">{report.name}</h3>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium ${statusBadge.className}`}>
            {statusBadge.icon}{statusBadge.label}
          </span>
          <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium ${freqClass}`}>
            {report.frequency === "weekly" ? "Semanal" : report.frequency === "monthly" ? "Mensual" : "Personalizado"}
          </span>
        </div>

        {/* Schedule toggle (non-draft) */}
        {report.status !== "draft" && (
          <div className="flex items-center gap-3 mt-3 p-3 bg-gray-50 rounded-[10px]">
            <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${report.scheduleEnabled ? "bg-brand-500" : "bg-gray-300"}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-all ${report.scheduleEnabled ? "left-[22px]" : "left-0.5"}`} />
            </div>
            <p className="text-xs text-gray-700">Envío automático: <strong>{report.scheduleDescription}</strong></p>
          </div>
        )}

        {/* Draft wizard steps */}
        {report.status === "draft" && (
          <div className="mt-3 space-y-2">
            {["Seleccionar rango de fechas", "Elegir métricas a incluir", "Personalizar branding", "Vista previa y enviar"].map((step, i) => (
              <div key={step} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg text-[12.5px]">
                <span className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-brand-500" : "bg-gray-300"}`} />
                {step}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          {report.status === "draft" ? (
            <button className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">Configurar</button>
          ) : (
            <>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">
                <Download className="w-3 h-3" /> Descargar PDF
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50">
                <Share2 className="w-3 h-3" /> Compartir
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create ShareLinks component**

Create `src/components/reports/share-links.tsx`:

```tsx
import { Copy, X, Share2 } from "lucide-react";
import type { ReportData } from "@/types/seo";

interface ShareLinksProps {
  reports: ReportData[];
}

export function ShareLinks({ reports }: ShareLinksProps) {
  const shareable = reports.filter((r) => r.shareUrl);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <Share2 className="w-[17px] h-[17px] text-brand-500" />
        Enlaces Compartidos Activos
      </h3>

      <div className="space-y-2.5">
        {shareable.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-[13px] text-gray-900">{r.name}</p>
              <p className="text-[11px] text-gray-400">
                /report/demo/{r.id} · Expira en {r.shareExpiresIn} días
              </p>
            </div>
            <div className="flex gap-1.5">
              <button className="px-2.5 py-1.5 border border-gray-200 rounded-md text-[11px] font-medium flex items-center gap-1 hover:bg-gray-100">
                <Copy className="w-2.5 h-2.5" /> Copiar
              </button>
              <button className="px-2 py-1.5 border border-gray-200 rounded-md text-[11px] text-red-600 hover:bg-red-50">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {shareable.length > 0 && (
        <div className="flex items-center mt-3 border border-gray-200 rounded-lg overflow-hidden">
          <input
            readOnly
            value={shareable[0].shareUrl || ""}
            className="flex-1 px-3 py-2 text-xs text-gray-700 bg-gray-50 border-none outline-none"
          />
          <button className="px-3.5 py-2 bg-brand-600 text-white text-[11px] font-semibold hover:bg-brand-700">Copiar enlace</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create BrandingSettings component**

Create `src/components/reports/branding-settings.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Image, Plus } from "lucide-react";

const PRESET_COLORS = ["#4f46e5", "#059669", "#ea580c", "#dc2626", "#7c3aed"];

export function BrandingSettings() {
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [footerText, setFooterText] = useState("© 2026 Demo Company — Reporte generado por MultiSEO");

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        Personalización de Marca
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {/* Logo */}
        <div>
          <p className="text-[11px] text-gray-400 font-medium mb-1">Logo del cliente</p>
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-brand-400 transition-colors">
            <Image className="w-6 h-6 text-gray-400 mx-auto" />
            <p className="text-[11px] text-gray-400 mt-1.5">Subir logo</p>
          </div>
        </div>

        {/* Color */}
        <div>
          <p className="text-[11px] text-gray-400 font-medium mb-1">Color de marca</p>
          <div className="flex gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-md transition-transform hover:scale-110"
                style={{ backgroundColor: c, border: color === c ? "3px solid #818cf8" : "3px solid transparent" }}
              />
            ))}
            <button className="w-7 h-7 rounded-md bg-gray-200 flex items-center justify-center hover:bg-gray-300">
              <Plus className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer text */}
      <div className="mt-3.5">
        <p className="text-[11px] text-gray-400 font-medium mb-1">Texto del footer</p>
        <input
          value={footerText}
          onChange={(e) => setFooterText(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-brand-500"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create Reports page**

Create `src/app/reports/page.tsx`:

```tsx
import { getReports } from "@/lib/mock-data";
import { ReportCard } from "@/components/reports/report-card";
import { ShareLinks } from "@/components/reports/share-links";
import { BrandingSettings } from "@/components/reports/branding-settings";

export default function ReportsPage() {
  const reports = getReports();

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-5">
        <span className="text-brand-600 inline-flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Demo Company
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">Reportes</span>
      </div>

      {/* Page header */}
      <div className="flex items-start justify-between mb-5">
        <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Reportes para Clientes
        </h1>
        <button className="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-brand-700">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Generar Nuevo Reporte
        </button>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {reports.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-4">
        <ShareLinks reports={reports} />
        <BrandingSettings />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/reports/ src/app/reports/
git commit -m "feat: build Reports panel with PDF previews, scheduling, and branding

- PdfPreview with realistic PDF mockup (header, metrics, mini chart, footer)
- ReportCard with status badges, schedule toggle, and actions
- ShareLinks panel with token URLs and copy/delete actions
- BrandingSettings with logo upload, color presets, and footer text"
```

---

### Task 8: Final Polish — Verify Build and Run

**Files:**
- Check: All files exist
- Verify: Build passes

- [ ] **Step 1: Verify all files were created**

Run:
```bash
git status
```

Expected: All files listed in the file structure map are tracked.

- [ ] **Step 2: Run the dev server**

```bash
npm run dev
```

- [ ] **Step 3: Verify pages load**

Open in browser:
- http://localhost:3000 → redirects to /dashboard
- http://localhost:3000/dashboard → SEO Dashboard with KPIs, chart, competitors, keywords table
- http://localhost:3000/websites → Website cards grid with quick stats
- http://localhost:3000/articles → Article list + calendar + preview
- http://localhost:3000/reports → Report cards + share links + branding

- [ ] **Step 4: Verify build compiles cleanly**

```bash
npm run build
```

Expected: Successful build with no errors.

- [ ] **Step 5: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: final polish and build verification"
```
