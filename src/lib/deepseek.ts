const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `Eres un redactor SEO experto. Generas artículos en español optimizados para motores de búsqueda.

Reglas:
- Usa las keywords proporcionadas de forma natural (densidad 1-2%)
- Estructura el artículo con H2 relevantes
- Incluye meta description (max 155 caracteres)
- Genera slug amigable (sin stop words)
- Añade datos, ejemplos y fuentes cuando sea relevante
- No inventes estadísticas sin base
- Responde solo con JSON válido`;

export interface GenerateParams {
  topic: string;
  keywords: string[];
  tone: string;
  length: string;
  structure: string[];
  apiKey: string;
}

export interface GeneratedArticle {
  title: string;
  metaDescription: string;
  slug: string;
  content: { h2Sections: { title: string; paragraphs: string[] }[] };
  seoScores: { keywords: number; readability: number; structure: number; originality: number };
}

function buildUserPrompt(p: GenerateParams): string {
  return `Genera un artículo SEO con estos parámetros:

TEMA: ${p.topic}
KEYWORDS: ${p.keywords.join(", ")}
TONO: ${p.tone}
EXTENSIÓN: ${p.length}
ESTRUCTURA: ${p.structure.join(", ")}

Responde ÚNICAMENTE con este JSON:
{
  "title": "título optimizado",
  "metaDescription": "meta de max 155 chars",
  "slug": "/blog/slug-del-articulo",
  "content": {
    "h2Sections": [
      { "title": "Título de la sección", "paragraphs": ["párrafo 1", "párrafo 2"] }
    ]
  },
  "seoScores": {
    "keywords": 0-100,
    "readability": 0-100,
    "structure": 0-100,
    "originality": 0-100
  }
}`;
}

export async function generateArticle(params: GenerateParams): Promise<GeneratedArticle> {
  const maxTokens = params.length === "corto" ? 1000 : params.length === "largo" ? 3000 : 2000;

  const response = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(params) },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
