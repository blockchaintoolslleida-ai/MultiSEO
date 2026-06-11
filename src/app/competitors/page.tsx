"use client";

import { useState, useEffect, useCallback } from "react";
import { useApi } from "@/hooks/use-api";
import { useTenant } from "@/hooks/use-tenant";
import type {
  CompetitorFull,
  CompetitorKPIs,
  OverlapMatrixRow,
  CompetitorRecommendation,
} from "@/types/seo";
import { CompetitorKPIGrid } from "@/components/competitors/competitor-kpi-grid";
import { CompetitorRanking } from "@/components/competitors/competitor-ranking";
import { KeywordOverlapMatrix } from "@/components/competitors/keyword-overlap-matrix";
import { CompetitorComparator } from "@/components/competitors/competitor-comparator";
import { CompetitorIntelligence } from "@/components/competitors/competitor-intelligence";
import { CompetitorManager } from "@/components/competitors/competitor-manager";

interface WebsiteOption {
  id: string;
  domain: string;
}

interface CompetitorsFullData {
  kpis: CompetitorKPIs;
  competitors: CompetitorFull[];
  overlapMatrix: OverlapMatrixRow[];
  recommendations: CompetitorRecommendation[];
}

export default function CompetitorsPage() {
  const { tenant } = useTenant();
  const [websiteId, setWebsiteId] = useState("1");
  const [websitesList, setWebsitesList] = useState<WebsiteOption[]>([]);

  const { data, loading, refetch } = useApi<CompetitorsFullData>(
    tenant ? `/api/competitors?websiteId=${websiteId}` : ""
  );

  useEffect(() => {
    if (!tenant) return;
    fetch(`/api/websites?tenantId=${tenant.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setWebsitesList(
            json.data.map((w: any) => ({ id: w.id, domain: w.domain }))
          );
          if (json.data.length > 0) setWebsiteId(json.data[0].id);
        }
      })
      .catch(() => {});
  }, [tenant]);

  const kpis = data?.kpis;
  const competitors = data?.competitors ?? [];
  const matrix = data?.overlapMatrix ?? [];
  const recommendations = data?.recommendations ?? [];

  if (loading || !tenant) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando Competidores...</p>
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
        <span className="text-gray-700 font-medium">Competidores</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2.5">
            🏆 Competidores Intelligence
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
      </div>

      {/* KPIs */}
      {kpis && <CompetitorKPIGrid kpis={kpis} />}

      {/* Ranking - full width */}
      <CompetitorRanking
        competitors={competitors}
        onSelect={(id) => {
          document.getElementById("comparator-section")?.scrollIntoView({ behavior: "smooth" });
        }}
      />

      {/* Overlap Matrix + Comparator grid */}
      <div className="grid grid-cols-[1fr_1fr] gap-4 mb-5" id="comparator-section">
        <KeywordOverlapMatrix
          matrix={matrix}
          competitorDomains={competitors.filter((c) => c.rank !== 1).map((c) => c.domain)}
        />
        <CompetitorComparator
          competitors={competitors}
          matrix={matrix}
          yourDomain={competitors.find((c) => c.rank === 1)?.domain ?? "tuweb.com"}
          yourPosition={kpis?.yourAvgPosition ?? 0}
        />
      </div>

      {/* Intelligence */}
      <CompetitorIntelligence recommendations={recommendations} />

      {/* Manager (collapsible) */}
      <CompetitorManager
        competitors={competitors}
        websiteId={websiteId}
        onRefresh={refetch}
      />
    </div>
  );
}
