"use client";

import { useState } from "react";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ProviderInfo {
  name: string;
  icon: string;
  description: string;
}

const PROVIDER_INFO: Record<string, ProviderInfo> = {
  deepseek: { name: "DeepSeek", icon: "🧠", description: "Modelo chino. Principal para GEO tracking." },
  chatgpt: { name: "ChatGPT", icon: "🤖", description: "OpenAI GPT-4o. Cobertura global." },
  perplexity: { name: "Perplexity", icon: "🔍", description: "Motor de búsqueda IA. Visibilidad en search." },
  google: { name: "Google AI", icon: "🇬", description: "Google AI Overviews / SGE." },
  copilot: { name: "Copilot", icon: "💬", description: "Microsoft Copilot / Bing Chat." },
};

interface ProviderKeysManagerProps {
  keys: Record<string, string>;
  enabled: string[];
  onSave: (provider: string, apiKey: string, enabled: boolean) => Promise<void>;
  onTest: (provider: string, apiKey: string) => Promise<{ ok: boolean; error?: string }>;
}

export function ProviderKeysManager({ keys, enabled, onSave, onTest }: ProviderKeysManagerProps) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [testing, setTesting] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; error?: string }>>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [localKeys, setLocalKeys] = useState<Record<string, string>>({});
  const [localEnabled, setLocalEnabled] = useState<Set<string>>(new Set(enabled));

  const toggleVisibility = (provider: string) => {
    const next = new Set(visibleKeys);
    if (next.has(provider)) next.delete(provider);
    else next.add(provider);
    setVisibleKeys(next);
  };

  const toggleEnabled = async (provider: string) => {
    const next = new Set(localEnabled);
    if (next.has(provider)) next.delete(provider);
    else next.add(provider);
    setLocalEnabled(next);

    const currentKey = localKeys[provider] ?? keys[provider] ?? "";
    setSaving((s) => new Set(s).add(provider));
    await onSave(provider, currentKey, !localEnabled.has(provider));
    setSaving((s) => { const n = new Set(s); n.delete(provider); return n; });
  };

  const handleSave = async (provider: string) => {
    const key = localKeys[provider] ?? keys[provider] ?? "";
    setSaving((s) => new Set(s).add(provider));
    await onSave(provider, key, localEnabled.has(provider));
    setSaving((s) => { const n = new Set(s); n.delete(provider); return n; });
  };

  const handleTest = async (provider: string) => {
    const key = localKeys[provider] ?? keys[provider] ?? "";
    if (!key) {
      setTestResults((r) => ({ ...r, [provider]: { ok: false, error: "API key vacía" } }));
      return;
    }
    setTesting((s) => new Set(s).add(provider));
    const result = await onTest(provider, key);
    setTestResults((r) => ({ ...r, [provider]: result }));
    setTesting((s) => { const n = new Set(s); n.delete(provider); return n; });
  };

  const getStatus = (provider: string) => {
    const result = testResults[provider];
    if (result?.ok) return { badge: "● Conectado", color: "text-green-600" };
    if (result && !result.ok) return { badge: "⚠ Error", color: "text-red-500" };
    const hasKey = (localKeys[provider] ?? keys[provider] ?? "").length > 0;
    if (hasKey) return { badge: "● Configurado", color: "text-blue-600" };
    return { badge: "○ No configurado", color: "text-gray-400" };
  };

  return (
    <div>
      <h3 className="text-[15px] font-semibold text-gray-900 mb-1">🤖 Proveedores IA (GEO)</h3>
      <p className="text-[12px] text-gray-400 mb-4">
        Configura las API keys de los motores de IA para trackear la visibilidad de tu marca
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(PROVIDER_INFO).map(([id, info]) => {
          const isTest = testing.has(id);
          const isSave = saving.has(id);
          const isEnabled = localEnabled.has(id);
          const status = getStatus(id);

          return (
            <div
              key={id}
              className={`border rounded-xl p-4 transition-colors ${
                isEnabled ? "border-brand-200 bg-white" : "border-gray-200 bg-gray-50/50"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg">{info.icon}</span>
                <button
                  onClick={() => toggleEnabled(id)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    isEnabled ? "bg-brand-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow ${
                      isEnabled ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="font-semibold text-[13px] text-gray-800 mb-0.5">{info.name}</div>
              <p className="text-[11px] text-gray-400 mb-3">{info.description}</p>

              <div className="relative mb-2">
                <input
                  type={visibleKeys.has(id) ? "text" : "password"}
                  placeholder="sk-..."
                  value={localKeys[id] ?? keys[id] ?? ""}
                  onChange={(e) =>
                    setLocalKeys((k) => ({ ...k, [id]: e.target.value }))
                  }
                  disabled={!isEnabled}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] pr-9 focus:outline-none focus:border-brand-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={() => toggleVisibility(id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {visibleKeys.has(id) ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5 mb-2">
                <button
                  onClick={() => handleTest(id)}
                  disabled={!isEnabled || isTest}
                  className="text-[11px] px-2.5 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                >
                  {isTest && <Loader2 className="w-3 h-3 animate-spin" />}
                  {isTest ? "Probando..." : "Test"}
                </button>
                <button
                  onClick={() => handleSave(id)}
                  disabled={isSave}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {isSave && <Loader2 className="w-3 h-3 animate-spin" />}
                  Guardar
                </button>
              </div>

              <div className={`text-[11px] flex items-center gap-1 ${status.color}`}>
                {testResults[id]?.ok ? (
                  <CheckCircle className="w-3 h-3" />
                ) : testResults[id] && !testResults[id].ok ? (
                  <XCircle className="w-3 h-3" />
                ) : null}
                <span>
                  {status.badge}
                  {testResults[id]?.error && ` — ${testResults[id].error}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
