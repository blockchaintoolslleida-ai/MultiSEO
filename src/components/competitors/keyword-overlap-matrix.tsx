"use client";

import type { OverlapMatrixRow } from "@/types/seo";

interface KeywordOverlapMatrixProps {
  matrix: OverlapMatrixRow[];
  competitorDomains: string[];
}

export function KeywordOverlapMatrix({
  matrix,
  competitorDomains,
}: KeywordOverlapMatrixProps) {
  if (matrix.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-4">
          🔗 Keywords Compartidas
        </h3>
        <p className="text-[13px] text-gray-400 text-center py-8">
          No se encontraron keywords compartidas con competidores.
        </p>
      </div>
    );
  }

  const domains = competitorDomains.slice(0, 5);

  function positionColor(position: number): string {
    if (position <= 3) return "bg-green-100 text-green-700";
    if (position <= 10) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-[15px] font-semibold text-gray-900 mb-4">
        🔗 Keywords Compartidas
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-2 font-medium text-gray-500">Keyword</th>
              <th className="text-center py-2 font-medium text-gray-500">Tú</th>
              {domains.map((d) => (
                <th key={d} className="text-center py-2 font-medium text-gray-500">
                  {d.length > 15 ? d.slice(0, 15) + "…" : d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.slice(0, 15).map((row) => (
              <tr key={row.keywordId} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-2 font-medium text-gray-700">{row.keyword}</td>
                <td className="text-center py-2">
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded font-medium ${positionColor(row.yourPosition)}`}
                  >
                    {row.yourPosition}
                  </span>
                </td>
                {domains.map((d) => {
                  const comp = row.competitors.find((c) => c.domain === d);
                  return (
                    <td key={d} className="text-center py-2">
                      {comp ? (
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded font-medium ${positionColor(comp.position)}`}
                        >
                          {comp.position}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-100" /> Top 3
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-100" /> 4-10
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-100" /> 11+
        </span>
      </div>
    </div>
  );
}
