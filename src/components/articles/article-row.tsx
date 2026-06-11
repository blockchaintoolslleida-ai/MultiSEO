import { Edit, Check, Trash2, Play, Eye } from "lucide-react";
import type { ArticleData } from "@/types/seo";

interface ArticleRowProps { article: ArticleData; }

const STATUS_STYLES = {
  published: { dot: "bg-green-500" },
  draft: { dot: "bg-amber-500" },
  scheduled: { dot: "bg-brand-500" },
  generating: { dot: "bg-cyan-500 animate-pulse" },
};

export function ArticleRow({ article }: ArticleRowProps) {
  const s = STATUS_STYLES[article.status];
  return (
    <div className={`flex items-center gap-3.5 py-3.5 border-b border-gray-100 ${article.status === "generating" ? "bg-cyan-50/50 -mx-5 px-5 rounded-lg" : ""}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[13.5px] text-gray-900 truncate flex items-center gap-2">
          {article.title}
          {article.aiModel && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-gradient-to-r from-brand-50 to-purple-50 text-brand-600 border border-brand-200">
              {article.status === "generating" ? "Generando..." : "IA"}
            </span>
          )}
        </p>
        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
          {article.aiModel === "claude" ? "Claude" : article.aiModel === "deepseek" ? "DeepSeek" : ""}
          {article.aiModel && "·"} {article.websiteUrl}
          {article.status === "generating" && <span className="text-cyan-500 font-medium">{article.progress}% completado</span>}
          {article.status === "draft" && article.editedAt && <span>Editado {article.editedAt}</span>}
          {article.status === "scheduled" && article.scheduledAt && <span className="text-brand-500 font-medium">Publicación: {article.scheduledAt}</span>}
          {article.status === "published" && article.publishedAt && <span>Publicado el {article.publishedAt}</span>}
        </p>
        {article.keywords.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">{article.keywords.map((kw) => <span key={kw} className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{kw}</span>)}</div>
        )}
      </div>
      {article.status === "generating" && article.progress != null && (
        <div className="w-[100px] h-1 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-400 to-green-500 rounded-full" style={{ width: `${article.progress}%` }} /></div>
      )}
      {article.status === "published" && (
        <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-shrink-0">
          {article.position != null && (
            <span className="inline-flex items-center gap-0.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={article.position <= 10 ? "#059669" : "#dc2626"} strokeWidth="2"><polyline points={article.position <= 10 ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} /></svg>
              #{article.position}
            </span>
          )}
          {article.views != null && <span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" />{article.views >= 1000 ? `${(article.views / 1000).toFixed(1)}K` : article.views}</span>}
        </div>
      )}
      <div className="flex gap-1.5 flex-shrink-0">
        {article.status === "draft" && (
          <>
            <button title="Editar" className="w-8 h-8 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"><Edit className="w-3.5 h-3.5" /></button>
            <button title="Publicar" className="w-8 h-8 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"><Check className="w-3.5 h-3.5 text-green-600" /></button>
            <button title="Eliminar" className="w-8 h-8 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"><Trash2 className="w-3.5 h-3.5 text-red-600" /></button>
          </>
        )}
        {article.status === "scheduled" && <button title="Adelantar" className="w-8 h-8 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"><Play className="w-3.5 h-3.5 text-brand-600" /></button>}
        {article.status === "published" && <button title="Ver" className="w-8 h-8 rounded-md border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"><Eye className="w-3.5 h-3.5" /></button>}
      </div>
    </div>
  );
}
