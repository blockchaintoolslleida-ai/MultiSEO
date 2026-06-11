import { DeepSeekGEOProvider } from "@/lib/geo/providers/deepseek";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, apiKey } = body;

    if (!provider || !apiKey) {
      return Response.json({ error: "provider and apiKey are required" }, { status: 400 });
    }

    const start = Date.now();

    // For now only DeepSeek is implemented. When more providers are added,
    // use the factory pattern or switch based on provider name.
    if (provider === "deepseek") {
      const deepseek = new DeepSeekGEOProvider({ apiKey });
      const available = await deepseek.isAvailable();
      const latency = Date.now() - start;

      if (available) {
        return Response.json({ data: { ok: true, latency } });
      } else {
        return Response.json({ data: { ok: false, error: "API key inválida o servicio no disponible" } });
      }
    }

    return Response.json({
      data: { ok: false, error: `Provider "${provider}" no implementado aún` },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Test failed";
    return Response.json({ data: { ok: false, error: msg } });
  }
}
