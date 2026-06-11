import type { ReportData } from "@/types/seo";

interface PdfPreviewProps { report: ReportData; }

export function PdfPreview({ report }: PdfPreviewProps) {
  const isDraft = report.status === "draft";
  const headerGradient = report.colorScheme === "green" ? "from-emerald-900 to-emerald-700" : "from-indigo-950 to-indigo-800";

  if (isDraft) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <p className="font-semibold text-gray-500 text-[13px]">Reporte rápido</p>
          <p className="text-[11px] text-gray-400 mt-1">Personaliza fechas y métricas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[280px] mx-auto bg-white rounded shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden">
      <div className={`bg-gradient-to-br ${headerGradient} px-5 py-4 text-white`}>
        <p className="text-[11px] opacity-70 uppercase tracking-wide">Demo Company</p>
        <p className="text-[16px] font-bold mt-1">{report.name}</p>
        <p className="text-[10px] opacity-60 mt-0.5">{report.period} · {report.websiteUrl}</p>
      </div>
      <div className="px-5 py-3">
        {Object.entries(report.metrics).map(([label, value]) => (
          <div key={label} className="flex justify-between py-1.5 border-b border-gray-100 text-[10px]"><span className="text-gray-500">{label}</span><span className="font-bold text-gray-900">{value}</span></div>
        ))}
        <div className="flex items-end gap-0.5 h-10 my-2.5 px-1">
          {[40, 55, 48, 65, 60, 72, 68, 80, 75, 85, 82, 90].map((h, i) => (
            <div key={i} className="flex-1 bg-gradient-to-t from-brand-500 to-brand-200 rounded-[2px_2px_0_0]" style={{ height: `${h}%` }} />
          ))}
        </div>
        {report.status === "scheduled" && <p className="text-[9px] text-gray-400 mt-1">✅ 3 keywords subieron · ⚠️ 1 keyword bajó</p>}
      </div>
      <div className="px-5 py-2.5 border-t border-gray-100 text-[8px] text-gray-400 text-center">Generado por MultiSEO · 10/06/2026</div>
    </div>
  );
}
