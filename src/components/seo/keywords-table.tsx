"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { KeywordData } from "@/types/seo";

interface KeywordsTableProps {
  keywords: KeywordData[];
}

const DIFFICULTY_CLASSES: Record<string, string> = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  hard: "bg-red-100 text-red-800",
};

export function KeywordsTable({ keywords }: KeywordsTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const perPage = 5;

  const filtered = keywords.filter((k) => k.keyword.toLowerCase().includes(search.toLowerCase()));
  const total = filtered.length;
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
          <Search className="w-[18px] h-[18px] text-brand-500" />
          Keywords Monitorizadas
          <span className="text-xs text-gray-400 font-normal">{total} activas</span>
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
            <input placeholder="Buscar keyword..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg w-[180px] outline-none focus:border-brand-500" />
          </div>
          <button className="flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg bg-white font-medium hover:bg-gray-50">
            <SlidersHorizontal className="w-3 h-3" /> Filtros
          </button>
        </div>
      </div>
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="border-b-2 border-gray-200 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            <th className="text-left p-2.5">Keyword</th><th className="text-right p-2.5">Posición</th><th className="text-right p-2.5">Cambio</th>
            <th className="text-right p-2.5">Volumen</th><th className="text-right p-2.5">Dificultad</th><th className="text-right p-2.5 w-[100px]">Tendencia</th>
          </tr>
        </thead>
        <tbody>
          {paged.map((kw) => (
            <tr key={kw.id} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="p-2.5 font-medium text-gray-900">
                {kw.keyword}
                {kw.isTop3 && <span className="text-[11px] text-green-600 ml-1.5">🟢 top 3</span>}
                {kw.isFalling && <span className="text-[11px] text-red-600 ml-1.5">⚠️ bajando</span>}
              </td>
              <td className={`p-2.5 text-right font-bold ${kw.position <= 10 ? "text-green-600" : kw.position > 15 ? "text-red-600" : ""}`}>#{kw.position}</td>
              <td className={`p-2.5 text-right font-medium ${kw.change > 0 ? "text-green-600" : kw.change < 0 ? "text-red-600" : "text-gray-400"}`}>
                <span className="inline-flex items-center gap-0.5">
                  {kw.change > 0 ? <ArrowUp className="w-3 h-3" /> : kw.change < 0 ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {kw.change > 0 ? "+" : ""}{kw.change}
                </span>
              </td>
              <td className="p-2.5 text-right">{kw.volume >= 1000 ? `${(kw.volume / 1000).toFixed(1)}K` : kw.volume}</td>
              <td className="p-2.5 text-right">
                <span className={`inline-block px-2 py-0.5 rounded-full text-[11.5px] font-medium ${DIFFICULTY_CLASSES[kw.difficulty]}`}>
                  {kw.difficulty === "easy" ? "Bajo" : kw.difficulty === "medium" ? "Medio" : "Alto"}
                </span>
              </td>
              <td className="p-2.5"><Sparkline values={kw.history} trend={kw.change > 0 ? "up" : kw.change < 0 ? "down" : "flat"} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
        <span>Mostrando {paged.length} de {total} keywords</span>
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={`px-2 py-1 rounded-md border text-[11px] font-medium ${i === page ? "border-brand-500 bg-brand-50 text-brand-600" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Sparkline({ values, trend }: { values: number[]; trend: "up" | "down" | "flat" }) {
  const w = 56, h = 20, pad = 2;
  const max = Math.max(...values), min = Math.min(...values), range = max - min || 1;
  const points = values.map((v, i) => `${(i / (values.length - 1)) * (w - pad * 2) + pad},${h - pad - ((v - min) / range) * (h - pad * 2)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block">
      <polyline points={points} fill="none" stroke={trend === "up" ? "#059669" : trend === "down" ? "#dc2626" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
