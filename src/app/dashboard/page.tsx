"use client";

import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/hooks/use-api";
import { useTenant } from "@/hooks/use-tenant";
import type { SEODashboardData } from "@/types/seo";
import { KPIGrid } from "@/components/seo/kpi-grid";
import { RankingChart } from "@/components/seo/ranking-chart";
import { CompetitorPanel } from "@/components/seo/competitor-panel";
import { KeywordsTable } from "@/components/seo/keywords-table";

interface GSCStatus {
  connected: boolean;
  siteUrl: string;
  hasRefreshToken: boolean;
}

interface WebsiteOption {
  id: string;
  domain: string;
}

export default function DashboardPage() {
  const { tenant } = useTenant();
  const [websiteId, setWebsiteId] = useState("1");
  const [websitesList, setWebsitesList] = useState<WebsiteOption[]>([]);
  const { data, loading, refetch } = useApi<SEODashboardData>(`/api/dashboard?websiteId=${websiteId}`);
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeResult, setScrapeResult] = useState<string | null>(null);
  const [gscStatus, setGscStatus] = useState<GSCStatus | null>(null);
  const [gscSyncing, setGscSyncing] = useState(false);
  const [gscError, setGscError] = useState<string | null>(null);
  const [gscResult, setGscResult] = useState<string | null>(null);
  const [gscSyncLabel, setGscSyncLabel] = useState<string>("");
  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  const checkGSCStatus = useCallback(async () => {
    if (!tenant) return;
    try {
      const res = await fetch(`/api/gsc/status`);
      const json = await res.json();
      if (res.ok) setGscStatus(json.data);
    } catch {
      // GSC not configured
    }
    // Also fetch sync status for this website
    try {
      const syncRes = await fetch(`/api/gsc/sync-status?websiteId=${websiteId}`);
      const syncJson = await syncRes.json();
      if (syncRes.ok && syncJson.data) {
        setGscSyncLabel(syncJson.data.lastSyncLabel);
      }
    } catch {
      // Ignore
    }
  }, [tenant, websiteId]);

  useEffect(() => {
    checkGSCStatus();
  }, [checkGSCStatus]);

  // Fetch websites list for the selector
  useEffect(() => {
    if (!tenant) return;
    fetch(`/api/websites`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setWebsitesList(json.data.map((w: any) => ({ id: w.id, domain: w.domain })));
          // Auto-select first real website
          if (json.data.length > 0) setWebsiteId(json.data[0].id);
        }
      })
      .catch(() => {});
  }, [tenant]);

  const handleConnectGSC = async () => {
    try {
      const res = await fetch(`/api/gsc/auth`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      // Open OAuth URL in popup
      const popup = window.open(json.data.authUrl, "gsc-auth", "width=600,height=700");
      if (!popup) {
        // Fallback: open in same window
        window.location.href = json.data.authUrl;
        return;
      }
      // Poll for popup close
      const interval = setInterval(() => {
        if (popup.closed) {
          clearInterval(interval);
          checkGSCStatus();
        }
      }, 500);
    } catch (err) {
      setGscError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleGSCSync = async () => {
    if (!tenant) return;
    setGscSyncing(true);
    setGscError(null);
    setGscResult(null);
    try {
      const res = await fetch("/api/gsc/search-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "GSC sync failed");
      const d = json.data;
      setGscResult(`${d.keywordsImported} nuevas, ${d.keywordsUpdated} actualizadas · ${d.totalImpressions.toLocaleString()} impresiones`);
      setGscSyncLabel("Ahora");
      refetch();
    } catch (err) {
      setGscError(err instanceof Error ? err.message : "Error");
    } finally {
      setGscSyncing(false);
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    setScrapeError(null);
    setScrapeResult(null);
    try {
      const res = await fetch("/api/keywords/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Scraping failed");
      setScrapeResult(`${json.data.keywordsScraped} keywords actualizadas`);
      refetch();
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : "Error");
    } finally {
      setScraping(false);
    }
  };

  const handleAudit = async () => {
    setAuditing(true);
    setAuditError(null);
    setAuditResult(null);
    try {
      const domain = data?.websiteUrl ?? "example.com";
      const res = await fetch("/api/lighthouse/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: `https://${domain}` }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Audit failed");
      const s = json.data.scores;
      setAuditResult(`Health ${Math.round((s.performance + s.accessibility + s.bestPractices + s.seo) / 4)}% · Perf ${s.performance} · SEO ${s.seo}`);
      refetch();
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : "Error");
    } finally {
      setAuditing(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-5">
        <span className="text-brand-600 inline-flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          {tenant?.name ?? "Demo Company"}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span>{data.websiteUrl}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">Dashboard SEO</span>
      </div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold text-gray-900">SEO Dashboard</h1>
          {websitesList.length > 1 && (
            <select
              value={websiteId}
              onChange={(e) => setWebsiteId(e.target.value)}
              className="text-[13px] border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:border-brand-400"
            >
              {websitesList.map((w) => (
                <option key={w.id} value={w.id}>{w.domain}</option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          {gscResult && <span className="text-xs text-green-600">{gscResult}</span>}
          {gscError && <span className="text-xs text-red-500">{gscError}</span>}
          {auditResult && <span className="text-xs text-purple-600">{auditResult}</span>}
          {auditError && <span className="text-xs text-red-500">{auditError}</span>}
          {scrapeResult && <span className="text-xs text-green-600">{scrapeResult}</span>}
          {scrapeError && <span className="text-xs text-red-500">{scrapeError}</span>}

          {/* GSC Connect / Sync Button */}
          {gscStatus?.connected ? (
            <div className="flex items-center gap-1.5">
              {gscSyncLabel && !gscSyncing && (
                <span className="text-[11px] text-gray-400">{gscSyncLabel}</span>
              )}
              <button
                onClick={handleGSCSync}
                disabled={gscSyncing}
                className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-[13px] font-medium flex items-center gap-1.5 hover:bg-blue-100 disabled:opacity-50"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={gscSyncing ? "animate-spin" : ""}>
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                {gscSyncing ? "Sincronizando GSC..." : "Sincronizar GSC"}
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectGSC}
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><circle cx="9" cy="9" r="3"/><circle cx="15" cy="9" r="2.5"/><path d="M17.5 19.5c0-3.5-2.46-5.5-5.5-5.5s-5.5 2-5.5 5.5"/>
              </svg>
              Conectar GSC
            </button>
          )}

          <button
            onClick={handleScrape}
            disabled={scraping}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50 disabled:opacity-50"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={scraping ? "animate-spin" : ""}>
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            {scraping ? "Actualizando..." : "Actualizar Rankings"}
          </button>
          <button
            onClick={handleAudit}
            disabled={auditing}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-[13px] font-medium flex items-center gap-1.5 hover:bg-gray-50 disabled:opacity-50"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={auditing ? "animate-spin" : ""}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            {auditing ? "Auditando..." : "Auditar SEO"}
          </button>
        </div>
      </div>
      <KPIGrid kpis={data.kpis} />
      <div className="grid grid-cols-[2fr_1fr] gap-4 mb-6">
        <RankingChart data={data.rankingHistory} />
        <CompetitorPanel competitors={data.competitors} />
      </div>
      <KeywordsTable keywords={data.keywords} />
    </div>
  );
}
