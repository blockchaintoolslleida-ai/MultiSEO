"use client";

import { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { apiFetch } from "@/lib/api-client";
import { ProviderKeysManager } from "@/components/settings/provider-keys-manager";
import { GSCConnectionCard } from "@/components/settings/gsc-connection-card";
import { TelegramSettings } from "@/components/settings/telegram-settings";

interface SettingsData {
  geoProviderKeys: Record<string, string>;
  geoEnabledProviders: string[];
  deepseekApiKey: string;
  gscConnected: boolean;
  gscSiteUrl: string;
  telegramBotToken: string;
  telegramChatId: string;
}

export default function SettingsPage() {
  const { tenant } = useTenant();
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!tenant) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tenants/${tenant.id}/settings`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching on mount
    fetchSettings();
  }, [fetchSettings]);

  const handleSaveProvider = async (provider: string, apiKey: string, enabled: boolean) => {
    if (!tenant) return;
    const currentEnabled = data?.geoEnabledProviders ?? [];

    // Since keys are masked in GET, we send only the changed key
    const updatedKeys: Record<string, string> = {};
    updatedKeys[provider] = apiKey;

    const updatedEnabled = enabled
      ? [...new Set([...currentEnabled, provider])]
      : currentEnabled.filter((p) => p !== provider);

    const json = await apiFetch<{ data: SettingsData }>(`/api/tenants/${tenant.id}/settings`, {
      method: "PATCH",
      body: {
        geoProviderKeys: updatedKeys,
        geoEnabledProviders: updatedEnabled,
      },
    });
    setData(json.data);
  };

  const handleTestProvider = async (provider: string, apiKey: string) => {
    const json = await apiFetch<{ data: { ok: boolean; error?: string } }>("/api/geo/test", {
      method: "POST",
      body: { provider, apiKey },
    });
    return json.data ?? { ok: false, error: "Error desconocido" };
  };

  const handleDisconnectGSC = async () => {
    if (!tenant) return;
    await apiFetch("/api/gsc/disconnect", { method: "POST", body: {} });
    setData((prev) => (prev ? { ...prev, gscConnected: false, gscSiteUrl: "" } : prev));
  };

  const handleSaveTelegram = async (botToken: string, chatId: string) => {
    if (!tenant) return;
    const json = await apiFetch<{ data: SettingsData }>(`/api/tenants/${tenant.id}/settings`, {
      method: "PATCH",
      body: { telegramBotToken: botToken, telegramChatId: chatId },
    });
    setData(json.data);
  };

  const handleTestTelegram = async (botToken: string, chatId: string) => {
    const json = await apiFetch<{ data: { ok: boolean; error?: string } }>("/api/telegram/test", {
      method: "POST",
      body: { botToken, chatId },
    });
    return json.data ?? { ok: false, error: "Error desconocido" };
  };

  if (loading || !tenant) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-5">
        <span className="text-brand-600 inline-flex items-center gap-1">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {tenant?.name ?? "Demo Company"}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-gray-700 font-medium">Configuración</span>
      </div>

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2.5">
          ⚙️ Configuración
        </h1>
      </div>

      {error && (
        <div className="mb-5 text-[13px] text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</div>
      )}

      <div className="space-y-8">
        {/* GEO Provider Keys */}
        <ProviderKeysManager
          keys={data?.geoProviderKeys ?? {}}
          enabled={data?.geoEnabledProviders ?? []}
          onSave={handleSaveProvider}
          onTest={handleTestProvider}
        />

        {/* Divider */}
        <hr className="border-gray-100" />

        {/* GSC Connection */}
        <GSCConnectionCard
          connected={data?.gscConnected ?? false}
          siteUrl={data?.gscSiteUrl ?? ""}
          onConnect={fetchSettings}
          onDisconnect={handleDisconnectGSC}
          onSaveSiteUrl={async (newSiteUrl: string) => {
            if (!tenant) return;
            const json = await apiFetch<{ data: SettingsData }>(
              `/api/tenants/${tenant.id}/settings`,
              { method: "PATCH", body: { gscSiteUrl: newSiteUrl } }
            );
            setData(json.data);
          }}
        />

        {/* Divider */}
        <hr className="border-gray-100" />

        {/* Telegram */}
        <TelegramSettings
          botToken={data?.telegramBotToken ?? ""}
          chatId={data?.telegramChatId ?? ""}
          onSave={handleSaveTelegram}
          onTest={handleTestTelegram}
        />
      </div>
    </div>
  );
}
