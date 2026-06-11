"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Users, Check } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";

export function TenantSwitcher() {
  const { tenant, tenants, setTenant, loading } = useTenant();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (loading || !tenant) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-brand-50 text-brand-400 text-sm font-medium mt-auto">
        <Users className="w-[15px] h-[15px]" />
        <span className="flex-1 truncate">Cargando...</span>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative mt-auto">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-brand-50 text-brand-600 text-sm font-medium hover:bg-brand-100 transition-colors"
      >
        <Users className="w-[15px] h-[15px]" />
        <span className="flex-1 truncate text-left">{tenant.name}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
          {tenants.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTenant(t.id); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                t.id === tenant.id ? "text-brand-600 font-medium" : "text-gray-700"
              }`}
            >
              <span className="flex-1 text-left truncate">{t.name}</span>
              {t.id === tenant.id && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
