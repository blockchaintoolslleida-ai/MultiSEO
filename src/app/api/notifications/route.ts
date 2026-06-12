import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId } from "@/lib/tenant";

export async function GET(request: Request) {
  try {
    const tenantId = getTenantId(request);
    const rows = db.select().from(notifications).where(eq(notifications.tenantId, tenantId)).all();

    const data = rows.map((n) => ({
      ...n,
      read: n.read === 1,
    }));
    return Response.json({ data });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
