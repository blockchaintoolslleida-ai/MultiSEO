"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api-client";

interface GeoQuery {
  id: string;
  keyword: string;
  query: string;
  source: string;
  enabled: number;
}

interface Props {
  queries: GeoQuery[];
  websiteId: string;
  onRefresh: () => void;
}

export function QueryManager({ queries, websiteId, onRefresh }: Props) {
  const [adding, setAdding] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newQuery, setNewQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newKeyword.trim() || !newQuery.trim()) return;
    setError(null);
    try {
      await apiFetch("/api/geo/queries", {
        method: "POST",
        body: {
          websiteId,
          keyword: newKeyword.trim(),
          query: newQuery.trim(),
        },
      });
      setNewKeyword("");
      setNewQuery("");
      setAdding(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/api/geo/queries/${id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-[10px] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Gestión de Queries GEO</h3>
        <button
          onClick={() => setAdding(!adding)}
          className="text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          {adding ? "Cancelar" : "+ Añadir Query Manual"}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      {adding && (
        <div className="flex flex-col gap-2 mb-3 p-3 bg-gray-50 rounded-lg">
          <input
            type="text"
            placeholder="Keyword (ej: seo barcelona)"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-brand-400"
          />
          <input
            type="text"
            placeholder="Query conversacional (ej: ¿qué agencia SEO me recomiendas?)"
            value={newQuery}
            onChange={(e) => setNewQuery(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-brand-400"
          />
          <button
            onClick={handleAdd}
            className="text-xs bg-brand-600 text-white rounded px-3 py-1.5 font-medium hover:bg-brand-700 self-end"
          >
            Añadir
          </button>
        </div>
      )}

      {queries.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">
          No hay queries GEO. Las queries se generan automáticamente desde las keywords SEO.
        </p>
      ) : (
        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 font-medium text-gray-400">Query</th>
                <th className="text-left py-2 font-medium text-gray-400">Fuente</th>
                <th className="text-left py-2 font-medium text-gray-400">Estado</th>
                <th className="text-right py-2 font-medium text-gray-400">Acción</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((q) => (
                <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2 pr-2">
                    <p className="text-gray-800 truncate max-w-[300px]">{q.query}</p>
                    <p className="text-gray-400 text-[10px]">{q.keyword}</p>
                  </td>
                  <td className="py-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        q.source === "manual"
                          ? "bg-purple-50 text-purple-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {q.source}
                    </span>
                  </td>
                  <td className="py-2">
                    <span
                      className={`text-[10px] ${q.enabled ? "text-green-600" : "text-gray-400"}`}
                    >
                      {q.enabled ? "activa" : "inactiva"}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    {q.source === "manual" && (
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="text-red-400 hover:text-red-600 text-[10px] font-medium"
                      >
                        🗑
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
