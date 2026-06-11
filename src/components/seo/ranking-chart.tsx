"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";
import type { RankingPoint } from "@/types/seo";

interface RankingChartProps {
  data: RankingPoint[];
}

export function RankingChart({ data }: RankingChartProps) {
  const chartData = data.map((d) => ({ ...d, avgPosition: Math.round(d.avgPosition * 10) / 10 }));
  const firstVal = chartData[0]?.avgPosition ?? 0;
  const lastVal = chartData[chartData.length - 1]?.avgPosition ?? 0;
  const improvement = firstVal > 0 ? ((firstVal - lastVal) / firstVal) * 100 : 0;
  const isUp = improvement > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-[18px] h-[18px] text-brand-500" />
          Evolución de Posicionamiento
        </h3>
        <span className="text-xs text-gray-400">Últimos 30 días</span>
      </div>
      <div className="h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval={3} />
            <YAxis domain={[0, "dataMax + 2"]} hide />
            <Tooltip formatter={(value) => [`Posición ${value}`, ""]} contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
            <Bar dataKey="avgPosition" radius={[4, 4, 0, 0]} fill="url(#barGradient)" maxBarSize={14} />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="100%" stopColor="#c7d2fe" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-3 mt-4 p-3 bg-success-light rounded-lg text-[13px]">
        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
          <TrendingUp className="w-[15px] h-[15px] text-success" />
        </div>
        <span className="font-semibold text-green-800">{isUp ? "Mejora" : "Bajada"} {Math.abs(improvement).toFixed(1)}%</span>
        <span className="text-gray-500 text-xs">en los últimos 30 días</span>
      </div>
    </div>
  );
}
