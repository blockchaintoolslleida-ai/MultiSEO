"use client";

import { useState } from "react";
import { Image, Plus } from "lucide-react";

const PRESET_COLORS = ["#4f46e5", "#059669", "#ea580c", "#dc2626", "#7c3aed"];

export function BrandingSettings() {
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [footerText, setFooterText] = useState("© 2026 Demo Company — Reporte generado por MultiSEO");

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        Personalización de Marca
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] text-gray-400 font-medium mb-1">Logo del cliente</p>
          <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center cursor-pointer hover:border-brand-400 transition-colors"><Image className="w-6 h-6 text-gray-400 mx-auto" /><p className="text-[11px] text-gray-400 mt-1.5">Subir logo</p></div>
        </div>
        <div>
          <p className="text-[11px] text-gray-400 font-medium mb-1">Color de marca</p>
          <div className="flex gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} className="w-7 h-7 rounded-md transition-transform hover:scale-110" style={{ backgroundColor: c, border: color === c ? "3px solid #818cf8" : "3px solid transparent" }} />
            ))}
            <button className="w-7 h-7 rounded-md bg-gray-200 flex items-center justify-center hover:bg-gray-300"><Plus className="w-3.5 h-3.5 text-gray-500" /></button>
          </div>
        </div>
      </div>
      <div className="mt-3.5"><p className="text-[11px] text-gray-400 font-medium mb-1">Texto del footer</p><input value={footerText} onChange={(e) => setFooterText(e.target.value)} className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:border-brand-500" /></div>
    </div>
  );
}
