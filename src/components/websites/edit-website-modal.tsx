"use client";

import { useState, useEffect } from "react";
import type { WebsiteData, AccessType } from "@/types/seo";
import { X, Globe, Server, Terminal, Layout } from "lucide-react";

const ACCESS_OPTIONS: { type: AccessType; icon: React.ReactNode; label: string }[] = [
  { type: "wordpress", icon: <Globe className="w-3.5 h-3.5" />, label: "WordPress" },
  { type: "ftp", icon: <Server className="w-3.5 h-3.5" />, label: "FTP" },
  { type: "ssh", icon: <Terminal className="w-3.5 h-3.5" />, label: "SSH" },
  { type: "cpanel", icon: <Layout className="w-3.5 h-3.5" />, label: "cPanel" },
];

interface EditWebsiteModalProps {
  website: WebsiteData;
  onSave: (data: { domain: string; accessTypes: AccessType[] }) => Promise<void>;
  onClose: () => void;
}

export function EditWebsiteModal({ website, onSave, onClose }: EditWebsiteModalProps) {
  const [domain, setDomain] = useState(website.domain);
  const [accessTypes, setAccessTypes] = useState<AccessType[]>([...website.accessTypes]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const toggleAccess = (type: AccessType) => {
    setAccessTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSave = async () => {
    const trimmed = domain.trim();
    if (!trimmed) {
      setError("El dominio es obligatorio");
      return;
    }
    if (accessTypes.length === 0) {
      setError("Selecciona al menos un tipo de acceso");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSave({ domain: trimmed, accessTypes });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Editar Website</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Domain */}
        <label className="block text-xs font-semibold text-gray-500 mb-1.5">Dominio</label>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none mb-4"
          placeholder="ejemplo.com"
        />

        {/* Access Types */}
        <label className="block text-xs font-semibold text-gray-500 mb-2">Tipos de acceso</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {ACCESS_OPTIONS.map((opt) => {
            const selected = accessTypes.includes(opt.type);
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => toggleAccess(opt.type)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  selected
                    ? "bg-brand-50 border-brand-300 text-brand-700"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
