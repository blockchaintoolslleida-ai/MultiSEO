import type { GEORecommendation } from "@/lib/geo/types";

interface Props {
  recommendations: GEORecommendation[];
}

const ICONS: Record<string, string> = {
  content: "📝",
  backlinks: "🔗",
  technical: "🏗️",
};

const PRIORITY_CLASSES: Record<string, string> = {
  high: "bg-red-50 text-red-600 border-red-200",
  medium: "bg-amber-50 text-amber-600 border-amber-200",
  low: "bg-blue-50 text-blue-600 border-blue-200",
};

export function RecommendationsPanel({ recommendations }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-[10px] p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span>🧠</span> Recomendaciones Accionables
      </h3>
      {recommendations.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">
          Sin recomendaciones aún. Ejecuta un escaneo GEO.
        </p>
      ) : (
        <div className="space-y-2.5">
          {recommendations.map((rec, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border border-gray-100 bg-gray-50/50"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-lg">{ICONS[rec.type] || "📌"}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {rec.title}
                    </h4>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${
                        PRIORITY_CLASSES[rec.priority]
                      }`}
                    >
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {rec.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
