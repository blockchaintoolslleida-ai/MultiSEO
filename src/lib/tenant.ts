/**
 * Tenant context helpers for MultiSEO API routes.
 *
 * Reads tenant identity from the x-tenant-id header set by middleware
 * (derived from the verified HMAC-signed session cookie).
 *
 * Routes MUST use getTenantId() instead of accepting tenantId from
 * query params or request body — the client cannot be trusted.
 */
import { db } from "@/db";
import { websites } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Missing tenant header error — reuse across routes. */
export const MISSING_TENANT_ERROR = Response.json(
  { error: "Unauthorized: missing tenant context" },
  { status: 401 }
);

/** Cross-tenant access denied error — reuse across routes. */
export const FORBIDDEN_ERROR = Response.json(
  { error: "Forbidden: you do not have access to this resource" },
  { status: 403 }
);

/**
 * Get the authenticated tenant ID from the request.
 *
 * Reads the x-tenant-id header set by the Edge middleware.
 * This header is trustworthy because the middleware derives it
 * from the cryptographically verified session cookie.
 *
 * Throws a Response (401) if the header is missing.
 */
export function getTenantId(request: Request): string {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    throw MISSING_TENANT_ERROR;
  }
  return tenantId;
}

/**
 * Verify that a website belongs to the authenticated tenant.
 *
 * Use in routes that accept a websiteId and access website-scoped data.
 * Returns the website row if authorized, or throws a 403/404 Response.
 */
export function verifyWebsiteOwnership(websiteId: string, tenantId: string) {
  const website = db
    .select()
    .from(websites)
    .where(eq(websites.id, websiteId))
    .get();

  if (!website) {
    throw Response.json({ error: "Website not found" }, { status: 404 });
  }

  if (website.tenantId !== tenantId) {
    throw FORBIDDEN_ERROR;
  }

  return website;
}

/** Type for the website row returned by verifyWebsiteOwnership. */
export type WebsiteRow = ReturnType<typeof verifyWebsiteOwnership>;
