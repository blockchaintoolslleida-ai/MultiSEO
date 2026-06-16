"use client";

import {
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Eye,
  Target,
  Award,
  BarChart3,
} from "lucide-react";
import type { RankingsSummary } from "@/types/seo";

interface RankingsSummaryProps {
  summary: RankingsSummary;
  loading?: boolean;
}

const METRICS = [
  {
    key: "avgPosition",
    label: "Posición media",
    icon: Target,
    format: (v: number) => v.toFixed(1),
    color: "text-brand-600",
    bg: "bg-brand-50",
  },
  {
    key: "totalClicks",
    label: "Clics totales",
    icon: MousePointerClick,
    format: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString()),
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    key: "totalImpressions",
    label: "Impresiones",
    icon: Eye,
    format: (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toString()),
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    key: "avgCtr",
    label: "CTR medio",
    icon: BarChart3,
    format: (v: number) => `${(v * 100).toFixed(1)}%`,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    key: "improved",
    label: "Han subido",
    icon: TrendingUp,
    format: (v: number) => v.toString(),
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    key: "declined",
    label: "Han bajado",
    icon: TrendingDown,
    format: (v: number) => v.toString(),
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    key: "top3",
    label: "Top 3",
    icon: Award,
    format: (v: number) => v.toString(),
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
] as const;

export function RankingsSummaryCards({ summary, loading }: RankingsSummaryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
        {METRICS.map((m) => (
          <div
            key={m.key}
            className="bg-white border border-gray-200 rounded-xl p-3.5 animate-pulse"
          >
            <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-5 bg-gray-300 rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-5">
      {METRICS.map((m) => {
        const value = summary[m.key as keyof RankingsSummary] as number;
        const Icon = m.icon;
        return (
          <div key={m.key} className={`${m.bg} border border-gray-200 rounded-xl p-3.5`}>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 mb-1">
              <Icon className={`w-3.5 h-3.5 ${m.color}`} />
              {m.label}
            </div>
            <p className={`text-lg font-bold ${m.color}`}>{m.format(value)}</p>
          </div>
        );
      })}
    </div>
  );
}
