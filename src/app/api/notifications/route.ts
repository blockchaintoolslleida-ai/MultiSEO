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

export async function POST(request: Request) {
  try {
    const tenantId = getTenantId(request);
    const body = await request.json();
    const { message, type = "info" } = body;

    if (!message) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    db.insert(notifications)
      .values({
        id,
        tenantId,
        message,
        type,
        time: "Ahora",
        read: 0,
        createdAt: new Date().toISOString(),
      })
      .run();

    return Response.json({ data: { id, message, type } }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return Response.json({ error: "Failed to create notification" }, { status: 500 });
  }
}
