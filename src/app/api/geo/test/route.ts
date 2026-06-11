import { DeepSeekGEOProvider } from "@/lib/geo/providers/deepseek";
import { ChatGPTGEOProvider } from "@/lib/geo/providers/chatgpt";
import { PerplexityGEOProvider } from "@/lib/geo/providers/perplexity";
import { GoogleAIGEOProvider } from "@/lib/geo/providers/google";
import { CopilotGEOProvider } from "@/lib/geo/providers/copilot";
import type { GEOProvider } from "@/lib/geo/types";

function getProvider(provider: string, apiKey: string): GEOProvider {
  switch (provider) {
    case "deepseek":
      return new DeepSeekGEOProvider({ apiKey });
    case "chatgpt":
      return new ChatGPTGEOProvider({ apiKey });
    case "perplexity":
      return new PerplexityGEOProvider({ apiKey });
    case "google":
      return new GoogleAIGEOProvider({ apiKey });
    case "copilot":
      return new CopilotGEOProvider({ apiKey });
    default:
      throw new Error(`Provider "${provider}" no soportado. Usa: deepseek, chatgpt, perplexity, google, copilot`);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { provider, apiKey } = body;

    if (!provider || !apiKey) {
      return Response.json({ error: "provider and apiKey are required" }, { status: 400 });
    }

    const start = Date.now();

    const instance = getProvider(provider, apiKey);
    const available = await instance.isAvailable();
    const latency = Date.now() - start;

    if (available) {
      return Response.json({ data: { ok: true, latency, provider: instance.name } });
    } else {
      return Response.json({
        data: { ok: false, error: `API key inválida o servicio no disponible para ${instance.name}` },
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Test failed";
    return Response.json({ data: { ok: false, error: msg } });
  }
}
