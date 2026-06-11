import type { GEOProvider, GEOResponse, GEOQueryRequest, GEOProviderConfig } from "../types";

const GEMINI_API_URL = (model: string, apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
}
5. NO uses bloques de código markdown. Responde SOLO el JSON.`;

export class GoogleAIGEOProvider implements GEOProvider {
  id = "google";
  name = "Google AI";

  constructor(private config: GEOProviderConfig) {}

  async query(request: GEOQueryRequest): Promise<GEOResponse> {
    const model = this.config.model || "gemini-2.0-flash";
    const url = GEMINI_API_URL(model, this.config.apiKey);

    const userMessage = `Pregunta del usuario: "${request.query}"

Marca a analizar: ${request.targetBrand}
Competidores a vigilar: ${request.competitorBrands.join(", ") || "ninguno especificado"}

Responde a la pregunta del usuario de forma natural y luego analiza si mencionaste ${request.targetBrand}.`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Google AI GEO API error: ${res.status} — ${errorText.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

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
      const model = this.config.model || "gemini-2.0-flash";
      const url = GEMINI_API_URL(model, this.config.apiKey);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "ping" }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
