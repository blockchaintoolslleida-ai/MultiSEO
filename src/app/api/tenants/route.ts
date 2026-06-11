import { db } from "@/db";
import { tenants } from "@/db/schema";

export async function GET() {
  try {
    const rows = db.select().from(tenants).all();
    return Response.json({ data: rows });
  } catch (error) {
    return Response.json({ error: "Failed to fetch tenants" }, { status: 500 });
  }
}
