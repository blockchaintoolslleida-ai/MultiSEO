import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");

    let rows;
    if (tenantId) {
      rows = db.select().from(notifications).where(eq(notifications.tenantId, tenantId)).all();
    } else {
      rows = db.select().from(notifications).all();
    }

    const data = rows.map((n) => ({
      ...n,
      read: n.read === 1,
    }));
    return Response.json({ data });
  } catch (error) {
    return Response.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
