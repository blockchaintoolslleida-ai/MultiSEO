"use client";

import type { CompetitorRecommendation } from "@/types/seo";
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, PlusCircle } from "lucide-react";

interface CompetitorIntelligenceProps {
  recommendations: CompetitorRecommendation[];
}

const typeConfig: Record<
  string,
  { icon: typeof Sparkles; label: string; color: string }
> = {
  gap: { icon: TrendingUp, label: "Gap detectado", color: "text-red-600 bg-red-50" },
  threat: { icon: AlertTriangle, label: "Amenaza", color: "text-amber-600 bg-amber-50" },
  opportunity: { icon: Lightbulb, label: "Oportunidad", color: "text-green-600 bg-green-50" },
  new_competitor: { icon: PlusCircle, label: "Nuevo", color: "text-blue-600 bg-blue-50" },
};

const priorityBadge: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

export function CompetitorIntelligence({
  recommendations,
}: CompetitorIntelligenceProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
      <h3 className="text-[15px] font-semibold text-gray-900 mb-1 flex items-center gap-2">
        <Sparkles className="w-[18px] h-[18px] text-brand-500" />
        Intelligence
        <span className="text-xs text-gray-400 font-normal">
          ({recommendations.length} recomendaciones)
        </span>
      </h3>
      <p className="text-[12px] text-gray-400 mb-4">
        Recomendaciones generadas automáticamente basadas en análisis competitivo
      </p>

      {recommendations.length === 0 ? (
        <p className="text-[13px] text-gray-400 text-center py-8">
          No hay recomendaciones por ahora. Sincroniza GSC o añade competidores para recibir insights.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {recommendations.map((rec, i) => {
            const config = typeConfig[rec.type] ?? typeConfig.gap;
            const Icon = config.icon;
            return (
              <div
                key={i}
                className="border border-gray-100 rounded-lg p-3 flex items-start gap-3 hover:bg-gray-50/50 transition-colors"
              >
                <div className={`p-1.5 rounded-lg ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-medium text-gray-800">
                      {rec.title}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${priorityBadge[rec.priority] ?? priorityBadge.medium}`}
                    >
                      {rec.priority === "high"
                        ? "alta"
                        : rec.priority === "medium"
                          ? "media"
                          : "baja"}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-500 mb-2">{rec.description}</p>
                  <button className="text-[11px] font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-md transition-colors">
                    {rec.actionLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
