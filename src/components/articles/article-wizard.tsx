"use client";

import { useState } from "react";
import { useApi } from "@/hooks/use-api";
import type { WebsiteData } from "@/types/seo";

interface ArticleWizardProps {
  open: boolean;
  onClose: () => void;
  tenantId: string;
  onCreated: () => void;
}

const TONES = [
  { value: "profesional", label: "Profesional" },
  { value: "divulgativo", label: "Divulgativo" },
  { value: "técnico", label: "Técnico" },
];

const LENGTHS = [
  { value: "corto", label: "Corto (~500 palabras)" },
  { value: "medio", label: "Medio (~1000 palabras)" },
  { value: "largo", label: "Largo (~2000 palabras)" },
];

const STRUCTURE_OPTIONS = [
  { value: "introducción", label: "Introducción" },
  { value: "secciones H2", label: "Secciones H2 (3-5)" },
  { value: "conclusión", label: "Conclusión / CTA" },
  { value: "FAQ", label: "FAQ" },
];

export function ArticleWizard({ open, onClose, tenantId, onCreated }: ArticleWizardProps) {
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [websiteId, setWebsiteId] = useState("");

  // Step 2 state
  const [tone, setTone] = useState("divulgativo");
  const [length, setLength] = useState("medio");
  const [structure, setStructure] = useState<string[]>(["introducción", "secciones H2", "conclusión"]);

  // Step 3 state
  const [generated, setGenerated] = useState<{
    title: string;
    metaDescription: string;
    slug: string;
    content: { h2Sections: { title: string; paragraphs: string[] }[] };
    seoScores: { keywords: number; readability: number; structure: number; originality: number };
  } | null>(null);

  const { data: websites } = useApi<WebsiteData[]>(
    tenantId ? `/api/websites?tenantId=${tenantId}` : ""
  );

  const toggleStructure = (v: string) => {
    setStructure((prev) =>
      prev.includes(v) ? prev.filter((s) => s !== v) : [...prev, v]
    );
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          websiteId,
          topic,
          keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
          tone,
          length,
          structure,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error generating article");
      setGenerated(json.data);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async (status: "draft" | "published") => {
    if (!generated) return;
    try {
      const res = await fetch("/api/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          websiteId,
          topic,
          keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
          tone,
          length,
          structure,
        }),
      });
      if (res.ok) {
        onCreated();
        handleClose();
      }
    } catch {
      // Article already saved during generate — just refresh list
      onCreated();
      handleClose();
    }
  };

  const handleClose = () => {
    setStep(1);
    setTopic("");
    setKeywords("");
    setWebsiteId("");
    setTone("divulgativo");
    setLength("medio");
    setStructure(["introducción", "secciones H2", "conclusión"]);
    setGenerated(null);
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
            </svg>
            Generar Artículo con IA
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            {[1, 2, 3].map((s) => (
              <span key={s} className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                s === step ? "bg-brand-600 text-white" : s < step ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
              }`}>{s}</span>
            ))}
          </div>
        </div>

        {/* Step 1: Topic & Keywords */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase">Paso 1 de 3: Tema</p>
            <div>
              <label className="text-sm font-medium text-gray-700">Título / Tema *</label>
              <input
                type="text" value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Estrategias de Link Building en 2026"
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Keywords (separadas por coma) *</label>
              <input
                type="text" value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="link building, backlinks, SEO"
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Website destino</label>
              <select
                value={websiteId}
                onChange={(e) => setWebsiteId(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400"
              >
                <option value="">Seleccionar website...</option>
                {(websites ?? []).map((w) => (
                  <option key={w.id} value={w.id}>{w.domain}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
              <button
                onClick={() => setStep(2)}
                disabled={!topic || topic.length < 10 || !keywords.trim() || !websiteId}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-700"
              >Siguiente →</button>
            </div>
          </div>
        )}

        {/* Step 2: Configuration */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase">Paso 2 de 3: Configuración</p>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Tono</label>
              <div className="flex gap-2">
                {TONES.map((t) => (
                  <button key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`flex-1 py-2 px-2 rounded-lg text-sm border font-medium transition-colors ${
                      tone === t.value ? "border-brand-500 bg-brand-50 text-brand-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >{t.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Extensión</label>
              <div className="flex gap-2">
                {LENGTHS.map((l) => (
                  <button key={l.value}
                    onClick={() => setLength(l.value)}
                    className={`flex-1 py-2 px-2 rounded-lg text-sm border font-medium transition-colors ${
                      length === l.value ? "border-brand-500 bg-brand-50 text-brand-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >{l.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Estructura</label>
              <div className="flex flex-wrap gap-2">
                {STRUCTURE_OPTIONS.map((s) => (
                  <button key={s.value}
                    onClick={() => toggleStructure(s.value)}
                    className={`py-1.5 px-3 rounded-lg text-sm border font-medium transition-colors ${
                      structure.includes(s.value) ? "border-brand-500 bg-brand-50 text-brand-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >{s.label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Modelo AI</label>
              <div className="py-2 px-3 rounded-lg text-sm border border-brand-500 bg-brand-50 text-brand-600 font-medium inline-block">DeepSeek (recomendado)</div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Atrás</button>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
              >{generating ? "Generando..." : "Generar →"}</button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            )}
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && generated && (
          <div className="space-y-4">
            <p className="text-xs font-semibold text-gray-400 uppercase">Paso 3 de 3: Revisión</p>

            <div className="border border-gray-200 rounded-lg p-4 max-h-[400px] overflow-y-auto bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg mb-1">{generated.title}</h3>
              <p className="text-xs text-gray-400 mb-3">{generated.metaDescription}</p>
              <p className="text-[11px] text-gray-300 mb-3">{generated.slug}</p>
              <div className="space-y-3">
                {generated.content.h2Sections.map((s, i) => (
                  <div key={i}>
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">{s.title}</h4>
                    {s.paragraphs.map((p, j) => (
                      <p key={j} className="text-sm text-gray-600 mb-1 leading-relaxed">{p}</p>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* SEO Scores */}
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(generated.seoScores).map(([key, value]) => (
                <div key={key} className="bg-white border border-gray-200 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold text-brand-600">{value}</p>
                  <p className="text-[10px] text-gray-400 capitalize">{key}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button onClick={() => { setStep(2); setGenerated(null); }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Atrás</button>
              <button onClick={handleGenerate} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Regenerar</button>
              <button onClick={() => handleSave("draft")} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">Guardar Draft</button>
              <button onClick={() => handleSave("published")} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">Publicar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
