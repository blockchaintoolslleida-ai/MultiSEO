"use client";

import { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { useWebsiteSelector } from "@/hooks/use-website-selector";
import { apiFetch } from "@/lib/api-client";
import { TrendingUp, RefreshCw } from "lucide-react";
import { RankingsSummaryCards } from "@/components/rankings/rankings-summary";
import { KeywordChart } from "@/components/rankings/keyword-chart";
import { KeywordsAdvancedTable } from "@/components/rankings/keywords-advanced-table";
import type { KeywordData, RankingsApiResponse, RankingsSummary } from "@/types/seo";

type SortType = "improved" | "declined" | "position" | "clicks" | "impressions";

interface RankingsPageData {
  keywords: KeywordData[];
  total: number;
  page: number;
  totalPages: number;
  websiteDomain: string;
  summary: {
    total: number;
    easy: number;
    medium: number;
    hard: number;
    top3: number;
    falling: number;
    avgPosition: number;
  };
}

export default function RankingsPage() {
  const { tenant } = useTenant();
  const { websiteId, setWebsiteId, websitesList } = useWebsiteSelector();

  // Legacy keyword list state (paginated)
  const [data, setData] = useState<RankingsPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("position");
  const [order, setOrder] = useState("asc");
  const [page, setPage] = useState(0);
  const [difficulty, setDifficulty] = useState("");
  const [error, setError] = useState<string | null>(null);

  // New GSC-powered rankings state
  const [rankingsData, setRankingsData] = useState<RankingsApiResponse | null>(null);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [rankingsSort, setRankingsSort] = useState<SortType>("position");
  const [expandedKeywordId, setExpandedKeywordId] = useState<string | null>(null);
  const [syncingGsc, setSyncingGsc] = useState(false);

  const fetchKeywords = useCallback(async () => {
    if (!websiteId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ websiteId });
      if (search) params.set("search", search);
      if (sort) params.set("sort", sort);
      if (order) params.set("order", order);
      if (difficulty) params.set("difficulty", difficulty);
      params.set("page", String(page));
      params.set("perPage", "20");

      const res = await fetch(`/api/keywords?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setData(json.data);
      } else {
        setError(json.error || "Error fetching keywords");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [websiteId, search, sort, order, page, difficulty]);

  const fetchRankings = useCallback(async () => {
    if (!websiteId) return;
    setRankingsLoading(true);
    try {
      const params = new URLSearchParams({ websiteId, days: "30", sort: rankingsSort });
      const json = await apiFetch<{ data: RankingsApiResponse }>(
        `/api/rankings?${params.toString()}`
      );
      if (json.data) {
        setRankingsData(json.data);
      }
    } catch {
      // rankings API might fail if no GSC data — that's fine
    } finally {
      setRankingsLoading(false);
    }
  }, [websiteId, rankingsSort]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchKeywords();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchKeywords]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchRankings();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchRankings]);

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/keywords/${id}`, { method: "DELETE" });
      fetchKeywords();
    } catch {
      /* ignore */
    }
  };

  const handleUpdate = async (id: string, field: string, value: number | string) => {
    try {
      await apiFetch(`/api/keywords/${id}`, { method: "PATCH", body: { [field]: value } });
      fetchKeywords();
    } catch {
      /* ignore */
    }
  };

  const handleSyncGsc = async () => {
    if (!websiteId) return;
    setSyncingGsc(true);
    try {
      await apiFetch("/api/gsc/search-analytics", {
        method: "POST",
        body: { websiteId },
      });
      fetchKeywords();
      fetchRankings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "GSC sync failed");
    } finally {
      setSyncingGsc(false);
    }
  };

  const handleSearch = (s: string) => {
    setSearch(s);
    setPage(0);
  };
  const handleSort = (s: string, o: string) => {
    setSort(s);
    setOrder(o);
  };
  const handlePage = (p: number) => {
    setPage(p);
  };
  const handleDifficulty = (d: string) => {
    setDifficulty(d);
    setPage(0);
  };

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
        <span className="text-gray-700 font-medium">Rankings</span>
      </div>

      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-[22px] h-[22px] text-brand-500" />
            Rankings
          </h1>
          {websitesList.length > 1 && (
            <select
              value={websiteId}
              onChange={(e) => {
                setWebsiteId(e.target.value);
                setPage(0);
              }}
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
          {rankingsData?.lastSync && (
            <span className="text-[11px] text-gray-400">
              Última sync:{" "}
              {new Date(rankingsData.lastSync).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <button
            onClick={handleSyncGsc}
            disabled={syncingGsc}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingGsc ? "animate-spin" : ""}`} />
            {syncingGsc ? "Sincronizando..." : "Sync GSC"}
          </button>
        </div>
      </div>

      {/* GSC Rankings Summary Cards */}
      {rankingsData && (
        <RankingsSummaryCards summary={rankingsData.summary} loading={rankingsLoading} />
      )}

      {/* Error state */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* GSC Rankings Table (when data available) */}
      {rankingsData && rankingsData.keywords.length > 0 && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-gray-900">
              Datos de Google Search Console
            </h3>
            <select
              value={rankingsSort}
              onChange={(e) => setRankingsSort(e.target.value as SortType)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600"
            >
              <option value="position">Ordenar: Mejor posición</option>
              <option value="improved">Ordenar: Más han subido</option>
              <option value="declined">Ordenar: Más han bajado</option>
              <option value="clicks">Ordenar: Más clics</option>
              <option value="impressions">Ordenar: Más impresiones</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b-2 border-gray-200 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="text-left p-2.5">Keyword</th>
                  <th className="text-right p-2.5">Posición</th>
                  <th className="text-right p-2.5">Cambio</th>
                  <th className="text-right p-2.5">Clics</th>
                  <th className="text-right p-2.5">Impresiones</th>
                  <th className="text-right p-2.5">CTR</th>
                  <th className="text-right p-2.5">Tendencia</th>
                  <th className="p-2.5 w-8" />
                </tr>
              </thead>
              <tbody>
                {rankingsData.keywords.map((kw) => (
                  <>
                    <tr
                      key={kw.id}
                      className={`border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors ${
                        expandedKeywordId === kw.id ? "bg-brand-50/30" : ""
                      }`}
                      onClick={() =>
                        setExpandedKeywordId(expandedKeywordId === kw.id ? null : kw.id)
                      }
                    >
                      <td className="p-2.5 font-medium text-gray-900">
                        <div className="flex items-center gap-1.5">
                          {kw.keyword}
                          {kw.isTop3 && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                              TOP 3
                            </span>
                          )}
                          {kw.isFalling && (
                            <span className="text-[10px] px-1 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                              ⚠
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className={`p-2.5 text-right font-bold ${
                          kw.position <= 3
                            ? "text-green-600"
                            : kw.position <= 10
                              ? "text-amber-600"
                              : kw.position > 20
                                ? "text-red-600"
                                : "text-gray-700"
                        }`}
                      >
                        #{kw.position}
                      </td>
                      <td
                        className={`p-2.5 text-right font-medium ${
                          kw.change > 0
                            ? "text-green-600"
                            : kw.change < 0
                              ? "text-red-600"
                              : "text-gray-400"
                        }`}
                      >
                        {kw.change > 0 ? "+" : ""}
                        {kw.change}
                      </td>
                      <td className="p-2.5 text-right text-gray-600">{kw.clicks}</td>
                      <td className="p-2.5 text-right text-gray-600">
                        {kw.impressions >= 1000
                          ? `${(kw.impressions / 1000).toFixed(1)}K`
                          : kw.impressions}
                      </td>
                      <td className="p-2.5 text-right text-gray-600">
                        {(kw.ctr * 100).toFixed(1)}%
                      </td>
                      <td className="p-2.5 text-right">
                        <span
                          className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                            kw.trend === "up"
                              ? "text-green-600"
                              : kw.trend === "down"
                                ? "text-red-600"
                                : "text-gray-400"
                          }`}
                        >
                          {kw.trend === "up"
                            ? "↑ Subiendo"
                            : kw.trend === "down"
                              ? "↓ Bajando"
                              : "→ Estable"}
                        </span>
                      </td>
                      <td className="p-2.5 text-gray-400">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className={`transition-transform ${expandedKeywordId === kw.id ? "rotate-180" : ""}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </td>
                    </tr>
                    {expandedKeywordId === kw.id && (
                      <tr key={`${kw.id}-chart`}>
                        <td colSpan={8} className="p-0">
                          <KeywordChart history={kw.history} keyword={kw.keyword} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !data && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Cargando rankings...</p>
          </div>
        </div>
      )}

      {/* Legacy keywords table (always shown for CRUD) */}
      {data && (
        <KeywordsAdvancedTable
          keywords={data.keywords}
          total={data.total}
          page={data.page}
          totalPages={data.totalPages}
          summary={data.summary}
          onSearch={handleSearch}
          onSort={handleSort}
          onPage={handlePage}
          onDifficulty={handleDifficulty}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          loading={loading}
        />
      )}
    </div>
  );
}
