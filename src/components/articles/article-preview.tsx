import { SEOScores } from "./seo-scores";
import type { ArticleData } from "@/types/seo";

interface ArticlePreviewProps { article: ArticleData; }

export function ArticlePreview({ article }: ArticlePreviewProps) {
  if (!article.metaDescription) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex-1 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Selecciona un artículo para previsualizar</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex-1">
      <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2 mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Vista Previa
        <span className="text-[11px] text-gray-400 font-normal ml-auto">Borrador</span>
      </h3>
      <div className="border border-dashed border-gray-300 rounded-[10px] p-5 bg-gray-50/50">
        <h2 className="text-xl font-bold text-gray-900 mb-1">{article.title}</h2>
        <p className="text-xs text-gray-400 mb-4">{article.slug}</p>
        <div className="p-2.5 bg-gray-50 rounded-lg border-l-[3px] border-brand-500 mb-4 text-[13px] text-gray-600"><strong>Meta:</strong> {article.metaDescription}</div>
        {article.content?.h2Sections.map((section, i) => (
          <div key={i}>
            <h3 className="text-[17px] font-bold text-gray-900 mt-4 mb-2">{section.title}</h3>
            {section.paragraphs.map((p, j) => <p key={j} className="text-[13px] text-gray-600 leading-relaxed mb-2.5">{p}</p>)}
          </div>
        ))}
      </div>
      {article.seoScores && <SEOScores scores={article.seoScores} />}
      {article.seoScores && (
        <div className="flex gap-2 mt-3.5">
          <button className="flex-1 py-2.5 bg-brand-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="5 12 10 17 19 8"/></svg>
            Publicar Ahora
          </button>
          <button className="flex-1 py-2.5 border border-gray-200 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-gray-50">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
            Programar
          </button>
        </div>
      )}
    </div>
  );
}
