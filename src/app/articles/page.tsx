"use client";

import { useState, useCallback } from "react";
import { useApi } from "@/hooks/use-api";
import { useTenant } from "@/hooks/use-tenant";
import type { ArticleData } from "@/types/seo";
import { ArticleList } from "@/components/articles/article-list";
import { ArticleCalendar } from "@/components/articles/article-calendar";
import { ArticlePreview } from "@/components/articles/article-preview";
import { ArticleWizard } from "@/components/articles/article-wizard";

interface ArticleStats {
  total: number;
  published: number;
  draft: number;
  scheduled: number;
  generating: number;
}

export default function ArticlesPage() {
  const { tenant } = useTenant();
  const [wizardOpen, setWizardOpen] = useState(false);
  const { data: articles, loading: aLoading, refetch: refetchArticles } = useApi<ArticleData[]>(
    tenant ? `/api/articles?tenantId=${tenant.id}` : ""
  );
  const { data: stats, loading: sLoading, refetch: refetchStats } = useApi<ArticleStats>(
    tenant ? `/api/articles/stats?tenantId=${tenant.id}` : ""
  );
  const loading = aLoading || sLoading || !tenant;

  const handleArticleCreated = useCallback(() => {
    refetchArticles();
    refetchStats();
  }, [refetchArticles, refetchStats]);

  const draftArticle = articles?.find((a) => a.status === "draft");

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando artículos...</p>
        </div>
      </div>
    );
  }

  const s = stats ?? { total: 0, published: 0, draft: 0, scheduled: 0, generating: 0 };
  const articleList = articles ?? [];

  return (
    <div>
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-5">
        <span className="text-brand-600 inline-flex items-center gap-1">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          {tenant?.name}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span>sitioweb.com</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        <span className="text-gray-700 font-medium">Artículos</span>
      </div>
      <div className="flex items-start justify-between mb-4">
        <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Artículos Automáticos
        </h1>
        <div className="flex gap-2">
          <button className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-gray-50">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Ayuda IA
          </button>
          <button onClick={() => setWizardOpen(true)} className="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-brand-700">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Generar Artículo
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { value: s.total, label: "Artículos generados", bg: "bg-brand-50", color: "text-brand-600", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2 14 8 20 8" },
          { value: s.published, label: "Publicados", bg: "bg-green-50", color: "text-green-600", icon: "M20 6 9 17 4 12" },
          { value: s.draft, label: "Borradores", bg: "bg-amber-50", color: "text-amber-600", icon: "" },
          { value: s.scheduled, label: "Programados", bg: "bg-purple-50", color: "text-purple-600", icon: "" },
        ].map(({ value, label, bg, color, icon }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-[10px] p-3.5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${bg}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={color}>
                <path d={icon || (label === "Borradores" ? "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z")}/>
              </svg>
            </div>
            <div><p className="text-xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-400 font-medium">{label}</p></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ArticleList articles={articleList} />
        <div className="flex flex-col gap-4">
          <ArticleCalendar />
          {draftArticle && <ArticlePreview article={draftArticle} />}
        </div>
      </div>
      <ArticleWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        tenantId={tenant?.id ?? ""}
        onCreated={handleArticleCreated}
      />
    </div>
  );
}
