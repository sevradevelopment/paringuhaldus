import { SiteLogo } from "@/components/site-logo";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

export function DashboardSidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] lg:flex lg:flex-col">
      <div className="flex h-14 items-center border-b border-[var(--border)] px-5 sm:h-16">
        <SiteLogo href="/app" className="text-base sm:text-lg" />
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <SidebarNav />
      </div>
    </aside>
  );
}
