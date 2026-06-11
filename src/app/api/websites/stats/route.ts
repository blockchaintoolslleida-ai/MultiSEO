import { db } from "@/db";
import { websites } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    let all;
    if (tenantId) {
      all = db.select().from(websites).where(eq(websites.tenantId, tenantId)).all();
    } else {
      all = db.select().from(websites).all();
    }

    const stats = {
      total: all.length,
      connected: all.filter((w) => w.status === "connected").length,
      noAccess: all.filter((w) => w.status === "no-access").length,
      error: all.filter((w) => w.status === "error").length,
    };
    return Response.json({ data: stats });
  } catch (error) {
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
