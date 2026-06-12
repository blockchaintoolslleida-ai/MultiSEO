"use client";

import { useApi } from "@/hooks/use-api";
import { useTenant } from "@/hooks/use-tenant";
import type { WebsiteData, WebsiteStats } from "@/types/seo";
import { QuickStats } from "@/components/websites/quick-stats";
import { WebsiteGrid } from "@/components/websites/website-grid";

export default function WebsitesPage() {
  const { tenant } = useTenant();
  const { data: websites, loading: wLoading } = useApi<WebsiteData[]>(
    tenant ? `/api/websites` : ""
  );
  const { data: stats, loading: sLoading } = useApi<WebsiteStats>(
    tenant ? `/api/websites/stats` : ""
  );
  const loading = wLoading || sLoading || !tenant;

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando websites...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-5">
        <span className="text-brand-600 inline-flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          {tenant?.name}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">Websites</span>
      </div>
      <div className="flex items-start justify-between mb-5">
        <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          Gestión de Websites
        </h1>
        <button className="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-brand-700">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Añadir Website
        </button>
      </div>
      <QuickStats stats={stats ?? { total: 0, connected: 0, noAccess: 0, error: 0 }} />
      <WebsiteGrid websites={websites ?? []} />
    </div>
  );
}
