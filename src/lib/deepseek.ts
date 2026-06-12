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

function sanitizeJsonString(raw: string): string {
  // Remove markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  // Fix unescaped newlines inside string values
  // Strategy: find the outermost JSON structure and escape internal strings
  // Simpler approach: try to fix common issues
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // Attempt to fix: replace literal newlines that are inside strings with \n
    // This regex approach is fragile but handles the common case
    let fixed = "";
    let inString = false;
    let escape = false;
    for (let i = 0; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (escape) {
        fixed += ch;
        escape = false;
        continue;
      }
      if (ch === "\\") {
        fixed += ch;
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        fixed += ch;
        continue;
      }
      // Replace unescaped newlines inside strings
      if (inString && (ch === "\n" || ch === "\r")) {
        fixed += ch === "\n" ? "\\n" : "\\r";
        // If next char is part of \r\n, skip it too
        continue;
      }
      // Replace unescaped tabs inside strings
      if (inString && ch === "\t") {
        fixed += "\\t";
        continue;
      }
      fixed += ch;
    }
    return fixed;
  }
}

export async function generateArticle(params: GenerateParams): Promise<GeneratedArticle> {
  const maxTokens = params.length === "corto" ? 2000 : params.length === "largo" ? 6000 : 4000;

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
  const rawContent = data.choices[0].message.content;

  // Sanitize and parse
  const sanitized = sanitizeJsonString(rawContent);
  try {
    return JSON.parse(sanitized);
  } catch (parseError) {
    // If sanitization didn't help, log the raw content for debugging and rethrow
    if (process.env.NODE_ENV === "development") {
      console.error("DeepSeek JSON parse error. Raw content (first 500 chars):", rawContent.slice(0, 500));
      console.error("Sanitized (first 500 chars):", sanitized.slice(0, 500));
    }
    throw new Error(
      `DeepSeek returned malformed JSON: ${parseError instanceof Error ? parseError.message : "Unknown parse error"}. Try regenerating.`
    );
  }
}
