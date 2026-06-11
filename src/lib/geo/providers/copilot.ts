import type { GEOProvider, GEOResponse, GEOQueryRequest, GEOProviderConfig } from "../types";

/**
 * Microsoft Copilot / Azure OpenAI provider.
 *
 * Config:
 *   apiKey: Azure OpenAI API key
 *   model:  "resource:deployment" format, e.g. "myorg:gpt-4o"
 *           resource = Azure OpenAI resource name
 *           deployment = model deployment name
 */

function getAzureUrl(config: GEOProviderConfig): string {
  const modelStr = config.model || "openai:gpt-4o-mini";
  const [resource, deployment] = modelStr.split(":");
  return `https://${resource}.openai.azure.com/openai/deployments/${deployment}/chat/completions?api-version=2024-10-21`;
}

const SYSTEM_PROMPT = `Eres un analizador de visibilidad de marca para GEO (Generative Engine Optimization).

Te daré una pregunta de usuario sobre un servicio/producto y necesito que determines si una marca específica aparece mencionada en tu respuesta natural a esa pregunta.

Reglas:
1. Responde la pregunta del usuario de forma natural y útil
2. NO inventes menciones de la marca si no las conoces genuinamente
3. Si conoces la marca, menciónala de forma natural si es relevante
4. Responde SIEMPRE en JSON con este formato exacto:
{
  "brandMentioned": true/false,
  "mentionPosition": 1-10 o null,
  "sentiment": "positive"|"negative"|"neutral",
  "snippet": "texto exacto donde se menciona la marca",
  "competitorsMentioned": ["dominio1.com", "dominio2.es"]
}`;

export class CopilotGEOProvider implements GEOProvider {
  id = "copilot";
  name = "Copilot";

  constructor(private config: GEOProviderConfig) {}

  async query(request: GEOQueryRequest): Promise<GEOResponse> {
    const url = getAzureUrl(this.config);

    const userMessage = `Pregunta del usuario: "${request.query}"

Marca a analizar: ${request.targetBrand}
Competidores a vigilar: ${request.competitorBrands.join(", ") || "ninguno especificado"}

Responde a la pregunta del usuario de forma natural y luego analiza si mencionaste ${request.targetBrand}.`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": this.config.apiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      throw new Error(`Copilot (Azure) GEO API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    const content = data.choices[0].message.content;

    const sanitized = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(sanitized);

    return {
      brandMentioned: parsed.brandMentioned ?? false,
      mentionPosition: parsed.mentionPosition ?? null,
      sentiment: parsed.sentiment ?? "neutral",
      snippet: parsed.snippet ?? "",
      competitorsMentioned: parsed.competitorsMentioned ?? [],
      fullResponse: content,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const url = getAzureUrl(this.config);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.config.apiKey,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
