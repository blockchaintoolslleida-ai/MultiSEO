import type { GEOProvider } from "../types";
import { DeepSeekGEOProvider } from "./deepseek";

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

  // Future providers:
  // if (enabled.includes("chatgpt") && keys.chatgpt) { ... }
  // if (enabled.includes("perplexity") && keys.perplexity) { ... }

  return providers;
}
