import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { KPIMetric } from "@/types/seo";

interface KPICardProps {
  label: string;
  icon: React.ReactNode;
  metric: KPIMetric;
  format?: "number" | "percentage" | "compact";
}

export function KPICard({ label, icon, metric, format = "number" }: KPICardProps) {
  const TrendIcon = metric.trend === "up" ? TrendingUp : metric.trend === "down" ? TrendingDown : Minus;
  const trendColor = metric.trend === "up" ? "text-success" : metric.trend === "down" ? "text-danger" : "text-gray-400";
  const valueColor = metric.trend === "up" ? "text-success" : metric.trend === "down" ? "text-danger" : "text-gray-900";

  const formattedValue = format === "percentage"
    ? `${metric.value}%`
    : format === "compact"
    ? metric.value >= 1000 ? `${(metric.value / 1000).toFixed(1)}K` : String(metric.value)
    : metric.value.toLocaleString();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-[18px_20px] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow">
      <p className="text-xs font-medium text-gray-500 tracking-wide flex items-center gap-1">
        {icon} {label}
      </p>
      <p className={`text-[30px] font-bold mt-0.5 -tracking-[0.5px] ${valueColor}`}>
        {formattedValue}
      </p>
      <p className={`text-[12.5px] font-semibold flex items-center gap-1 mt-1 ${trendColor}`}>
        <TrendIcon className="w-3 h-3" />
        {metric.trend === "up" && "+"}{metric.change}
        {format === "percentage" ? "%" : ""}
        <span className="text-gray-400 font-normal ml-1">
          {metric.trend === "up" ? "vs mes anterior" : metric.trend === "down" ? "bajando" : "sin cambios"}
        </span>
      </p>
    </div>
  );
}
