import { Clock, TrendingUp, Link, Shield } from "lucide-react";
import { KPICard } from "./kpi-card";
import type { KPIData } from "@/types/seo";

interface KPIGridProps {
  kpis: KPIData;
}

export function KPIGrid({ kpis }: KPIGridProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <KPICard label="Posición Media" icon={<Clock className="w-3.5 h-3.5" />} metric={kpis.avgPosition} format="number" />
      <KPICard label="Tráfico Estimado" icon={<TrendingUp className="w-3.5 h-3.5" />} metric={kpis.estimatedTraffic} format="compact" />
      <KPICard label="Backlinks" icon={<Link className="w-3.5 h-3.5" />} metric={kpis.backlinks} format="number" />
      <KPICard label="Salud SEO" icon={<Shield className="w-3.5 h-3.5" />} metric={kpis.healthScore} format="percentage" />
    </div>
  );
}
