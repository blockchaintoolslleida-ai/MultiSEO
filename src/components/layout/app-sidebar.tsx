import { NAV_SECTIONS } from "@/lib/constants";
import { NavItem } from "./nav-item";
import { TenantSwitcher } from "./tenant-switcher";

export function AppSidebar() {
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
      <TenantSwitcher />
    </aside>
  );
}
