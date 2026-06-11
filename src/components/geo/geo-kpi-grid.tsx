import type { GEOKPI } from "@/lib/geo/types";

interface Props {
  kpis: GEOKPI;
}

function getSentimentEmoji(sentiment: string): string {
  if (sentiment === "positive") return "👍";
  if (sentiment === "negative") return "👎";
  return "😐";
}

function TrendBadge({ change, trend }: { change: number; trend: string }) {
  const color =
    trend === "up"
      ? "text-green-600"
      : trend === "down"
        ? "text-red-500"
        : "text-gray-400";
  const arrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  return (
    <span className={`text-xs font-medium ${color}`}>
      {arrow}
      {Math.abs(change)}%
    </span>
  );
}

export function GeoKPIGrid({ kpis }: Props) {
  const items = [
    {
      label: "Visibilidad IA",
      value: `${kpis.visibility.value}%`,
      change: kpis.visibility.change,
      trend: kpis.visibility.trend,
      icon: "🤖",
    },
    {
      label: "Brand Mentions",
      value: String(kpis.brandMentions.value),
      change: kpis.brandMentions.change,
      trend: kpis.brandMentions.trend,
      icon: "📣",
    },
    {
      label: "Sentimiento",
      value: getSentimentEmoji(kpis.avgSentiment),
      change: 0,
      trend: "flat",
      icon: "💬",
    },
    {
      label: "Share of Voice",
      value: `${kpis.shareOfVoice.value}%`,
      change: kpis.shareOfVoice.change,
      trend: kpis.shareOfVoice.trend,
      icon: "🎯",
    },
    {
      label: "Queries Activas",
      value: String(kpis.activeQueries.value),
      change: 0,
      trend: "flat",
      icon: "📊",
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-3 mb-5">
      {items.map((item) => (
        <div
          key={item.label}
          className="bg-white border border-gray-200 rounded-[10px] p-3.5"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg">{item.icon}</span>
            <p className="text-xs text-gray-400 font-medium">{item.label}</p>
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-xl font-bold text-gray-900">{item.value}</p>
            {item.change !== 0 && (
              <TrendBadge change={item.change} trend={item.trend} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
