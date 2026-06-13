"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

interface GSCConnectionCardProps {
  connected: boolean;
  siteUrl: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onSaveSiteUrl: (siteUrl: string) => Promise<void>;
}

export function GSCConnectionCard({
  connected,
  siteUrl,
  onConnect,
  onDisconnect,
  onSaveSiteUrl,
}: GSCConnectionCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSiteUrl, setEditingSiteUrl] = useState(siteUrl);
  const [savingSiteUrl, setSavingSiteUrl] = useState(false);
  const [availableSites, setAvailableSites] = useState<string[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);

  // Use siteUrl from parent as initial value; user edits are tracked locally.
  // When availableSites are loaded, auto-select the first one if no siteUrl is set.
  const displayUrl = editingSiteUrl || siteUrl;

  const handleListSites = async () => {
    setLoadingSites(true);
    setError(null);
    try {
      const json = await apiFetch<{ data: { sites: string[] } }>("/api/gsc/sites");
      const sites = json.data?.sites ?? [];
      setAvailableSites(sites);
      if (sites.length === 0) {
        setError(
          "No se encontraron sitios verificados en GSC. Verifica tu sitio en Google Search Console."
        );
      } else if (!siteUrl) {
        // Auto-select first site
        const first = sites[0];
        setEditingSiteUrl(first);
        await onSaveSiteUrl(first);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al listar sitios");
    } finally {
      setLoadingSites(false);
    }
  };

  const handleConnect = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/gsc/auth`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const popup = window.open(json.data.authUrl, "gsc-auth", "width=600,height=700");
      if (!popup) {
        window.location.href = json.data.authUrl;
        return;
      }
      const interval = setInterval(() => {
        if (popup.closed) {
          clearInterval(interval);
          setLoading(false);
          onConnect();
        }
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        "¿Desconectar Google Search Console? Necesitarás volver a autorizar para reconectar."
      )
    )
      return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/gsc/disconnect", { method: "POST", body: {} });
      onDisconnect();
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-[15px] font-semibold text-gray-900 mb-1">🔍 Google Search Console</h3>
      <p className="text-[12px] text-gray-400 mb-4">
        Conecta GSC para importar keywords, rankings y datos de search analytics reales
      </p>

      <div
        className={`border rounded-xl p-5 ${
          connected ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {connected ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <div
                className={`text-[13px] font-semibold ${connected ? "text-green-700" : "text-gray-700"}`}
              >
                {connected ? "Conectado" : "No conectado"}
              </div>
              {!connected && (
                <div className="text-[12px] text-gray-400 mt-0.5">
                  Conecta tu cuenta de Google para sincronizar datos de Search Console
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {connected ? (
              <>
                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="text-[12px] px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Desconectar
                </button>
                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="text-[12px] px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Reconectar
                </button>
              </>
            ) : (
              <button
                onClick={handleConnect}
                disabled={loading}
                className="text-[12px] px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1"
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                Conectar GSC
              </button>
            )}
          </div>
        </div>

        {connected && (
          <div className="mt-3 pt-3 border-t border-green-100 space-y-3">
            {/* Site URL section */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-gray-500">
                  URL del sitio en GSC
                </label>
                <button
                  onClick={handleListSites}
                  disabled={loadingSites}
                  className="text-[10px] text-brand-600 hover:text-brand-700 flex items-center gap-1 disabled:opacity-50"
                >
                  {loadingSites ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Buscar sitios
                </button>
              </div>

              {availableSites.length > 0 ? (
                <select
                  value={displayUrl}
                  onChange={async (e) => {
                    const val = e.target.value;
                    setEditingSiteUrl(val);
                    if (val) {
                      setSavingSiteUrl(true);
                      try {
                        await onSaveSiteUrl(val);
                      } catch {}
                      setSavingSiteUrl(false);
                    }
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] bg-white focus:outline-none focus:border-brand-400 mb-2"
                >
                  {availableSites.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={displayUrl}
                    onChange={(e) => setEditingSiteUrl(e.target.value)}
                    placeholder="sc_domain:example.com o https://example.com/"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:border-brand-400"
                  />
                  <button
                    onClick={async () => {
                      setSavingSiteUrl(true);
                      try {
                        await onSaveSiteUrl(displayUrl.trim());
                      } catch {}
                      setSavingSiteUrl(false);
                    }}
                    disabled={savingSiteUrl}
                    className="text-[11px] px-3 py-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 whitespace-nowrap"
                  >
                    {savingSiteUrl ? "..." : "Guardar"}
                  </button>
                </div>
              )}
              <p className="text-[10px] text-gray-400">
                {availableSites.length > 0
                  ? `${availableSites.length} sitio(s) disponible(s). Selecciona uno y sincroniza desde el Dashboard.`
                  : 'Usa "Buscar sitios" para detectar tus propiedades verificadas.'}
              </p>
            </div>
            <p className="text-[11px] text-gray-400">
              Los datos se sincronizan bajo demanda desde el Dashboard. La conexión OAuth 2.0
              permite acceso de solo lectura a Search Console.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-3 text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
