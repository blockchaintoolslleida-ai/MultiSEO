# CLAUDE.md — MultiSEO (Multi-tenant SEO Platform)

## Arquitectura

- **Tipo:** Web app multi-tenant con AI
- **Framework:** Next.js 16.2.9 (App Router, React 19.2.4, TypeScript)
- **Base de datos:** SQLite via better-sqlite3 + Drizzle ORM
- **Auth:** Custom HMAC-SHA256 session cookies (Web Crypto API)
- **UI:** Tailwind CSS v4 + shadcn/ui + Lucide React + Framer Motion
- **Validación:** Zod 4
- **Charts:** Recharts

## Estructura de carpetas

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes (articles, auth, competitors, dashboard, geo, gsc, keywords, lighthouse, notifications, reports, telegram, tenants, websites)
│   └── [page]/             # Páginas (articles, competitors, dashboard, geo, login, rankings, reports, settings, websites)
├── components/             # Componentes React por dominio (articles, competitors, geo, layout, rankings, reports, seo, settings, ui, websites)
│   └── ui/                 # shadcn/ui primitives
├── db/                     # Drizzle schema, migrations, seed data
├── hooks/                  # use-api, use-mobile, use-sse, use-tenant, use-website-selector
├── lib/                    # Lógica de negocio: auth, api-client, deepseek, encryption, google-search-console, lighthouse, pdf-export, serp-scraper, telegram, tenant, rate-limit
│   └── geo/                # GEO tracking: providers (DeepSeek, ChatGPT, Perplexity, Google AI, Copilot), types, query-transformer
├── types/                  # TypeScript type definitions
└── proxy.ts                # Middleware: session, CSRF, tenant header
e2e/                        # Playwright E2E tests
```

## Comandos habituales

```bash
npm run dev                # Dev server (puerto 4000)
npm run build              # Build producción
npm test                   # Vitest unit tests
npm run test:e2e           # Playwright E2E tests
npm run type-check         # tsc --noEmit
npm run format             # Prettier --write
npm run lint               # ESLint
npm run test:coverage      # Vitest + coverage
```

## Dependencias clave

**Core:** next 16.2, react 19.2, typescript 5
**DB:** better-sqlite3 12, drizzle-orm 0.45, drizzle-kit 0.31
**UI:** tailwindcss 4, lucide-react 1, framer-motion, @base-ui/react, recharts 3
**Validación:** zod 4
**Integraciones:** chrome-launcher + lighthouse, GEO scraping (DeepSeek, ChatGPT, Perplexity, Google AI, Copilot)

## Variables de entorno (.env.local)

- `SESSION_SECRET` — HMAC session signing (min 16 chars)
- `ENCRYPTION_KEY` — AES-256-GCM para secrets at-rest (64 hex)
- `DEEPSEEK_API_KEY` — AI article generation + GEO scans
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` — GSC OAuth
- Opcionales: `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `GOOGLE_AI_API_KEY`, `AZURE_OPENAI_API_KEY`

## Patrones comunes

- **API client:** src/lib/api-client.ts (fetch wrapper con auth + tenant header)
- **Auth:** HMAC-signed cookies vía Web Crypto API (src/lib/auth.ts)
- **DB:** Drizzle ORM schema en src/db/schema.ts, migraciones con drizzle-kit
- **Middleware:** src/proxy.ts — verifica sesión, CSRF, inyecta tenant header
- **GEO:** Arquitectura de providers en src/lib/geo/ — cada AI platform tiene su propio fetcher
- **SEO audits:** Lighthouse via chrome-launcher (src/lib/lighthouse.ts)
- **PDF reports:** Generación automatizada con scheduling (src/lib/pdf-export.ts)
- **Rate limiting:** src/lib/rate-limit.ts
