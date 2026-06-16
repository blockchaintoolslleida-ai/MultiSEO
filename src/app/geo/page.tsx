"use client";

import { useState, useCallback } from "react";
import { useApi } from "@/hooks/use-api";
import { useTenant } from "@/hooks/use-tenant";
import { useWebsiteSelector } from "@/hooks/use-website-selector";
import { apiFetch } from "@/lib/api-client";
import type { GEOKPI, GEOQueryResult, GEORecommendation, ShareOfVoiceItem } from "@/lib/geo/types";
import { GeoKPIGrid } from "@/components/geo/geo-kpi-grid";
import { ShareOfVoiceChart } from "@/components/geo/share-of-voice-chart";
import { VisibilityList } from "@/components/geo/visibility-list";
import { RecommendationsPanel } from "@/components/geo/recommendations-panel";
import { QueryManager } from "@/components/geo/query-manager";

interface GEOResultsData {
  kpis: GEOKPI;
  queryResults: GEOQueryResult[];
  competitorMentions: { domain: string; mentions: number }[];
  lastScanned: string | null;
}

interface GeoQuery {
  id: string;
  keyword: string;
  query: string;
  source: string;
  enabled: number;
}

export default function GeoPage() {
  const { tenant } = useTenant();
  const { websiteId, setWebsiteId, websitesList } = useWebsiteSelector();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const {
    data: geoData,
    loading: geoLoading,
    refetch: refetchResults,
  } = useApi<GEOResultsData>(tenant ? `/api/geo/results?websiteId=${websiteId}` : "");

  const { data: sovData, refetch: refetchSOV } = useApi<ShareOfVoiceItem[]>(
    tenant ? `/api/geo/share-of-voice?websiteId=${websiteId}` : ""
  );

  const { data: recommendations, refetch: refetchRecs } = useApi<GEORecommendation[]>(
    tenant ? `/api/geo/recommendations?websiteId=${websiteId}` : ""
  );

  const { data: queries, refetch: refetchQueries } = useApi<GeoQuery[]>(
    tenant ? `/api/geo/queries?websiteId=${websiteId}` : ""
  );

  const refetchAll = useCallback(() => {
    refetchResults();
    refetchSOV();
    refetchRecs();
    refetchQueries();
  }, [refetchResults, refetchSOV, refetchRecs, refetchQueries]);

  const handleScan = async () => {
    setScanning(true);
    setScanError(null);
    setScanResult(null);
    try {
      const json = await apiFetch<{
        data: { brandMentions: number; queriesScanned: number; avgSentiment: string };
      }>("/api/geo/scan", {
        method: "POST",
        body: { websiteId },
      });
      if (!json.data) throw new Error("Scan failed");
      setScanResult(
        `${json.data.brandMentions}/${json.data.queriesScanned} queries con mención de marca · ${json.data.avgSentiment}`
      );
      refetchAll();
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Error");
    } finally {
      setScanning(false);
    }
  };

  const loading = geoLoading || !tenant;
  const kpis = geoData?.kpis;
  const queryResults = geoData?.queryResults ?? [];
  const sovItems = sovData ?? [];
  const recs = recommendations ?? [];
  const queryList = queries ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando GEO Tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
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
        <span className="text-gray-700 font-medium">GEO Tracker</span>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2.5">
            <span>🤖</span> GEO Tracker
          </h1>
          {websitesList.length > 1 && (
            <select
              value={websiteId}
              onChange={(e) => setWebsiteId(e.target.value)}
              className="text-[13px] border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:border-brand-400"
            >
              {websitesList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.domain}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          {scanResult && <span className="text-xs text-green-600">{scanResult}</span>}
          {scanError && <span className="text-xs text-red-500">{scanError}</span>}
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-brand-700 disabled:opacity-50"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={scanning ? "animate-spin" : ""}
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            {scanning ? "Escaneando..." : "Escanear Ahora"}
          </button>
        </div>
      </div>

      {kpis && <GeoKPIGrid kpis={kpis} />}

      <div className="grid grid-cols-[1fr_1fr] gap-4 mb-5">
        <ShareOfVoiceChart data={sovItems} />
        <VisibilityList results={queryResults} />
      </div>

      <div className="mb-5">
        <RecommendationsPanel recommendations={recs} />
      </div>

      <QueryManager queries={queryList} websiteId={websiteId} onRefresh={refetchQueries} />
    </div>
  );
}
