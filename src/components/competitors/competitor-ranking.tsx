"use client";

import { useState } from "react";
import type { CompetitorFull } from "@/types/seo";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

interface CompetitorRankingProps {
  competitors: CompetitorFull[];
  onSelect?: (id: string) => void;
}

const BAR_COLORS = [
  "bg-gradient-to-r from-brand-500 to-brand-400",
  "bg-gradient-to-r from-red-500 to-red-400",
  "bg-gradient-to-r from-amber-500 to-amber-400",
  "bg-gradient-to-r from-violet-500 to-violet-400",
  "bg-gradient-to-r from-pink-500 to-pink-400",
  "bg-gradient-to-r from-cyan-500 to-cyan-400",
  "bg-gradient-to-r from-indigo-500 to-indigo-400",
  "bg-gradient-to-r from-teal-500 to-teal-400",
];

export function CompetitorRanking({ competitors, onSelect }: CompetitorRankingProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <TrendingUp className="w-3.5 h-3.5 text-green-500" />;
    if (trend === "down") return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
    return <Minus className="w-3.5 h-3.5 text-gray-400" />;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
      <h3 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
        🏆 Ranking de Competidores
        <span className="text-xs text-gray-400 font-normal ml-auto">Posición media</span>
      </h3>

      <div className="flex flex-col gap-0.5">
        {competitors.map((c, i) => {
          const isExpanded = expandedId === c.id;
          const isYou = c.rank === 1;

          return (
            <div key={c.id}>
              <button
                onClick={() => {
                  setExpandedId(isExpanded ? null : c.id);
                  onSelect?.(c.id);
                }}
                className={`w-full flex items-center gap-2.5 py-2.5 px-2 rounded-lg text-left transition-colors ${
                  isYou ? "bg-brand-50" : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`font-bold text-lg w-9 text-center ${
                    isYou ? "text-brand-600" : "text-gray-700"
                  }`}
                >
                  {c.rank}
                </span>
                <span className={`flex-1 text-[13px] ${isYou ? "font-semibold" : ""}`}>
                  {c.domain}
                  {isYou && (
                    <span className="ml-1.5 text-[10px] bg-brand-200 text-brand-700 rounded-full px-1.5 py-0">
                      tú
                    </span>
                  )}
                  {c.isManual && (
                    <span className="ml-1.5 text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0">
                      manual
                    </span>
                  )}
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${BAR_COLORS[i] || "bg-gray-400"}`}
                    style={{ width: `${Math.min(Math.max((c.avgPosition / 15) * 100, 8), 100)}%` }}
                  />
                </div>
                <strong
                  className={`text-[15px] w-9 text-right ${isYou ? "text-brand-600" : ""}`}
                >
                  {c.avgPosition}
                </strong>
                <TrendIcon trend={c.trend} />
                {c.highlightChange && (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                )}
                <span className="w-4 text-gray-400">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
              </button>

              {isExpanded && (
                <div className="ml-12 mr-4 mb-2 p-3 bg-gray-50 rounded-lg text-[12px] text-gray-600 flex gap-6">
                  <div>
                    <span className="font-medium text-gray-700">Keywords compartidas:</span>{" "}
                    {c.keywordsOverlap.length}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Tráfico estimado:</span>{" "}
                    {c.trafficEstimate.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Actualizado:</span>{" "}
                    {c.lastUpdated
                      ? new Date(c.lastUpdated).toLocaleDateString("es-ES")
                      : "—"}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
