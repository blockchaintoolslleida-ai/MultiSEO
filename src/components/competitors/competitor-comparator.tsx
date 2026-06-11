"use client";

import { useState } from "react";
import type { CompetitorFull, OverlapMatrixRow } from "@/types/seo";

interface CompetitorComparatorProps {
  competitors: CompetitorFull[];
  matrix: OverlapMatrixRow[];
  yourDomain: string;
  yourPosition: number;
}

export function CompetitorComparator({
  competitors,
  matrix,
  yourDomain,
  yourPosition,
}: CompetitorComparatorProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < 3) {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selected = competitors.filter((c) => selectedIds.has(c.id));
  const columns: { domain: string; avgPosition: number; isYou: boolean; id?: string; trafficEstimate?: number }[] = [
    { domain: yourDomain, avgPosition: yourPosition, isYou: true },
    ...selected.map((c) => ({
      domain: c.domain,
      avgPosition: c.avgPosition,
      isYou: false,
      id: c.id,
      trafficEstimate: c.trafficEstimate,
    })),
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
        ⚖️ Comparador
      </h3>
      <p className="text-[12px] text-gray-400 mb-3">
        Selecciona hasta 3 competidores para comparar
      </p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {competitors
          .filter((c) => !c.domain.includes(yourDomain))
          .map((c) => (
            <button
              key={c.id}
              onClick={() => toggleSelect(c.id)}
              className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                selectedIds.has(c.id)
                  ? "bg-brand-100 border-brand-300 text-brand-700"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {c.domain}
            </button>
          ))}
      </div>

      {selected.length > 0 && (
        <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map((col) => (
            <div
              key={col.domain}
              className={`rounded-lg p-3 border ${
                col.isYou
                  ? "border-brand-300 bg-brand-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="text-[13px] font-semibold text-gray-800 mb-1 flex items-center gap-1">
                {col.domain.length > 18 ? col.domain.slice(0, 18) + "…" : col.domain}
                {col.isYou && (
                  <span className="text-[10px] bg-brand-200 text-brand-700 rounded-full px-1">
                    tú
                  </span>
                )}
              </div>
              <div className="text-[11px] text-gray-500 mb-2">
                Pos. media: <strong>{col.avgPosition}</strong>
              </div>
              {!col.isYou && col.trafficEstimate && (
                <div className="text-[11px] text-gray-500 mb-2">
                  Tráfico est.: <strong>{col.trafficEstimate.toLocaleString()}</strong>
                </div>
              )}
              <div className="text-[11px] text-gray-500">
                <span className="font-medium">Top keywords:</span>
                <ul className="mt-1 space-y-0.5">
                  {matrix
                    .filter((row) =>
                      row.competitors.some(
                        (c) => c.domain === col.domain
                      )
                    )
                    .slice(0, 5)
                    .map((row) => (
                      <li key={row.keywordId} className="text-gray-600 flex justify-between">
                        <span>{row.keyword}</span>
                        <span className="font-medium">
                          {row.competitors.find((c) => c.domain === col.domain)?.position ?? "—"}
                        </span>
                      </li>
                    ))}
                  {matrix.filter((row) =>
                    row.competitors.some((c) => c.domain === col.domain)
                  ).length === 0 && (
                    <li className="text-gray-400">Sin datos de solapamiento</li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
