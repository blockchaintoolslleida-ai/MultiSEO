# Multi-tenancy — Diseño

**Fecha:** 2026-06-11
**Alcance:** Añadir tenants reales con tabla DB, API, contexto React, y switcher funcional
**Fuera de alcance:** Autenticación, roles por tenant, permisos, billing

---

## 1. Base de datos

### Nueva tabla: `tenants`

| Columna | Tipo SQLite | Notas |
|---------|-------------|-------|
| `id` | `TEXT PRIMARY KEY` | UUID o slug |
| `name` | `TEXT NOT NULL` | "Demo Company" |
| `slug` | `TEXT NOT NULL UNIQUE` | "demo-company" |
| `created_at` | `TEXT NOT NULL` | ISO 8601 |

### Columna nueva en `websites`

| Columna | Tipo | Notas |
|---------|------|-------|
| `tenant_id` | `TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE` | FK a tenants |

### Seed actualizado

- 2 tenants: `{ id: "demo", name: "Demo Company", slug: "demo-company" }`, `{ id: "acme", name: "Acme Corp", slug: "acme-corp" }`
- Los 5 websites existentes → `tenant_id = "demo"`
- Acme Corp se crea sin websites

---

## 2. API Routes

### Nuevo: `GET /api/tenants`

```json
{ "data": [{ "id": "demo", "name": "Demo Company", "slug": "demo-company" }, ...] }
```

### Modificados

| Endpoint | Cambio |
|----------|--------|
| `GET /api/websites?tenantId=xxx` | WHERE `tenant_id = tenantId` |
| `GET /api/websites/stats?tenantId=xxx` | Stats filtradas por `tenant_id` |
| `POST /api/websites` | Body recibe `tenantId`, se almacena en `tenant_id` |

`GET /api/websites/[id]` y `GET /api/dashboard?websiteId=xxx` no cambian (el website ya pertenece a un tenant).

---

## 3. Frontend

### TenantContext (`src/hooks/use-tenant.tsx`)

```tsx
// Provider
<TenantProvider> → fetch /api/tenants → guarda lista + activo (localStorage)

// Hook
useTenant() → { tenant, tenants, setTenant(id), loading }
```

- `tenant`: `{ id, name, slug } | null` — tenant activo
- `tenants`: `Tenant[]` — todos los tenants
- `setTenant(id)`: cambia tenant activo y persiste en localStorage
- `loading`: true mientras carga la lista

### TenantSwitcher (modificar)

- Dropdown con `Popover`/`DropdownMenu` de shadcn
- Muestra `tenant.name` actual con un `ChevronDown`
- Al abrir: lista de tenants, el activo con check
- Al seleccionar: `setTenant(id)` + cierra dropdown
- Si no hay tenant (carga): muestra "Cargando..."

### Layout (`src/app/layout.tsx`)

- Envolver children con `<TenantProvider>`

### Páginas

**Websites** — añadir `tenantId` al query string de los fetch:
```ts
const { tenant } = useTenant();
useApi(`/api/websites?tenantId=${tenant?.id}`)
useApi(`/api/websites/stats?tenantId=${tenant?.id}`)
```
Breadcrumb: `{tenant?.name}` en vez de "Demo Company".

**Dashboard** — breadcrumb: `{tenant?.name}` en vez de "Demo Company".

---

## 4. Archivos

| Archivo | Acción |
|---------|--------|
| `src/db/schema.ts` | MOD: añadir tabla `tenants`, columna `tenant_id` en `websites` |
| `src/db/migrate.ts` | MOD: añadir CREATE TABLE tenants, ALTER TABLE websites |
| `src/db/seed.ts` | MOD: insertar tenants, asignar tenant_id a websites |
| `src/app/api/tenants/route.ts` | CREATE: GET handler |
| `src/app/api/websites/route.ts` | MOD: filtrar GET por tenantId, aceptar tenantId en POST |
| `src/app/api/websites/stats/route.ts` | MOD: filtrar por tenantId |
| `src/hooks/use-tenant.tsx` | CREATE: TenantContext + Provider + hook |
| `src/components/layout/tenant-switcher.tsx` | MOD: dropdown funcional con useTenant |
| `src/app/layout.tsx` | MOD: envolver con TenantProvider |
| `src/app/websites/page.tsx` | MOD: tenantId en fetch, breadcrumb dinámico |
| `src/app/dashboard/page.tsx` | MOD: breadcrumb dinámico |

---

## 5. Lo que NO incluye

- Autenticación / login
- Roles de usuario por tenant
- CRUD de tenants (solo lectura desde API)
- Permisos o restricciones de acceso
- Migración Drizzle formal (seguimos con migrate.ts manual)
