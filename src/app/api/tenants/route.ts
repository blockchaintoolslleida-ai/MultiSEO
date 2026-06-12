import { db } from "@/db";
import { tenants } from "@/db/schema";
import { getTenantId } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    // Require authentication — reject anonymous access
    getTenantId(request);

    const rows = db.select().from(tenants).all();
    return Response.json({ data: rows });
  } catch (error) {
    if (error instanceof Response) throw error;
    return Response.json({ error: "Failed to fetch tenants" }, { status: 500 });
  }
}
