import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "@/lib/auth-password";
import { signSession, sessionCookieHeader } from "@/lib/auth";
import { generateCsrfToken, csrfCookieHeader } from "@/lib/csrf";
import { loginRateLimiter } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { errorResponse } from "@/lib/api-responses";
import { z } from "zod";
import { parseBody, validationErrorResponse } from "@/lib/validate";
import { ZodError } from "zod";

const loginSchema = z.object({
  slug: z.string().min(1, "slug is required"),
  password: z.string().min(1, "password is required"),
});

export async function POST(request: Request) {
  // Rate limiting: 5 attempts per minute per IP
  const ip = getClientIp(request);
  const rateResult = loginRateLimiter(ip);
  if (!rateResult.allowed) {
    return Response.json(
      { error: "Too many login attempts. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateResult.resetSeconds) },
      }
    );
  }

  let body: { slug: string; password: string };
  try {
    body = await parseBody(request, loginSchema);
  } catch (err) {
    if (err instanceof ZodError) return validationErrorResponse(err);
    return errorResponse(err, 400);
  }

  try {
    const tenant = db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, body.slug))
      .get();

    if (!tenant || !tenant.passwordHash) {
      return Response.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    if (!verifyPassword(body.password, tenant.passwordHash)) {
      return Response.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const session = await signSession({
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
    });

    // Generate CSRF token for double-submit cookie pattern
    const csrfToken = await generateCsrfToken();

    return Response.json(
      {
        data: { tenantId: tenant.id, name: tenant.name, slug: tenant.slug },
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": [
            sessionCookieHeader(session),
            csrfCookieHeader(csrfToken),
          ].join(", "),
        },
      }
    );
  } catch (err) {
    if (err instanceof Response) throw err;
    return errorResponse(err);
  }
}
