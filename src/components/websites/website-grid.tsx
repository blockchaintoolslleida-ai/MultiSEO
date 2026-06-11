import { Plus } from "lucide-react";
import { WebsiteCard } from "./website-card";
import type { WebsiteData } from "@/types/seo";

interface WebsiteGridProps { websites: WebsiteData[]; }

export function WebsiteGrid({ websites }: WebsiteGridProps) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
      {websites.map((w) => <WebsiteCard key={w.id} website={w} />)}
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center min-h-[260px]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3"><Plus className="w-[22px] h-[22px] text-gray-400" /></div>
          <p className="font-semibold text-gray-500">Añadir nuevo website</p>
          <p className="text-xs text-gray-400 mt-1">WordPress, FTP, SSH, cPanel...</p>
        </div>
      </div>
    </div>
  );
}
