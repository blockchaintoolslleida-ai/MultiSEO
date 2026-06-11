import type { GEOProvider } from "../types";
import { DeepSeekGEOProvider } from "./deepseek";
import { ChatGPTGEOProvider } from "./chatgpt";
import { PerplexityGEOProvider } from "./perplexity";
import { GoogleAIGEOProvider } from "./google";
import { CopilotGEOProvider } from "./copilot";

export function getGEOProviders(tenant: {
  deepseekApiKey?: string | null;
  geoProviderKeys?: string | null;
  geoEnabledProviders?: string | null;
}): GEOProvider[] {
  const providers: GEOProvider[] = [];

  // Get enabled list (default: deepseek only)
  const enabled: string[] = (() => {
    try {
      return JSON.parse(tenant.geoEnabledProviders || '["deepseek"]');
    } catch {
      return ["deepseek"];
    }
  })();

  // Get API keys
  const keys: Record<string, string> = (() => {
    try {
      return JSON.parse(tenant.geoProviderKeys || "{}");
    } catch {
      return {};
    }
  })();

  // DeepSeek: use tenant-specific key, fallback to env
  const deepseekKey =
    keys.deepseek || tenant.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
  if (enabled.includes("deepseek") && deepseekKey) {
    providers.push(new DeepSeekGEOProvider({ apiKey: deepseekKey }));
  }

  // ChatGPT (OpenAI)
  const chatgptKey = keys.chatgpt || process.env.OPENAI_API_KEY;
  if (enabled.includes("chatgpt") && chatgptKey) {
    providers.push(new ChatGPTGEOProvider({ apiKey: chatgptKey }));
  }

  // Perplexity
  const perplexityKey = keys.perplexity || process.env.PERPLEXITY_API_KEY;
  if (enabled.includes("perplexity") && perplexityKey) {
    providers.push(new PerplexityGEOProvider({ apiKey: perplexityKey }));
  }

  // Google AI (Gemini)
  const googleKey = keys.google || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  if (enabled.includes("google") && googleKey) {
    providers.push(new GoogleAIGEOProvider({ apiKey: googleKey }));
  }

  // Copilot (Azure OpenAI) — model field: "resource:deployment"
  const copilotKey = keys.copilot || process.env.AZURE_OPENAI_API_KEY;
  if (enabled.includes("copilot") && copilotKey) {
    providers.push(new CopilotGEOProvider({ apiKey: copilotKey }));
  }

  return providers;
}
