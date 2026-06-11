import { Clock } from "lucide-react";
import { AlertBanner } from "./alert-banner";
import type { CompetitorData } from "@/types/seo";

interface CompetitorPanelProps {
  competitors: CompetitorData[];
}

const COMPETITOR_COLORS = [
  "bg-gradient-to-r from-brand-500 to-brand-400",
  "bg-gradient-to-r from-red-500 to-red-400",
  "bg-gradient-to-r from-amber-500 to-amber-400",
  "bg-gradient-to-r from-violet-500 to-violet-400",
  "bg-gradient-to-r from-pink-500 to-pink-400",
];

export function CompetitorPanel({ competitors }: CompetitorPanelProps) {
  const alertComp = competitors.find((c) => c.highlightChange);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <Clock className="w-[18px] h-[18px] text-brand-500" />
        Competidores
        <span className="text-xs text-gray-400 font-normal ml-auto">Posición media</span>
      </h3>
      <div className="flex flex-col gap-0.5">
        {competitors.map((c, i) => (
          <div key={c.domain} className={`flex items-center gap-2.5 py-2.5 px-2 rounded-lg ${c.rank === 1 ? "bg-brand-50" : ""}`}>
            <span className={`font-bold text-lg w-9 text-center ${c.rank === 1 ? "text-brand-600" : "text-gray-700"}`}>{c.rank}</span>
            <span className={`flex-1 text-[13px] ${c.rank === 1 ? "font-semibold" : ""}`}>{c.domain}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${COMPETITOR_COLORS[i] || "bg-gray-400"}`} style={{ width: `${Math.max((c.avgPosition / 15) * 100, 10)}%` }} />
            </div>
            <strong className={`text-[15px] w-9 text-right ${c.rank === 1 ? "text-brand-600" : ""}`}>{c.avgPosition}</strong>
          </div>
        ))}
      </div>
      {alertComp && <AlertBanner message={`${alertComp.domain} ha mejorado sus posiciones esta semana`} className="mt-4" />}
    </div>
  );
}
