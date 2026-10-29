import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { ClientFilters } from "@/components/clients/client-filters";
import { ClientTable } from "@/components/clients/client-table";
import { requireOrgSession } from "@/lib/auth/session";
import {
  listClients,
  type ClientListSort,
} from "@/lib/clients/queries";

export const metadata: Metadata = {
  title: "Kliendid – Päringuhaldus.ee",
};

export const instant = false;

type SearchParams = Promise<{
  q?: string;
  archived?: string;
  sort?: string;
}>;

function isSort(value: string | undefined): value is ClientListSort {
  return (
    value === "name_asc" ||
    value === "name_desc" ||
    value === "createdAt_desc" ||
    value === "createdAt_asc" ||
    value === "company_asc"
  );
}

async function KliendidContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await requireOrgSession();
  const params = await searchParams;
  const archived =
    params.archived === "archived" || params.archived === "all"
      ? params.archived
      : "active";

  const rows = await listClients(session.organizationId, {
    q: params.q,
    archived,
    sort: isSort(params.sort) ? params.sort : "name_asc",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
            Kliendid
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)] sm:text-base">
            Halda kontakte, ettevõtteid ja seotud päringuid ühes kohas.
          </p>
        </div>
        <Link
          href="/app/kliendid/uus"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)]"
        >
          <Plus className="size-4" aria-hidden />
          Lisa klient
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="h-28 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
        }
      >
        <ClientFilters />
      </Suspense>

      <ClientTable rows={rows} />
    </div>
  );
}

export default function KliendidPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
          <div className="h-28 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
        </div>
      }
    >
      <KliendidContent searchParams={searchParams} />
    </Suspense>
  );
}
