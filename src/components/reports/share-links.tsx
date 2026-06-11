import { Copy, X, Share2 } from "lucide-react";
import type { ReportData } from "@/types/seo";

interface ShareLinksProps { reports: ReportData[]; }

export function ShareLinks({ reports }: ShareLinksProps) {
  const shareable = reports.filter((r) => r.shareUrl);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-4"><Share2 className="w-[17px] h-[17px] text-brand-500" />Enlaces Compartidos Activos</h3>
      <div className="space-y-2.5">
        {shareable.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div><p className="font-semibold text-[13px] text-gray-900">{r.name}</p><p className="text-[11px] text-gray-400">/report/demo/{r.id} · Expira en {r.shareExpiresIn} días</p></div>
            <div className="flex gap-1.5">
              <button className="px-2.5 py-1.5 border border-gray-200 rounded-md text-[11px] font-medium flex items-center gap-1 hover:bg-gray-100"><Copy className="w-2.5 h-2.5" /> Copiar</button>
              <button className="px-2 py-1.5 border border-gray-200 rounded-md text-[11px] text-red-600 hover:bg-red-50"><X className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>
      {shareable.length > 0 && (
        <div className="flex items-center mt-3 border border-gray-200 rounded-lg overflow-hidden">
          <input readOnly value={shareable[0].shareUrl || ""} className="flex-1 px-3 py-2 text-xs text-gray-700 bg-gray-50 border-none outline-none" />
          <button className="px-3.5 py-2 bg-brand-600 text-white text-[11px] font-semibold hover:bg-brand-700">Copiar enlace</button>
        </div>
      )}
    </div>
  );
}
