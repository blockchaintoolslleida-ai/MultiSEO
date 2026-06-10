# MultiSEO — Diseño del Dashboard Frontend

**Fecha:** 2026-06-10
**Alcance:** Frontend del Dashboard SEO (Next.js 14+ · TailwindCSS · shadcn/ui)
**Estado:** Diseño validado — pendiente implementación

---

## Visión General

Dashboard SaaS multiempresa para gestión SEO con 4 paneles principales. Primera fase con datos mock, modo oscuro/claro, y arquitectura de componentes atómica.

---

## Estilo Visual

| Aspecto | Decisión |
|---------|----------|
| **Paleta** | Indigo (#4f46e5 / #6366f1) como acento principal |
| **Fondo contenido** | #f5f6f8 (claro), sidebar #fafbfc |
| **Tipografía** | Inter (system-ui fallback) |
| **Iconografía** | SVG inline estilo Lucide — **cero emojis** en UI |
| **Tarjetas** | Bordes #e5e7eb, border-radius 12px, hover shadow sutil |
| **Estados** | Verde (#059669) = mejora, Rojo (#dc2626) = bajada, Ámbar (#d97706) = warning |
| **Badges** | Chips redondeados con color de fondo semántico |
| **Modo oscuro** | Pendiente de mockup (siguiente iteración) |

---

## Estructura de Componentes

```
AppShell (Server Component)
├── AppHeader
│   ├── Logo (SVG gradiente indigo)
│   ├── BreadcrumbNav
│   ├── NotificationBell (WebSocket)
│   └── UserMenu (avatar + dropdown)
├── AppSidebar
│   ├── NavSection (agrupador)
│   ├── NavItem (icono SVG + texto + badge opcional)
│   └── TenantSwitcher
└── MainContent (slot)
```

### Páginas

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/dashboard` | `SEODashboard` | KPI cards + gráfica evolución + competidores + tabla keywords |
| `/websites` | `WebsitesPanel` | Grid de tarjetas con estados, formulario modal |
| `/articles` | `ArticlesPanel` | Lista + calendario + preview con scores SEO |
| `/reports` | `ReportsPanel` | PDF mockups + programación + enlaces compartidos |

---

## Panel 1: Dashboard SEO (`/dashboard`)

**Widgets (orden vertical):**
1. **KPICardGrid** (4 tarjetas): Posición Media, Tráfico Estimado, Backlinks, Salud SEO
2. **ChartsRow** (2 columnas): Evolución de Posicionamiento (2/3) + Competidores (1/3)
3. **KeywordsTable**: Tabla completa con buscador, filtros, sparklines, paginación

**Datos mock:** `SEODashboardData` con `KPIData`, `RankingPoint[]`, `CompetitorData[]`, `KeywordData[]`

---

## Panel 2: Gestión de Websites (`/websites`)

**Quick Stats bar:** Total · Conectados · Sin acceso · Error
**WebsiteCard grid:** 6 tarjetas con 3 estados visuales:
- 🟢 Conectado: badges de acceso (WP, FTP, SSH, cPanel), métricas, 4 acciones
- 🟡 Sin acceso: banner de advertencia, botón "Actualizar acceso"
- 🔴 Error: banner de error, botón "Reintentar"

**Modal "Añadir Website":** Tabs para tipo de acceso → campos dinámicos → test de conexión

---

## Panel 3: Artículos Automáticos (`/articles`)

**Layout 2 columnas:**
- **Izquierda:** Tabs (Todos/Publicados/Borradores/Programados) + lista con 4 estados:
  - 🩵 Generando (animado con progreso)
  - 🟡 Borrador (editar/publicar/eliminar)
  - 🔵 Programado (adelantar publicación)
  - 🟢 Publicado (posición + views)
- **Derecha:** Calendario mensual (días con punto = artículo) + Vista previa del artículo
  - Scores SEO: Keywords, Legibilidad, Estructura, Originalidad (barras 0-100%)
  - Botones Publicar Ahora / Programar

---

## Panel 4: Reportes (`/reports`)

**3 tarjetas con PDF mockup:**
- Informe Mensual (cabecera indigo, KPIs, gráfica)
- Informe Semanal (cabecera verde, cambios)
- Reporte Personalizado (wizard 4 pasos)

**Toggle de programación:** Envío automático (día 1 del mes / cada lunes 08:00)
**Enlaces compartidos:** URL con token temporal + expiración
**Personalización:** Logo cliente, color marca, texto footer

---

## Modelo de Datos Mock

```typescript
interface SEODashboardData {
  kpis: KPIData;
  rankingHistory: RankingPoint[];
  competitors: CompetitorData[];
  keywords: KeywordData[];
}

interface KPIData {
  avgPosition:      { value: number; change: number; trend: 'up' | 'down' | 'flat' };
  estimatedTraffic: { value: number; change: number; trend: 'up' | 'down' | 'flat' };
  backlinks:        { value: number; change: number; trend: 'up' | 'down' | 'flat' };
  healthScore:      { value: number; change: number; trend: 'up' | 'down' | 'flat' };
}

interface RankingPoint { date: string; avgPosition: number; }
interface CompetitorData { rank: number; domain: string; avgPosition: number; trend: string; }
interface KeywordData { id: string; keyword: string; position: number; change: number; volume: number; difficulty: 'easy'|'medium'|'hard'; history: number[]; }
```

---

## Estructura de Carpetas

```
src/
├── app/
│   ├── layout.tsx              # AppShell (server)
│   ├── page.tsx                # redirect → /dashboard
│   ├── dashboard/page.tsx      # SEODashboard
│   ├── websites/page.tsx       # WebsitesPanel
│   ├── articles/page.tsx       # ArticlesPanel
│   └── reports/page.tsx        # ReportsPanel
├── components/
│   ├── ui/                     # shadcn/ui (button, card, table, badge, input, dialog...)
│   ├── layout/
│   │   ├── app-header.tsx
│   │   ├── app-sidebar.tsx
│   │   ├── nav-item.tsx
│   │   └── tenant-switcher.tsx
│   ├── seo/
│   │   ├── kpi-card.tsx
│   │   ├── kpi-grid.tsx
│   │   ├── ranking-chart.tsx
│   │   ├── competitor-panel.tsx
│   │   ├── keywords-table.tsx
│   │   └── alert-banner.tsx
│   ├── websites/
│   │   ├── website-card.tsx
│   │   ├── website-grid.tsx
│   │   ├── connection-status.tsx
│   │   └── add-website-modal.tsx
│   ├── articles/
│   │   ├── article-row.tsx
│   │   ├── article-calendar.tsx
│   │   ├── article-preview.tsx
│   │   └── seo-scores.tsx
│   └── reports/
│       ├── report-card.tsx
│       ├── pdf-preview.tsx
│       ├── share-links.tsx
│       └── branding-settings.tsx
├── hooks/
│   ├── use-seo-data.ts
│   └── use-websocket.ts
├── lib/
│   ├── mock-data.ts
│   ├── formatters.ts
│   └── constants.ts
└── types/
    └── seo.ts
```

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14+ (App Router) |
| Estilos | TailwindCSS 3.4+ |
| Componentes base | shadcn/ui |
| Gráficos | Recharts |
| Iconos | lucide-react |
| Animaciones | Framer Motion |
| WebSocket | Socket.io-client |
| PDF | @react-pdf/renderer (cliente), Puppeteer (servidor) |

---

## Próximos Pasos

1. Inicializar proyecto Next.js con shadcn/ui
2. Implementar `AppShell` (layout, sidebar, header)
3. Crear datos mock en `lib/mock-data.ts`
4. Implementar `SEODashboard` completo
5. Implementar `WebsitesPanel`
6. Implementar `ArticlesPanel`
7. Implementar `ReportsPanel`
8. Añadir modo oscuro
9. Animaciones y pulido final
