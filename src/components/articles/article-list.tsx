"use client";

import { useState } from "react";
import { ArticleRow } from "./article-row";
import type { ArticleData, ArticleStatus } from "@/types/seo";

interface ArticleListProps { articles: ArticleData[]; }

const TABS: { key: ArticleStatus | "all"; label: string }[] = [
  { key: "all", label: "Todos" }, { key: "published", label: "Publicados" }, { key: "draft", label: "Borradores" }, { key: "scheduled", label: "Programados" },
];

export function ArticleList({ articles }: ArticleListProps) {
  const [tab, setTab] = useState<ArticleStatus | "all">("all");
  const filtered = tab === "all" ? articles : articles.filter((a) => a.status === tab);
  const counts = TABS.reduce((acc, t) => { acc[t.key] = t.key === "all" ? articles.length : articles.filter((a) => a.status === t.key).length; return acc; }, {} as Record<string, number>);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex border-b-2 border-gray-200 -mx-5 px-5 mb-0">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-[13.5px] font-medium border-b-2 -mb-[2px] transition-colors flex items-center gap-1.5 ${tab === key ? "text-brand-600 border-brand-600" : "text-gray-500 border-transparent"}`}>
            {label}
            <span className={`rounded-full px-1.5 py-0 text-[11px] font-semibold ${tab === key ? "bg-brand-50 text-brand-600" : "bg-gray-100 text-gray-500"}`}>{counts[key]}</span>
          </button>
        ))}
      </div>
      <div className="divide-y divide-gray-100 -mx-5 px-5">
        {filtered.map((article) => <ArticleRow key={article.id} article={article} />)}
      </div>
      {filtered.length > 5 && (
        <div className="mt-3 text-center"><button className="w-full py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">Ver todos los artículos →</button></div>
      )}
    </div>
  );
}
