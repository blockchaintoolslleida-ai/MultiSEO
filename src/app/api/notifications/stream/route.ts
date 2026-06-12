import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getTenantId, MISSING_TENANT_ERROR } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  let tenantId: string;
  try {
    tenantId = getTenantId(request);
  } catch {
    return MISSING_TENANT_ERROR;
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let lastCount = 0;

      const poll = () => {
        try {
          const all = db
            .select()
            .from(notifications)
            .where(eq(notifications.tenantId, tenantId))
            .all()
            .map((n) => ({
              ...n,
              read: n.read === 1,
            }));

          const unread = all.filter((n) => !n.read).length;

          if (unread !== lastCount || all.length > 0) {
            const data = JSON.stringify({ unread, notifications: all });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            lastCount = unread;
          }
        } catch {
          // Ignore DB errors, keep polling
        }
      };

      // Poll immediately, then every 5 seconds
      poll();
      const interval = setInterval(poll, 5000);

      // Cleanup on client disconnect
      const cleanup = () => {
        clearInterval(interval);
        controller.close();
      };

      if ("signal" in request && request.signal) {
        (request.signal as AbortSignal).addEventListener("abort", cleanup);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
