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
