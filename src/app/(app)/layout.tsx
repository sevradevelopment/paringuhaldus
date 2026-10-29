import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const instant = false;

function ShellFallback() {
  return (
    <div className="flex min-h-full bg-[var(--surface)]">
      <aside className="hidden w-60 shrink-0 border-r border-[var(--border)] lg:block" />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="h-14 border-b border-[var(--border)] sm:h-16" />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-2xl bg-[var(--surface-muted)]"
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
