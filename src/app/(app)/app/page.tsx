import type { Metadata } from "next";
import { Suspense } from "react";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Töökeskkond – Päringuhaldus.ee",
};

export const instant = false;

async function WorkspaceWelcome() {
  const session = await auth();

  return (
    <>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
        Tere tulemast
        {session?.user?.name ? `, ${session.user.name}` : ""}
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--ink-muted)]">
        Töökeskkond on peagi saadaval. Siia tulevad päringud, ülevaade ja
        meeskonna seaded — praegu on see vaid koht pärast sisselogimist.
      </p>
      <div className="mt-8 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)]/60 px-6 py-10 text-center">
        <p className="font-display text-lg font-bold text-[var(--ink)]">
          Töökeskkond coming soon
        </p>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Organisatsioon: {session?.user?.organizationName ?? "—"}
        </p>
      </div>
    </>
  );
}

export default function AppHomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <p className="text-sm font-medium text-[var(--brand)]">Töökeskkond</p>
      <Suspense
        fallback={
          <>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
              Tere tulemast
            </h1>
            <p className="mt-4 text-base text-[var(--ink-muted)]">Laadin…</p>
          </>
        }
      >
        <WorkspaceWelcome />
      </Suspense>
    </div>
  );
}
