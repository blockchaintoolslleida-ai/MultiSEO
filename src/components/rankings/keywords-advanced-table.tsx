"use client";

import { useState } from "react";
import {
  Search, SlidersHorizontal, ArrowUp, ArrowDown, Minus,
  Trash2, ChevronLeft, ChevronRight, X, Check, Pencil,
  TrendingUp, TrendingDown, BarChart3, Filter,
} from "lucide-react";
import type { KeywordData } from "@/types/seo";

interface KeywordsAdvancedTableProps {
  keywords: KeywordData[];
  total: number;
  page: number;
  totalPages: number;
  summary: {
    total: number;
    easy: number;
    medium: number;
    hard: number;
    top3: number;
    falling: number;
    avgPosition: number;
  };
  onSearch: (search: string) => void;
  onSort: (sort: string, order: string) => void;
  onPage: (page: number) => void;
  onDifficulty: (difficulty: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, field: string, value: number | string) => void;
  onBulkAction?: (action: string, ids: string[]) => void;
  loading?: boolean;
}

const DIFFICULTY_CLASSES: Record<string, string> = {
  easy: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  hard: "bg-red-100 text-red-800",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Bajo",
  medium: "Medio",
  hard: "Alto",
};

export function KeywordsAdvancedTable({
  keywords, total, page, totalPages, summary,
  onSearch, onSort, onPage, onDifficulty, onDelete, onUpdate,
  loading,
}: KeywordsAdvancedTableProps) {
  const [searchVal, setSearchVal] = useState("");
  const [sortField, setSortField] = useState("position");
  const [sortOrder, setSortOrder] = useState("asc");
  const [activeDifficulty, setActiveDifficulty] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPosition, setEditPosition] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const handleSearch = () => {
    onSearch(searchVal);
  };

  const handleSort = (field: string) => {
    const newOrder = field === sortField && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(newOrder);
    onSort(field, newOrder);
  };

  const handleDifficulty = (diff: string) => {
    const next = activeDifficulty === diff ? "" : diff;
    setActiveDifficulty(next);
    onDifficulty(next);
  };

  const toggleAll = () => {
    if (selected.size === keywords.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(keywords.map((k) => k.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const startEdit = (kw: KeywordData) => {
    setEditingId(kw.id);
    setEditPosition(kw.position);
  };

  const saveEdit = (id: string) => {
    onUpdate(id, "position", editPosition);
    setEditingId(null);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (field !== sortField) return <div className="w-3 h-3 opacity-0"><ArrowUp className="w-3 h-3" /></div>;
    return sortOrder === "asc"
      ? <ArrowUp className="w-3 h-3 text-brand-600" />
      : <ArrowDown className="w-3 h-3 text-brand-600" />;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl">
      {/* Header with search and filters */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-[18px] h-[18px] text-brand-500" />
              Rankings de Keywords
            </h3>
            <span className="text-xs text-gray-400">{total} keywords</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
              <input
                placeholder="Buscar keyword..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg w-[200px] outline-none focus:border-brand-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 border rounded-lg font-medium transition-colors ${
                showFilters || activeDifficulty
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
              }`}
            >
              <Filter className="w-3 h-3" /> Filtros
            </button>
          </div>
        </div>

        {/* Summary bar */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <span className="text-[11px] text-gray-400">
            Pos. media: <strong className="text-gray-700">{summary.avgPosition}</strong>
          </span>
          <span className="text-[11px] text-gray-400">
            Top 3: <strong className="text-green-600">{summary.top3}</strong>
          </span>
          <span className="text-[11px] text-gray-400">
            Bajando: <strong className="text-red-600">{summary.falling}</strong>
          </span>
          <div className="flex items-center gap-1.5 ml-auto">
            {["easy", "medium", "hard"].map((d) => (
              <button
                key={d}
                onClick={() => handleDifficulty(d)}
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                  activeDifficulty === d
                    ? DIFFICULTY_CLASSES[d]
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {DIFFICULTY_LABELS[d]} ({summary[d as keyof typeof summary]})
              </button>
            ))}
          </div>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 flex-wrap">
            <span className="text-[11px] text-gray-400">Ordenar por:</span>
            {[
              { f: "position", label: "Posición" },
              { f: "volume", label: "Volumen" },
              { f: "keyword", label: "Alfabético" },
              { f: "change", label: "Cambio" },
            ].map(({ f, label }) => (
              <button
                key={f}
                onClick={() => handleSort(f)}
                className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                  sortField === f
                    ? "bg-brand-100 text-brand-700"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {label} {sortField === f && (sortOrder === "asc" ? "↑" : "↓")}
              </button>
            ))}
            {activeDifficulty && (
              <button
                onClick={() => { setActiveDifficulty(""); onDifficulty(""); }}
                className="text-[11px] px-2 py-1 rounded-md text-red-600 hover:bg-red-50 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b-2 border-gray-200 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              <th className="text-left p-2.5 w-8">
                <input
                  type="checkbox"
                  checked={selected.size === keywords.length && keywords.length > 0}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 rounded border-gray-300"
                />
              </th>
              <th className="text-left p-2.5 cursor-pointer hover:text-gray-600" onClick={() => handleSort("keyword")}>
                <span className="inline-flex items-center gap-1">Keyword <SortIcon field="keyword" /></span>
              </th>
              <th className="text-right p-2.5 cursor-pointer hover:text-gray-600" onClick={() => handleSort("position")}>
                <span className="inline-flex items-center gap-1 justify-end">Posición <SortIcon field="position" /></span>
              </th>
              <th className="text-right p-2.5 cursor-pointer hover:text-gray-600" onClick={() => handleSort("change")}>
                <span className="inline-flex items-center gap-1 justify-end">Cambio <SortIcon field="change" /></span>
              </th>
              <th className="text-right p-2.5 cursor-pointer hover:text-gray-600" onClick={() => handleSort("volume")}>
                <span className="inline-flex items-center gap-1 justify-end">Volumen <SortIcon field="volume" /></span>
              </th>
              <th className="text-right p-2.5">Dificultad</th>
              <th className="text-right p-2.5 w-[80px]">Tendencia</th>
              <th className="text-right p-2.5 w-[80px]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {keywords.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-400 text-sm">
                  {loading ? "Cargando..." : "No se encontraron keywords"}
                </td>
              </tr>
            )}
            {keywords.map((kw) => (
              <tr
                key={kw.id}
                className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${
                  selected.has(kw.id) ? "bg-brand-50/50" : ""
                }`}
              >
                <td className="p-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(kw.id)}
                    onChange={() => toggleOne(kw.id)}
                    className="w-3.5 h-3.5 rounded border-gray-300"
                  />
                </td>
                <td className="p-2.5 font-medium text-gray-900">
                  <div className="flex items-center gap-1.5">
                    {kw.keyword}
                    {kw.isTop3 && <span className="text-[10px] px-1 py-0.5 rounded bg-green-100 text-green-700 font-medium">TOP 3</span>}
                    {kw.isFalling && <span className="text-[10px] px-1 py-0.5 rounded bg-red-100 text-red-700 font-medium">⚠</span>}
                  </div>
                </td>
                <td className="p-2.5 text-right">
                  {editingId === kw.id ? (
                    <div className="flex items-center gap-1 justify-end">
                      <input
                        type="number"
                        value={editPosition}
                        onChange={(e) => setEditPosition(parseInt(e.target.value) || 0)}
                        className="w-14 text-xs border border-brand-300 rounded px-1.5 py-0.5 text-center outline-none focus:border-brand-500"
                        autoFocus
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(kw.id)}
                      />
                      <button onClick={() => saveEdit(kw.id)} className="text-green-600 hover:text-green-800"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <span
                      className={`font-bold cursor-pointer hover:underline ${
                        kw.position <= 3 ? "text-green-600" : kw.position <= 10 ? "text-amber-600" : kw.position > 20 ? "text-red-600" : "text-gray-700"
                      }`}
                      onClick={() => startEdit(kw)}
                      title="Click para editar"
                    >
                      #{kw.position}
                    </span>
                  )}
                </td>
                <td className={`p-2.5 text-right font-medium ${
                  kw.change > 0 ? "text-green-600" : kw.change < 0 ? "text-red-600" : "text-gray-400"
                }`}>
                  <span className="inline-flex items-center gap-0.5">
                    {kw.change > 0 ? <TrendingUp className="w-3 h-3" /> : kw.change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {kw.change > 0 ? "+" : ""}{kw.change}
                  </span>
                </td>
                <td className="p-2.5 text-right text-gray-600">
                  {kw.volume >= 1000 ? `${(kw.volume / 1000).toFixed(1)}K` : kw.volume}
                </td>
                <td className="p-2.5 text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${DIFFICULTY_CLASSES[kw.difficulty]}`}>
                    {DIFFICULTY_LABELS[kw.difficulty]}
                  </span>
                </td>
                <td className="p-2.5">
                  <MiniSparkline values={kw.history} trend={kw.change > 0 ? "up" : kw.change < 0 ? "down" : "flat"} />
                </td>
                <td className="p-2.5 text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => startEdit(kw)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      title="Editar posición"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`¿Eliminar "${kw.keyword}"?`)) onDelete(kw.id); }}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t border-gray-100 text-xs text-gray-400">
        <span>Mostrando página {page + 1} de {totalPages || 1} · {total} keywords</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPage(page - 1)}
            disabled={page === 0}
            className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 7) {
              pageNum = i;
            } else if (page < 4) {
              pageNum = i < 6 ? i : totalPages - 1;
            } else if (page >= totalPages - 4) {
              pageNum = i === 0 ? 0 : totalPages - 7 + i;
            } else {
              pageNum = i === 0 ? 0 : i === 6 ? totalPages - 1 : page - 3 + i;
            }
            const isEllipsis = (i === 1 && pageNum > 1) || (i === 5 && pageNum < totalPages - 2);
            if (isEllipsis) {
              return <span key={i} className="px-1 text-gray-300">…</span>;
            }
            return (
              <button
                key={i}
                onClick={() => onPage(pageNum)}
                className={`px-2 py-1 rounded border text-[11px] font-medium ${
                  pageNum === page
                    ? "border-brand-500 bg-brand-50 text-brand-600"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                {pageNum + 1}
              </button>
            );
          })}
          <button
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniSparkline({ values, trend }: { values: number[]; trend: "up" | "down" | "flat" }) {
  if (!values || values.length < 2) {
    return <div className="w-10 h-5 flex items-center justify-center"><Minus className="w-3 h-3 text-gray-300" /></div>;
  }
  const w = 48, h = 20, pad = 2;
  const max = Math.max(...values), min = Math.min(...values), range = max - min || 1;
  const points = values
    .map((v, i) => `${((i / (values.length - 1)) * (w - pad * 2) + pad).toFixed(1)},${(h - pad - ((v - min) / range) * (h - pad * 2)).toFixed(1)}`)
    .join(" ");
  const color = trend === "up" ? "#059669" : trend === "down" ? "#dc2626" : "#9ca3af";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
