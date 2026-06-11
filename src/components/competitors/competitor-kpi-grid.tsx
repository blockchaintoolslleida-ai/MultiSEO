"use client";

import type { CompetitorKPIs } from "@/types/seo";

interface CompetitorKPIGridProps {
  kpis: CompetitorKPIs;
}

export function CompetitorKPIGrid({ kpis }: CompetitorKPIGridProps) {
  const cards = [
    {
      label: "Competidores",
      value: kpis.totalCompetitors,
      sub: "trackeados",
      color: "brand",
    },
    {
      label: "Tu Posición Media",
      value: kpis.yourAvgPosition,
      sub: `Top 3: ${kpis.top3AvgPosition}`,
      color: kpis.yourAvgPosition <= kpis.top3AvgPosition ? "green" : "amber",
    },
    {
      label: "Keywords Solapadas",
      value: kpis.overlappingKeywords,
      sub: "compartidas",
      color: "violet",
    },
    {
      label: "Amenazas Activas",
      value: kpis.activeThreats,
      sub: kpis.activeThreats > 0 ? "requieren atención" : "todo bajo control",
      color: kpis.activeThreats > 0 ? "red" : "green",
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string }> = {
    brand: { bg: "bg-brand-50", text: "text-brand-700" },
    green: { bg: "bg-green-50", text: "text-green-700" },
    amber: { bg: "bg-amber-50", text: "text-amber-700" },
    violet: { bg: "bg-violet-50", text: "text-violet-700" },
    red: { bg: "bg-red-50", text: "text-red-700" },
  };

  return (
    <div className="grid grid-cols-4 gap-4 mb-5">
      {cards.map((card) => {
        const c = colorClasses[card.color] ?? colorClasses.brand;
        return (
          <div key={card.label} className={`${c.bg} rounded-xl p-4`}>
            <div className={`text-xs font-medium mb-1 ${c.text}`}>{card.label}</div>
            <div className={`text-2xl font-bold ${c.text}`}>{card.value}</div>
            <div className={`text-xs mt-1 ${c.text} opacity-70`}>{card.sub}</div>
          </div>
        );
      })}
    </div>
  );
}
