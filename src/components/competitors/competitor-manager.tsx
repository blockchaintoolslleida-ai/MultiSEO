"use client";

import { useState } from "react";
import type { CompetitorFull } from "@/types/seo";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";

interface CompetitorManagerProps {
  competitors: CompetitorFull[];
  websiteId: string;
  onRefresh: () => void;
}

export function CompetitorManager({
  competitors,
  websiteId,
  onRefresh,
}: CompetitorManagerProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newDomain, setNewDomain] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editTrend, setEditTrend] = useState("flat");

  const handleAdd = async () => {
    setError(null);
    if (!newDomain.trim()) {
      setError("El dominio es obligatorio");
      return;
    }
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          domain: newDomain.trim(),
          avgPosition: parseFloat(newPosition) || 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setNewDomain("");
      setNewPosition("");
      setAdding(false);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al añadir");
    }
  };

  const handleUpdate = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/competitors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: editDomain.trim(),
          avgPosition: parseFloat(editPosition) || 0,
          trend: editTrend,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setEditingId(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    }
  };

  const handleDelete = async (id: string, domain: string) => {
    setError(null);
    if (!confirm(`¿Eliminar a "${domain}" como competidor?`)) return;
    try {
      const res = await fetch(`/api/competitors/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const startEdit = (c: CompetitorFull) => {
    setEditingId(c.id);
    setEditDomain(c.domain);
    setEditPosition(String(c.avgPosition));
    setEditTrend(c.trend);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 p-5 text-left"
      >
        <h3 className="text-[15px] font-semibold text-gray-900 flex-1">
          ⚙️ Gestionar Competidores
        </h3>
        <span className="text-xs text-gray-400">{competitors.length} competidores</span>
        <span className="text-gray-400 text-xs">{collapsed ? "▼" : "▲"}</span>
      </button>

      {!collapsed && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          {error && (
            <div className="text-[12px] text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
              {error}
            </div>
          )}

          <div className="overflow-x-auto mb-4">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 font-medium text-gray-500">Dominio</th>
                  <th className="text-center py-2 font-medium text-gray-500">Posición</th>
                  <th className="text-center py-2 font-medium text-gray-500">Origen</th>
                  <th className="text-center py-2 font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c) => {
                  const isEditing = editingId === c.id;
                  return (
                    <tr key={c.id} className="border-b border-gray-50">
                      <td className="py-2">
                        {isEditing ? (
                          <input
                            value={editDomain}
                            onChange={(e) => setEditDomain(e.target.value)}
                            className="border border-gray-200 rounded px-2 py-1 w-full text-[12px]"
                          />
                        ) : (
                          c.domain
                        )}
                      </td>
                      <td className="text-center py-2">
                        {isEditing ? (
                          <div className="flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              step="0.1"
                              value={editPosition}
                              onChange={(e) => setEditPosition(e.target.value)}
                              className="border border-gray-200 rounded px-2 py-1 w-16 text-[12px]"
                            />
                            <select
                              value={editTrend}
                              onChange={(e) => setEditTrend(e.target.value)}
                              className="border border-gray-200 rounded px-1 py-1 text-[11px]"
                            >
                              <option value="up">↑</option>
                              <option value="flat">→</option>
                              <option value="down">↓</option>
                            </select>
                          </div>
                        ) : (
                          c.avgPosition
                        )}
                      </td>
                      <td className="text-center py-2">
                        <span
                          className={`text-[10px] px-1.5 py-0 rounded-full ${
                            c.isManual
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {c.isManual ? "manual" : "GSC"}
                        </span>
                      </td>
                      <td className="text-center py-2">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleUpdate(c.id)}
                              className="p-1 hover:bg-green-50 rounded text-green-600"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 hover:bg-gray-50 rounded text-gray-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => startEdit(c)}
                              className="p-1 hover:bg-gray-50 rounded text-gray-400 hover:text-gray-600"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id, c.domain)}
                              className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {adding ? (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <input
                placeholder="dominio.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1.5 text-[12px] flex-1"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Posición"
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1.5 text-[12px] w-20"
              />
              <button
                onClick={handleAdd}
                className="px-3 py-1.5 bg-brand-600 text-white rounded text-[12px] font-medium hover:bg-brand-700"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setAdding(false);
                  setError(null);
                }}
                className="px-2 py-1.5 text-gray-400 hover:text-gray-600 text-[12px]"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 text-[12px] text-brand-600 hover:text-brand-700 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir Competidor Manual
            </button>
          )}
        </div>
      )}
    </div>
  );
}
