import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { InquiryPriority, InquiryStatus } from "@prisma/client";
import { Plus } from "lucide-react";
import { InquiryFilters } from "@/components/inquiries/inquiry-filters";
import { InquiryTable } from "@/components/inquiries/inquiry-table";
import { requireOrgSession } from "@/lib/auth/session";
import {
  getMonthlyInquiryUsage,
  listInquiries,
  type InquiryListSort,
} from "@/lib/inquiries/queries";

export const metadata: Metadata = {
  title: "Päringud – Päringuhaldus.ee",
};

export const instant = false;

type SearchParams = Promise<{
  q?: string;
  status?: string;
  priority?: string;
  archived?: string;
  sort?: string;
}>;

function isStatus(value: string | undefined): value is InquiryStatus {
  return (
    value === "UUS" ||
    value === "TOOS" ||
    value === "OOTEL" ||
    value === "LOPETATUD" ||
    value === "TYHISTATUD"
  );
}

function isPriority(value: string | undefined): value is InquiryPriority {
  return value === "MADAL" || value === "TAVALINE" || value === "KORGE";
}

function isSort(value: string | undefined): value is InquiryListSort {
  return (
    value === "createdAt_desc" ||
    value === "createdAt_asc" ||
    value === "title_asc" ||
    value === "title_desc" ||
    value === "status_asc" ||
    value === "priority_desc"
  );
}

async function ParingudContent({
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

  const [rows, usage] = await Promise.all([
    listInquiries(session.organizationId, {
      q: params.q,
      status: isStatus(params.status) ? params.status : "ALL",
      priority: isPriority(params.priority) ? params.priority : "ALL",
      archived,
      sort: isSort(params.sort) ? params.sort : "createdAt_desc",
    }),
    getMonthlyInquiryUsage(session.organizationId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl">
            Päringud
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)] sm:text-base">
            Halda kliendipäringuid, staatusi ja märkmeid ühes kohas. Sellel kuul
            loodud: {usage.used}/{usage.limit}.
          </p>
        </div>
        <Link
          href="/app/paringud/uus"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--brand-hover)]"
        >
          <Plus className="size-4" aria-hidden />
          Uus päring
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="h-36 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
        }
      >
        <InquiryFilters />
      </Suspense>

      <InquiryTable rows={rows} />
    </div>
  );
}

export default function ParingudPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
          <div className="h-36 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
          <div className="h-64 animate-pulse rounded-2xl bg-[var(--surface-muted)]" />
        </div>
      }
    >
      <ParingudContent searchParams={searchParams} />
    </Suspense>
  );
}
