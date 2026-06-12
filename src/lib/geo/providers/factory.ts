import type { GEOProvider } from "../types";
import { DeepSeekGEOProvider } from "./deepseek";
import { ChatGPTGEOProvider } from "./chatgpt";
import { PerplexityGEOProvider } from "./perplexity";
import { GoogleAIGEOProvider } from "./google";
import { CopilotGEOProvider } from "./copilot";
import { getTenantSecret } from "@/lib/tenant-secrets";

export function getGEOProviders(tenant: Record<string, unknown>): GEOProvider[] {
  // Get enabled list (default: deepseek only)
  const enabled: string[] = (() => {
    try {
      return JSON.parse((tenant.geoEnabledProviders as string) || '["deepseek"]');
    } catch {
      return ["deepseek"];
    }
  })();

  // Get API keys
  const keys: Record<string, string> = (() => {
    try {
      return JSON.parse(getTenantSecret(tenant, "geoProviderKeys") || "{}");
    } catch {
      return {};
    }
  })();

  // Build candidate providers with their keys
  const deepseekKey =
    keys.deepseek || getTenantSecret(tenant, "deepseekApiKey") || process.env.DEEPSEEK_API_KEY;
  const chatgptKey = keys.chatgpt || process.env.OPENAI_API_KEY;
  const perplexityKey = keys.perplexity || process.env.PERPLEXITY_API_KEY;
  const googleKey = keys.google || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
  const copilotKey = keys.copilot || process.env.AZURE_OPENAI_API_KEY;

  const candidates: [string, GEOProvider | null][] = [
    ["deepseek", enabled.includes("deepseek") && deepseekKey ? new DeepSeekGEOProvider({ apiKey: deepseekKey }) : null],
    ["chatgpt", enabled.includes("chatgpt") && chatgptKey ? new ChatGPTGEOProvider({ apiKey: chatgptKey }) : null],
    ["perplexity", enabled.includes("perplexity") && perplexityKey ? new PerplexityGEOProvider({ apiKey: perplexityKey }) : null],
    ["google", enabled.includes("google") && googleKey ? new GoogleAIGEOProvider({ apiKey: googleKey }) : null],
    ["copilot", enabled.includes("copilot") && copilotKey ? new CopilotGEOProvider({ apiKey: copilotKey }) : null],
  ];

  return candidates.filter(([, p]) => p !== null).map(([, p]) => p as GEOProvider);
}
