import type { Metadata } from "next";
import { Suspense } from "react";
import {
  ClipboardList,
  FileClock,
  Inbox,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RecentInquiries } from "@/components/dashboard/recent-inquiries";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  getDashboardStats,
  getRecentInquiries,
} from "@/lib/dashboard/queries";

export const metadata: Metadata = {
  title: "Ülevaade – Päringuhaldus.ee",
};

export const instant = false;

async function OverviewContent() {
  const session = await auth();
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const organizationId = session.user.organizationId;
  const [stats, recent] = await Promise.all([
    getDashboardStats(organizationId),
    getRecentInquiries(organizationId),
  ]);

  const firstName = session.user.name?.trim()?.split(/\s+/)[0];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-[var(--brand)]">Ülevaade</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
          Tere{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--ink-muted)] sm:text-base">
          Kiire ülevaade sinu organisatsiooni päringutest, pakkumistest ja
          klientidest.
        </p>
      </div>

      <section
        aria-label="Statistika"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          title="Päringuid kokku"
          value={stats.totalInquiries}
          description="Kõik registreeritud päringud"
          icon={Inbox}
        />
        <StatCard
          title="Aktiivsed päringud"
          value={stats.activeInquiries}
          description="Uus, töös või ootel"
          icon={ClipboardList}
        />
        <StatCard
          title="Ootel hinnapakkumised"
          value={stats.pendingQuotes}
          description="Ootel staatusega pakkumised"
          icon={FileClock}
        />
        <StatCard
          title="Kliendid"
          value={stats.clientsCount}
          description="Organisatsiooni kliendid"
          icon={Users}
        />
      </section>

      <section aria-label="Viimased päringud">
        <RecentInquiries rows={recent} />
      </section>
    </div>
  );
}

function OverviewFallback() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-4 w-20 animate-pulse rounded bg-[var(--surface-muted)]" />
        <div className="mt-3 h-8 w-56 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl bg-[var(--surface-muted)]"
          />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
    </div>
  );
}

export default function AppOverviewPage() {
  return (
    <Suspense fallback={<OverviewFallback />}>
      <OverviewContent />
    </Suspense>
  );
}
