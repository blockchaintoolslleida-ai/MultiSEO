"use client";

import { Plus } from "lucide-react";
import { WebsiteCard } from "./website-card";
import type { WebsiteData } from "@/types/seo";

interface WebsiteGridProps {
  websites: WebsiteData[];
  onEdit: (website: WebsiteData) => void;
  onTest: (website: WebsiteData) => Promise<string>;
  onDelete: (website: WebsiteData) => void;
  onRefresh: (website: WebsiteData) => Promise<string>;
  onUpdateAccess: (website: WebsiteData) => void;
  onAdd: () => void;
}

export function WebsiteGrid({
  websites,
  onEdit,
  onTest,
  onDelete,
  onRefresh,
  onUpdateAccess,
  onAdd,
}: WebsiteGridProps) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}
    >
      {websites.map((w) => (
        <WebsiteCard
          key={w.id}
          website={w}
          onEdit={onEdit}
          onTest={onTest}
          onDelete={onDelete}
          onRefresh={onRefresh}
          onUpdateAccess={onUpdateAccess}
        />
      ))}
      <button
        onClick={onAdd}
        className="bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center min-h-[260px] hover:border-brand-400 hover:bg-brand-50/30 transition-colors cursor-pointer"
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Plus className="w-[22px] h-[22px] text-gray-400" />
          </div>
          <p className="font-semibold text-gray-500">Añadir nuevo website</p>
          <p className="text-xs text-gray-400 mt-1">WordPress, FTP, SSH, cPanel...</p>
        </div>
      </button>
    </div>
  );
}
