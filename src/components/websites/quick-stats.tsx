import { Globe, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import type { WebsiteStats } from "@/types/seo";

interface QuickStatsProps { stats: WebsiteStats; }

const STAT_ITEMS = [
  { key: "total" as const, label: "Websites activos", icon: Globe, bg: "bg-brand-50", color: "text-brand-600" },
  { key: "connected" as const, label: "Conectados", icon: CheckCircle, bg: "bg-green-50", color: "text-green-600" },
  { key: "noAccess" as const, label: "Sin acceso", icon: AlertTriangle, bg: "bg-amber-50", color: "text-amber-600" },
  { key: "error" as const, label: "Error", icon: XCircle, bg: "bg-red-50", color: "text-red-600" },
];

export function QuickStats({ stats }: QuickStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-3 mb-5">
      {STAT_ITEMS.map(({ key, label, icon: Icon, bg, color }) => (
        <div key={key} className="bg-white border border-gray-200 rounded-[10px] p-3.5 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${bg}`}><Icon className={`w-[18px] h-[18px] ${color}`} /></div>
          <div><p className="text-xl font-bold text-gray-900">{stats[key]}</p><p className="text-xs text-gray-400 font-medium">{label}</p></div>
        </div>
      ))}
    </div>
  );
}
