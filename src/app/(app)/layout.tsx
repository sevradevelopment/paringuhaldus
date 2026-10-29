import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { SiteLogo } from "@/components/site-logo";
import { Button } from "@/components/ui/button";

export const instant = false;

async function AppHeader() {
  const session = await auth();
  if (!session?.user?.id || !session.user.organizationId) {
    redirect("/login");
  }

  return (
    <header className="border-b border-[var(--border)]/80 bg-[var(--surface)]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
        <SiteLogo href="/app" />
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-[var(--ink-muted)] sm:inline">
            {session.user.organizationName ?? "Töökeskkond"}
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="ghost" size="sm">
              Logi välja
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}

function HeaderFallback() {
  return (
    <header className="border-b border-[var(--border)]/80 bg-[var(--surface)]/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:h-16 sm:px-6 lg:px-8">
        <SiteLogo href="/app" />
      </div>
    </header>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-[var(--surface)]">
      <Suspense fallback={<HeaderFallback />}>
        <AppHeader />
      </Suspense>
      <main>{children}</main>
    </div>
  );
}
