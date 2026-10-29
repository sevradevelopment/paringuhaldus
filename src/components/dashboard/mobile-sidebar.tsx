"use client";

import { useEffect, useId, useState } from "react";
import { Menu, X } from "lucide-react";
import { SiteLogo } from "@/components/site-logo";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="lg:hidden"
        aria-expanded={open}
        aria-controls="dashboard-mobile-sheet"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" aria-hidden />
        <span className="sr-only">Ava menüü</span>
      </Button>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-[var(--ink)]/40 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          aria-label="Sulge menüü"
          onClick={() => setOpen(false)}
        />

        <aside
          id="dashboard-mobile-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={cn(
            "absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-xl transition-transform duration-200 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-14 items-center justify-between gap-2 border-b border-[var(--border)] px-4">
            <SiteLogo href="/app" className="text-base sm:text-lg" />
            <span id={titleId} className="sr-only">
              Navigatsioon
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" aria-hidden />
              <span className="sr-only">Sulge</span>
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </aside>
      </div>
    </>
  );
}
