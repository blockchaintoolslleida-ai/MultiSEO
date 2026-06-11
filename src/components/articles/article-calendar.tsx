"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function ArticleCalendar() {
  const today = 10;
  const days = [26, 27, 28, 29, 30, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  const hasArticle = [2, 4, 6, 8, 11, 12, 16, 18, 21];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Calendario de Publicaciones
        <span className="text-xs text-gray-400 font-normal ml-auto">Junio 2026</span>
      </h3>
      <div className="flex items-center justify-between mb-3">
        <button className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center"><ChevronLeft className="w-3 h-3" /></button>
        <span className="font-semibold text-[13px]">Junio 2026</span>
        <button className="w-7 h-7 rounded-md border border-gray-200 flex items-center justify-center"><ChevronRight className="w-3 h-3" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
        {DAYS.map((d) => <div key={d} className="text-[10.5px] font-semibold text-gray-400 uppercase py-1">{d}</div>)}
        {days.map((d, i) => {
          const isOtherMonth = i < 5;
          const isToday = d === today && !isOtherMonth;
          const hasArt = hasArticle.includes(d) && !isOtherMonth;
          return (
            <div key={i} className={`py-2 rounded-md cursor-pointer font-medium text-gray-700 min-h-[40px] relative ${isOtherMonth ? "text-gray-300" : ""} ${isToday ? "bg-brand-50 text-brand-600 font-bold" : ""} ${hasArt && !isToday ? "bg-brand-50/50 text-brand-600 font-bold" : ""} ${!isOtherMonth && !isToday ? "hover:bg-gray-100" : ""}`}>
              {d}{hasArt && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-500" />}
            </div>
          );
        })}
      </div>
      <div className="mt-3 p-2.5 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div><p className="text-xs text-gray-400">Próxima publicación</p><p className="font-semibold text-[13px] text-gray-900">12 Jun — Tendencias SEO Ecommerce</p></div>
          <span className="text-[11px] text-brand-500 font-medium">3 artículos esta semana</span>
        </div>
      </div>
    </div>
  );
}
