import { Building2, LogOut, UserRound } from "lucide-react";
import { signOut } from "@/auth";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Button } from "@/components/ui/button";

type DashboardTopbarProps = {
  organizationName: string;
  userName: string | null | undefined;
  userEmail: string | null | undefined;
};

export function DashboardTopbar({
  organizationName,
  userName,
  userEmail,
}: DashboardTopbarProps) {
  const displayName = userName?.trim() || userEmail || "Kasutaja";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)]/80 bg-[var(--surface)]/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <MobileSidebar />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[var(--ink)]">
              <Building2
                className="hidden size-4 shrink-0 text-[var(--brand)] sm:block"
                aria-hidden
              />
              <p className="truncate font-display text-sm font-bold sm:text-base">
                {organizationName}
              </p>
            </div>
            <p className="truncate text-xs text-[var(--ink-muted)] sm:hidden">
              {displayName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden min-w-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-1.5 sm:flex">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--surface-muted)] text-[var(--brand)]">
              <UserRound className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--ink)]">
                {displayName}
              </p>
              {userEmail ? (
                <p className="truncate text-xs text-[var(--ink-muted)]">
                  {userEmail}
                </p>
              ) : null}
            </div>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="ghost" size="sm" className="gap-2">
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">Logi välja</span>
              <span className="sr-only sm:hidden">Logi välja</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
