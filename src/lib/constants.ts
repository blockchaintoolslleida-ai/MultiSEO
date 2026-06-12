import type { NavSectionData } from "@/types/seo";

export const APP_NAME = "MultiSEO";

export const NAV_SECTIONS: NavSectionData[] = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard SEO", href: "/dashboard", icon: "LayoutGrid" },
      { label: "GEO Tracker", href: "/geo", icon: "Bot" },
      { label: "Websites", href: "/websites", icon: "Globe" },
      { label: "Artículos", href: "/articles", icon: "FileText" },
      { label: "Rankings", href: "/rankings", icon: "TrendingUp" },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Competidores", href: "/competitors", icon: "Monitor" },
      { label: "Reportes", href: "/reports", icon: "BarChart3" },
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

// ====== Scraping & Automation delays ======

/** Min/max simulated human delay before interaction (ms). Used in serp-scraper.ts */
export const SERP_SCRAPE_DELAY_MS = { MIN: 2000, MAX: 5000 } as const;

/** Playwright navigation timeout (ms). */
export const SERP_NAVIGATION_TIMEOUT_MS = 30_000;

/** Max organic results to collect per keyword scrape. */
export const SERP_MAX_RESULTS = 10;

/** Max top competitors to extract per keyword. */
export const SERP_MAX_COMPETITORS = 5;

/** Min/max snippet text length to consider valid. */
export const SNIPPET_LENGTH = { MIN: 30, MAX: 300 } as const;

/** Max parent DOM traversal depth for snippet finding. */
export const SNIPPET_MAX_DEPTH = 5;

/** Rate-limiting delay between keyword scrapes (ms). Used in serp-scraper.ts */
export const SERP_INTER_KEYWORD_DELAY_MS = { MIN: 5000, MAX: 10000 } as const;

// ====== Lighthouse ======

/** Lighthouse child-process execution timeout (ms). */
export const LIGHTHOUSE_TIMEOUT_MS = 120_000;

/** Max stdout buffer for Lighthouse (bytes). */
export const LIGHTHOUSE_MAX_BUFFER = 10 * 1024 * 1024;

/** Max recommendations to return from an audit. */
export const LIGHTHOUSE_MAX_RECOMMENDATIONS = 5;

/** Performance score thresholds. */
export const PERF_THRESHOLDS = { EXCELLENT: 90, NEEDS_WORK: 50 } as const;

// ====== PDF Export ======

/** Playwright viewport dimensions for PDF rendering. */
export const PDF_VIEWPORT = { WIDTH: 1280, HEIGHT: 900 } as const;

/** PDF page setContent timeout (ms). */
export const PDF_SET_CONTENT_TIMEOUT_MS = 30_000;

// ====== Competitors ======

/** One week in milliseconds (used for new competitor detection). */
export const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Max competitors to compare side-by-side. */
export const SELECTION_MAX_COMPETITORS = 3;

/** Domain name truncation length for display. */
export const DOMAIN_TRUNCATE_LENGTH = 18;

/** Max recommendations to show. */
export const MAX_RECOMMENDATIONS = 10;

// ====== Position thresholds ======

/** Position ranges used across ranking/keyword components. */
export const POSITION_THRESHOLDS = {
  TOP3: 3,
  TOP10: 10,
  FALLING: 20,
} as const;

// ====== Keyword table ======

/** Max pagination buttons to display. */
export const MAX_PAGINATION_BUTTONS = 7;

/** Default items per page for tables. */
export const DEFAULT_PER_PAGE = 20;

// ====== UI ======

/** GSC OAuth popup window dimensions. */
export const GSC_POPUP_SIZE = { WIDTH: 600, HEIGHT: 700 } as const;

/** Poll interval for GSC popup close detection (ms). */
export const GSC_POPUP_POLL_MS = 500;
