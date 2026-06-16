"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Legend,
} from "recharts";
import type { RankingHistoryPoint } from "@/types/seo";

interface KeywordChartProps {
  history: RankingHistoryPoint[];
  keyword: string;
}

export function KeywordChart({ history, keyword }: KeywordChartProps) {
  if (!history || history.length < 2) {
    return (
      <div className="py-6 text-center text-xs text-gray-400">
        Datos insuficientes para mostrar evolución. Sincroniza GSC para acumular histórico.
      </div>
    );
  }

  const data = history.map((h) => ({
    ...h,
    dateLabel: h.date.slice(5), // "MM-DD"
  }));

  return (
    <div className="p-3 bg-gray-50/50 rounded-lg">
      <p className="text-[11px] font-medium text-gray-500 mb-2">
        Evolución: <span className="text-gray-700">{keyword}</span>
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="position"
            orientation="left"
            reversed
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            domain={["dataMin - 1", "dataMax + 1"]}
            label={{
              value: "Posición",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 10, fill: "#9ca3af" },
            }}
          />
          <YAxis
            yAxisId="clicks"
            orientation="right"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "Clics",
              angle: 90,
              position: "insideRight",
              style: { fontSize: 10, fill: "#9ca3af" },
            }}
          />
          <Tooltip
            contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }}
            formatter={(value, name) => {
              if (name === "position") return [`#${value}`, "Posición"];
              if (name === "clicks") return [value, "Clics"];
              return [value, name];
            }}
            labelFormatter={(label) => `Fecha: ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar
            yAxisId="clicks"
            dataKey="clicks"
            fill="#6366f1"
            opacity={0.3}
            name="clicks"
            barSize={10}
          />
          <Line
            yAxisId="position"
            type="monotone"
            dataKey="position"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            name="position"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
