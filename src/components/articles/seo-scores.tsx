import type { SEOScores } from "@/types/seo";

interface SEOScoresProps { scores: SEOScores; }

const SCORE_ITEMS: { key: keyof SEOScores; label: string }[] = [
  { key: "keywords", label: "Keywords" }, { key: "readability", label: "Legibilidad" },
  { key: "structure", label: "Estructura" }, { key: "originality", label: "Originalidad" },
];

function scoreColor(v: number): string { if (v >= 80) return "bg-green-500"; if (v >= 60) return "bg-amber-500"; return "bg-red-500"; }
function scoreTextColor(v: number): string { if (v >= 80) return "text-green-600"; if (v >= 60) return "text-amber-600"; return "text-red-600"; }

export function SEOScores({ scores }: SEOScoresProps) {
  return (
    <div className="mt-3.5">
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Puntuación SEO del borrador</p>
      <div className="space-y-2.5">
        {SCORE_ITEMS.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2.5">
            <span className="text-[10.5px] text-gray-400 font-medium w-20 flex justify-between">{label} <span className={scoreTextColor(scores[key])}>{scores[key]}%</span></span>
            <div className="flex-1 h-[5px] bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${scoreColor(scores[key])}`} style={{ width: `${scores[key]}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
