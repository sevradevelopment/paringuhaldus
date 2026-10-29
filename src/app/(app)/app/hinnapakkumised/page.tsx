import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { QuoteStatus } from "@prisma/client";
import { Plus } from "lucide-react";
import { QuoteFilters } from "@/components/quotes/quote-filters";
import { QuoteTable } from "@/components/quotes/quote-table";
import { requireOrgSession } from "@/lib/auth/session";
import {
  listQuotes,
  type QuoteListSort,
} from "@/lib/quotes/queries";

export const metadata: Metadata = {
  title: "Hinnapakkumised – Päringuhaldus.ee",
};

export const instant = false;

type SearchParams = Promise<{
  q?: string;
  status?: string;
  archived?: string;
  sort?: string;
}>;

function isStatus(value: string | undefined): value is QuoteStatus {
  return (
    value === "PENDING" ||
    value === "SENT" ||
    value === "ACCEPTED" ||
    value === "REJECTED" ||
    value === "EXPIRED"
  );
}

function isSort(value: string | undefined): value is QuoteListSort {
  return (
    value === "createdAt_desc" ||
    value === "createdAt_asc" ||
    value === "number_asc" ||
    value === "number_desc" ||
    value === "total_desc"
  );
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  const session = await requireOrgSession();
  const params = await searchParams;
  const archived =
    params.archived === "archived" || params.archived === "all"
      ? params.archived
      : "active";

  const rows = await listQuotes(session.organizationId, {
    q: params.q,
    status: isStatus(params.status) ? params.status : "ALL",
    archived,
    sort: isSort(params.sort) ? params.sort : "createdAt_desc",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
            Hinnapakkumised
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)] sm:text-base">
            Loo, saada ja jälgi hinnapakkumisi koos ridade ja KM arvutusega.
          </p>
        </div>
        <Link
          href="/app/hinnapakkumised/uus"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)]"
        >
          <Plus className="size-4" aria-hidden />
          Uus pakkumine
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="h-28 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
        }
      >
        <QuoteFilters />
      </Suspense>
      <QuoteTable rows={rows} />
    </div>
  );
}

export default function HinnapakkumisedPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-10 w-56 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
        </div>
      }
    >
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
