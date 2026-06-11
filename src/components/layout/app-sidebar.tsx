"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAV_SECTIONS } from "@/lib/constants";
import { NavItem } from "./nav-item";
import { TenantSwitcher } from "./tenant-switcher";

export function AppSidebar() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <aside className="w-60 min-w-[240px] bg-sidebar-bg border-r border-sidebar-border-custom flex flex-col p-2">
      {NAV_SECTIONS.map((section, i) => (
        <div key={section.title}>
          {i > 0 && <hr className="mx-3 my-2 border-sidebar-border-custom" />}
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 px-3 pt-2 pb-1">
            {section.title}
          </p>
          {section.items.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>
      ))}
      <div className="mt-auto space-y-1">
        <TenantSwitcher />
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-400 text-sm hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-[15px] h-[15px]" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
