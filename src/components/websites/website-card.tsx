import { MoreVertical, Globe, Server, Terminal, Layout, ExternalLink, AlertTriangle, XCircle } from "lucide-react";
import type { WebsiteData, ConnectionStatus, AccessType } from "@/types/seo";

interface WebsiteCardProps { website: WebsiteData; }

const STATUS_CONFIG: Record<ConnectionStatus, { dot: string }> = {
  connected: { dot: "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" },
  "no-access": { dot: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" },
  error: { dot: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]" },
};

const ACCESS_ICONS: Record<AccessType, { icon: React.ReactNode; label: string; className: string }> = {
  wordpress: { icon: <Globe className="w-2.5 h-2.5" />, label: "WordPress", className: "bg-brand-50 text-brand-600" },
  ftp: { icon: <Server className="w-2.5 h-2.5" />, label: "FTP", className: "bg-gray-100 text-gray-600" },
  ssh: { icon: <Terminal className="w-2.5 h-2.5" />, label: "SSH", className: "bg-gray-100 text-gray-600" },
  cpanel: { icon: <Layout className="w-2.5 h-2.5" />, label: "cPanel", className: "bg-amber-50 text-amber-700" },
};

export function WebsiteCard({ website }: WebsiteCardProps) {
  const status = STATUS_CONFIG[website.status];
  const isError = website.status === "error";
  const isNoAccess = website.status === "no-access";

  return (
    <div className={`bg-white border rounded-xl p-5 transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] ${isError ? "border-red-200" : "border-gray-200"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1.5 font-bold text-[15px] text-gray-900">
          <span className={`w-2 h-2 rounded-full ${status.dot}`} />{website.domain}
        </div>
        <button className="p-0.5 text-gray-400 hover:text-gray-600"><MoreVertical className="w-4 h-4" /></button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3.5">
        {website.accessTypes.map((type) => {
          const acc = ACCESS_ICONS[type];
          return <span key={type} className={`inline-flex items-center gap-1 text-[11.5px] px-2 py-0.5 rounded-md font-medium ${acc.className}`}>{acc.icon}{acc.label}</span>;
        })}
      </div>
      {(isError || isNoAccess) && website.errorMessage && (
        <div className={`p-2.5 rounded-lg mb-3.5 text-xs flex items-center gap-2 ${isError ? "bg-red-50 border border-red-200 text-red-800" : "bg-amber-50 border border-amber-200 text-amber-800"}`}>
          {isError ? <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />}
          {website.errorMessage}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[11px] text-gray-400 font-medium">Keywords</p><p className="font-bold mt-0.5 text-lg text-gray-900">{website.keywords}</p></div>
        {website.status === "connected" ? (
          <>
            <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[11px] text-gray-400 font-medium">Artículos</p><p className="font-bold mt-0.5 text-lg text-gray-900">{website.articles}</p></div>
            <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[11px] text-gray-400 font-medium">Posición Media</p><p className="font-bold mt-0.5 text-lg text-green-600">{website.avgPosition}</p></div>
            <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[11px] text-gray-400 font-medium">Último Audit</p><p className="font-bold mt-0.5 text-[13px] text-gray-900">{website.lastAudit}</p></div>
          </>
        ) : isNoAccess ? (
          <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[11px] text-gray-400 font-medium">Último OK</p><p className="font-bold mt-0.5 text-[13px] text-amber-600">{website.lastAudit}</p></div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-2.5"><p className="text-[11px] text-gray-400 font-medium">Reintentos</p><p className="font-bold mt-0.5 text-[13px] text-red-600">3/5</p></div>
        )}
      </div>
      {website.status === "connected" ? (
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"><ExternalLink className="w-3 h-3" />Dashboard</button>
          <button className="flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">Editar</button>
          <button className="flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">Test</button>
          <button className="flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200">Eliminar</button>
        </div>
      ) : isNoAccess ? (
        <div className="flex gap-2">
          <button className="flex-1 py-1.5 rounded-md text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700">Actualizar acceso</button>
          <button className="flex-1 py-1.5 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-red-50 hover:text-red-600">Eliminar</button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button className="flex-1 py-1.5 rounded-md text-xs font-semibold bg-red-50 border border-red-200 text-red-700">Reintentar</button>
          <button className="flex-1 py-1.5 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50">Editar</button>
          <button className="flex-1 py-1.5 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-700 hover:bg-red-50 hover:text-red-600">Eliminar</button>
        </div>
      )}
    </div>
  );
}
