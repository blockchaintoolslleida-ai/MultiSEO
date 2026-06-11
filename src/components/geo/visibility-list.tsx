import type { GEOQueryResult } from "@/lib/geo/types";

interface Props {
  results: GEOQueryResult[];
}

export function VisibilityList({ results }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-[10px] p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        Visibilidad por Query
      </h3>
      {results.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">
          Sin resultados. Ejecuta un escaneo GEO.
        </p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {results.map((r) => (
            <div
              key={r.queryId}
              className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100"
            >
              <span
                className={`mt-0.5 text-sm ${
                  r.brandMentioned ? "text-green-500" : "text-red-400"
                }`}
              >
                {r.brandMentioned ? "✅" : "❌"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">
                  {r.query}
                </p>
                {r.snippet && (
                  <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 italic">
                    &ldquo;{r.snippet}&rdquo;
                  </p>
                )}
                {!r.brandMentioned && (
                  <p className="text-[11px] text-red-400 mt-0.5">
                    Marca no mencionada
                  </p>
                )}
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  r.sentiment === "positive"
                    ? "bg-green-50 text-green-600"
                    : r.sentiment === "negative"
                      ? "bg-red-50 text-red-500"
                      : "bg-gray-100 text-gray-500"
                }`}
              >
                {r.sentiment}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
