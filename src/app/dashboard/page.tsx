"use client";

import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { useTenant } from "@/hooks/use-tenant";
import type { SEODashboardData } from "@/types/seo";
import { KPIGrid } from "@/components/seo/kpi-grid";
import { RankingChart } from "@/components/seo/ranking-chart";
import { CompetitorPanel } from "@/components/seo/competitor-panel";
import { KeywordsTable } from "@/components/seo/keywords-table";

export default function DashboardPage() {
  const { tenant } = useTenant();
  const { data, loading, refetch } = useApi<SEODashboardData>("/api/dashboard?websiteId=1");
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeResult, setScrapeResult] = useState<string | null>(null);

  const handleScrape = async () => {
    setScraping(true);
    setScrapeError(null);
    setScrapeResult(null);
    try {
      const res = await fetch("/api/keywords/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId: "1" }),
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
        <h1 className="text-[22px] font-bold text-gray-900">SEO Dashboard</h1>
        <div className="flex items-center gap-2">
          {scrapeResult && <span className="text-xs text-green-600">{scrapeResult}</span>}
          {scrapeError && <span className="text-xs text-red-500">{scrapeError}</span>}
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
