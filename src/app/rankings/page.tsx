"use client";

import { useState, useEffect, useCallback } from "react";
import { useTenant } from "@/hooks/use-tenant";
import { TrendingUp } from "lucide-react";
import { KeywordsAdvancedTable } from "@/components/rankings/keywords-advanced-table";
import type { KeywordData } from "@/types/seo";

interface WebsiteOption {
  id: string;
  domain: string;
}

interface RankingsData {
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
  const [websiteId, setWebsiteId] = useState("1");
  const [websitesList, setWebsitesList] = useState<WebsiteOption[]>([]);
  const [data, setData] = useState<RankingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("position");
  const [order, setOrder] = useState("asc");
  const [page, setPage] = useState(0);
  const [difficulty, setDifficulty] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  // Fetch websites list
  useEffect(() => {
    if (!tenant) return;
    fetch(`/api/websites?tenantId=${tenant.id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setWebsitesList(json.data.map((w: any) => ({ id: w.id, domain: w.domain })));
          if (json.data.length > 0) setWebsiteId(json.data[0].id);
        }
      })
      .catch(() => {});
  }, [tenant]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/keywords/${id}`, { method: "DELETE" });
      if (res.ok) fetchKeywords();
    } catch { /* ignore */ }
  };

  const handleUpdate = async (id: string, field: string, value: number | string) => {
    try {
      const res = await fetch(`/api/keywords/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) fetchKeywords();
    } catch { /* ignore */ }
  };

  const handleSearch = (s: string) => { setSearch(s); setPage(0); };
  const handleSort = (s: string, o: string) => { setSort(s); setOrder(o); };
  const handlePage = (p: number) => { setPage(p); };
  const handleDifficulty = (d: string) => { setDifficulty(d); setPage(0); };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-5">
        <span className="text-brand-600 inline-flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          {tenant?.name ?? "Demo Company"}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
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
              onChange={(e) => { setWebsiteId(e.target.value); setPage(0); }}
              className="text-[13px] border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:border-brand-400"
            >
              {websitesList.map((w) => (
                <option key={w.id} value={w.id}>{w.domain}</option>
              ))}
            </select>
          )}
        </div>
        <span className="text-xs text-gray-400">
          {data?.websiteDomain && `Datos de ${data.websiteDomain}`}
        </span>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
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

      {/* Keywords table */}
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
