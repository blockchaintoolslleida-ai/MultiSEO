"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LayoutGrid, Globe, FileText, TrendingUp, BarChart3, Monitor, Settings, Bot } from "lucide-react";
import type { NavItemData } from "@/types/seo";

const iconMap: Record<string, LucideIcon> = {
  LayoutGrid, Globe, FileText, TrendingUp, BarChart3, Monitor, Settings, Bot,
};

interface NavItemProps {
  item: NavItemData;
}

export function NavItem({ item }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = iconMap[item.icon] || LayoutGrid;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-brand-50 text-brand-600"
          : "text-gray-600 hover:bg-brand-50/50 hover:text-brand-600"
      }`}
    >
      <Icon className="w-[17px] h-[17px]" />
      <span>{item.label}</span>
      {item.badge != null && (
        <span className="ml-auto bg-brand-500 text-white rounded-full px-1.5 py-0 text-[10px] font-semibold leading-relaxed">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
