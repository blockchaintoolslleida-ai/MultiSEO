"use client";

import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { useTenant } from "@/hooks/use-tenant";
import { useWebsiteSelector } from "@/hooks/use-website-selector";
import type { ReportData } from "@/types/seo";
import { ReportCard } from "@/components/reports/report-card";
import { ShareLinks } from "@/components/reports/share-links";
import { BrandingSettings } from "@/components/reports/branding-settings";

interface ReportStats {
  total: number;
  sent: number;
  scheduled: number;
  draft: number;
}

export default function ReportsPage() {
  const { tenant } = useTenant();
  const { websiteId, setWebsiteId, websitesList } = useWebsiteSelector();
  const { data: reports, loading: rLoading } = useApi<ReportData[]>(tenant ? `/api/reports` : "");
  const { data: stats, loading: sLoading } = useApi<ReportStats>(
    tenant ? `/api/reports/stats` : ""
  );
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId, title: `Reporte SEO — ${tenant?.name ?? ""}` }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-multiseo-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadPDF = async (reportId: string) => {
    const report = reports?.find((r) => r.id === reportId);
    if (!report) return;
    try {
      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          title: report.name,
          period: report.period,
          brandColor: report.colorScheme === "indigo" ? "#4f46e5" : "#059669",
        }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.name.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF download failed:", err);
    }
  };

  if (rLoading || sLoading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  const s = stats ?? { total: 0, sent: 0, scheduled: 0, draft: 0 };
  const reportList = reports ?? [];

  return (
    <div>
      <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-5">
        <span className="text-brand-600 inline-flex items-center gap-1">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          {tenant?.name}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span className="text-gray-700 font-medium">Reportes</span>
      </div>
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold text-gray-900 flex items-center gap-2.5">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Reportes para Clientes
          </h1>
          {websitesList.length > 1 && (
            <select
              value={websiteId}
              onChange={(e) => setWebsiteId(e.target.value)}
              className="text-[13px] border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:border-brand-400"
            >
              {websitesList.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.domain}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-gray-50 disabled:opacity-50"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {exporting ? "Exportando..." : "Exportar PDF"}
          </button>
          <button className="px-4 py-2.5 bg-brand-600 text-white rounded-lg text-[13px] font-semibold flex items-center gap-1.5 hover:bg-brand-700">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Generar Nuevo Reporte
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { value: s.total, label: "Total Reportes", bg: "bg-brand-50", color: "text-brand-600" },
          { value: s.sent, label: "Enviados", bg: "bg-green-50", color: "text-green-600" },
          {
            value: s.scheduled,
            label: "Programados",
            bg: "bg-purple-50",
            color: "text-purple-600",
          },
          { value: s.draft, label: "Borradores", bg: "bg-amber-50", color: "text-amber-600" },
        ].map(({ value, label, bg, color }) => (
          <div
            key={label}
            className="bg-white border border-gray-200 rounded-[10px] p-3.5 flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${bg}`}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={color}
              >
                <path
                  d={
                    label === "Total Reportes"
                      ? "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2 14 8 20 8 M16 13H8 M16 17H8 M10 9H9H8"
                      : label === "Enviados"
                        ? "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01 9 11.01"
                        : label === "Programados"
                          ? "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          : "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  }
                />
              </svg>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-5">
        {reportList.map((r) => (
          <ReportCard key={r.id} report={r} websiteId={websiteId} onDownload={handleDownloadPDF} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ShareLinks reports={reportList} />
        <BrandingSettings />
      </div>
    </div>
  );
}
