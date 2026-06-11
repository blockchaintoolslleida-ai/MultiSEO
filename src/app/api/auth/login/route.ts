import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, signSession, sessionCookieHeader } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, password } = body;

    if (!slug || !password) {
      return Response.json(
        { error: "slug and password are required" },
        { status: 400 }
      );
    }

    const tenant = db.select().from(tenants).where(eq(tenants.slug, slug)).get();
    if (!tenant || !tenant.passwordHash) {
      return Response.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    if (!verifyPassword(password, tenant.passwordHash)) {
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

    return Response.json(
      { data: { tenantId: tenant.id, name: tenant.name, slug: tenant.slug } },
      {
        status: 200,
        headers: {
          "Set-Cookie": sessionCookieHeader(session),
        },
      }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Login failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
