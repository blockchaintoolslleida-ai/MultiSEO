import { runLighthouseAudit } from "@/lib/lighthouse";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return Response.json({ error: "url is required" }, { status: 400 });
    }

    const result = await runLighthouseAudit(url);

    return Response.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lighthouse audit failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
