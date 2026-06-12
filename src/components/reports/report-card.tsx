import { useState } from "react";
import { Download, Share2, Calendar, CheckCircle } from "lucide-react";
import { PdfPreview } from "./pdf-preview";
import type { ReportData } from "@/types/seo";

interface ReportCardProps {
  report: ReportData;
  websiteId: string;
  onDownload?: (reportId: string) => void;
}

const STATUS_BADGES = {
  scheduled: {
    className: "bg-brand-50 text-brand-600",
    label: "Programado",
    icon: <Calendar className="w-2.5 h-2.5" />,
  },
  sent: {
    className: "bg-green-50 text-green-700",
    label: "Enviado",
    icon: <CheckCircle className="w-2.5 h-2.5" />,
  },
  draft: { className: "bg-amber-50 text-amber-700", label: "Borrador", icon: null },
};

const FREQ_BADGES: Record<string, string> = {
  monthly: "bg-purple-50 text-purple-700",
  weekly: "bg-brand-50 text-brand-600",
  custom: "bg-gray-100 text-gray-500",
};

export function ReportCard({ report, websiteId, onDownload }: ReportCardProps) {
  const [downloading, setDownloading] = useState(false);
  const statusBadge = STATUS_BADGES[report.status];
  const freqClass = FREQ_BADGES[report.frequency];

  const handleDownloadClick = async () => {
    if (!onDownload || downloading) return;
    setDownloading(true);
    try {
      await onDownload(report.id);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      <div className="bg-gray-50 p-6 border-b border-gray-200 min-h-[200px] flex items-center">
        <PdfPreview report={report} />
      </div>
      <div className="p-5">
        <h3 className="font-bold text-[15px] text-gray-900 flex items-center gap-2">
          {report.name}
        </h3>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span
            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium ${statusBadge.className}`}
          >
            {statusBadge.icon}
            {statusBadge.label}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium ${freqClass}`}
          >
            {report.frequency === "weekly"
              ? "Semanal"
              : report.frequency === "monthly"
                ? "Mensual"
                : "Personalizado"}
          </span>
        </div>
        {report.status !== "draft" && (
          <div className="flex items-center gap-3 mt-3 p-3 bg-gray-50 rounded-[10px]">
            <div
              className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${report.scheduleEnabled ? "bg-brand-500" : "bg-gray-300"}`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-all ${report.scheduleEnabled ? "left-[22px]" : "left-0.5"}`}
              />
            </div>
            <p className="text-xs text-gray-700">
              Envío automático: <strong>{report.scheduleDescription}</strong>
            </p>
          </div>
        )}
        {report.status === "draft" && (
          <div className="mt-3 space-y-2">
            {[
              "Seleccionar rango de fechas",
              "Elegir métricas a incluir",
              "Personalizar branding",
              "Vista previa y enviar",
            ].map((step, i) => (
              <div
                key={step}
                className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg text-[12.5px]"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-brand-500" : "bg-gray-300"}`}
                />
                {step}
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 mt-3">
          {report.status === "draft" ? (
            <button className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold">
              Configurar
            </button>
          ) : (
            <>
              <button
                onClick={handleDownloadClick}
                disabled={downloading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-brand-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                <Download className="w-3 h-3" />
                {downloading ? "Descargando..." : "Descargar PDF"}
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50">
                <Share2 className="w-3 h-3" /> Compartir
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
