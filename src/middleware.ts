import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { CSRF_COOKIE } from "@/lib/csrf";

// Public paths — no auth required
const PUBLIC = ["/login", "/api/auth/login", "/api/auth/logout"];

// Static assets and internal routes
const PUBLIC_PREFIXES = ["/_next", "/favicon.ico", "/.well-known"];

// Methods that require CSRF validation
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }
  // Allow static assets
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check session cookie
  const cookie = request.cookies.get(SESSION_COOKIE);
  if (!cookie?.value) {
    return redirectToLogin(request);
  }

  const session = await verifySession(cookie.value);
  if (!session) {
    return redirectToLogin(request);
  }

  // CSRF validation for state-changing methods
  if (!SAFE_METHODS.has(request.method)) {
    const csrfCookie = request.cookies.get(CSRF_COOKIE);
    const csrfHeader = request.headers.get("x-csrf-token");

    if (!csrfCookie?.value || !csrfHeader || csrfCookie.value !== csrfHeader) {
      return NextResponse.json(
        { error: "CSRF validation failed" },
        { status: 403 }
      );
    }
  }

  // Add tenant info to headers so API routes can use it
  const response = NextResponse.next();
  response.headers.set("x-tenant-id", session.tenantId);
  response.headers.set("x-tenant-slug", session.tenantSlug);
  return response;
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  if (request.nextUrl.pathname !== "/") {
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image).*)",
  ],
};
